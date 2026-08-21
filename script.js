// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");
const foodListContainer = document.getElementById("food-list-container");
const consistencyWarning = document.getElementById("consistency-warning");
const foodSearchInput = document.getElementById("food-search");
const favoritesContainer = document.getElementById("favorites-container");
const dailyLogContainer = document.getElementById("daily-log-container");
const dailyTotals = document.getElementById("daily-totals");
const MINIMUM_MATCH_SCORE = 70;
const navTabs = document.querySelectorAll(".nav-tab");
const tabPages = document.querySelectorAll(".tab-page");

// Login page elements
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const roleOptions = document.querySelectorAll(".role-option");
const selectedRoleLabel = document.getElementById("selected-role-label");
const adminNavTab = document.querySelector('.nav-tab[data-tab="admin"]');
let selectedRole = "user";

// Admin form elements
const foodForm = document.getElementById("food-form");
const foodFormMessage = document.getElementById("food-form-message");
const customFoodsContainer = document.getElementById("custom-foods-container");
const customFoodCount = document.getElementById("custom-food-count");

// Hero buttons
const goToPlannerBtn = document.getElementById("go-to-planner");
const goToDatabaseBtn = document.getElementById("go-to-database");

// Food database elements
const foodCount = document.getElementById("food-count");
const dietFilterButtons = document.querySelectorAll(".diet-filter-btn");
let selectedDietFilter = "all";
const requirementsForm = document.getElementById("requirements-form");
const requirementsError = document.getElementById("requirements-error");
const requirementsResult = document.getElementById("requirements-result");


function switchTab(tabName, updateUrl) {
    const targetPage = document.getElementById("tab-" + tabName);
    const targetTab = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');

    if (!targetPage || !targetTab) {
        return;
    }

  tabPages.forEach(function (page) {
    page.classList.remove("active");
  });
  navTabs.forEach(function (tab) {
    tab.classList.remove("active");
  });

    targetPage.classList.add("active");
    targetTab.classList.add("active");

    if (updateUrl !== false && window.location.hash !== "#" + tabName) {
        window.history.pushState(null, "", "#" + tabName);
    }
}

function getTabFromUrl() {
    const tabName = window.location.hash.slice(1);
    return document.getElementById("tab-" + tabName) ? tabName : "home";
}

window.addEventListener("hashchange", function () {
    switchTab(getTabFromUrl(), false);
});

document.addEventListener("click", function (event) {
    const tab = event.target.closest(".nav-tab");

    if (tab) {
        event.preventDefault();
        switchTab(tab.dataset.tab);
    }
});

let foodData = []; // will hold our loaded food list
const CUSTOM_FOODS_KEY = "macro-meal-custom-foods";
const DELETED_FOODS_KEY = "macro-meal-deleted-food-ids";

function getCustomFoods() {
    const storedFoods = localStorage.getItem(CUSTOM_FOODS_KEY);
    return storedFoods ? JSON.parse(storedFoods) : [];
}

function saveCustomFoods(foods) {
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
}

function getDeletedFoodIds() {
    const storedIds = localStorage.getItem(DELETED_FOODS_KEY);
    return storedIds ? JSON.parse(storedIds) : [];
}

function saveDeletedFoodIds(ids) {
    localStorage.setItem(DELETED_FOODS_KEY, JSON.stringify(ids));
}

function displayCustomFoods() {
    customFoodCount.textContent = foodData.length + " total";
    customFoodsContainer.innerHTML = "";

    if (foodData.length === 0) {
        customFoodsContainer.innerHTML = "<p class='empty-message'>No food items available.</p>";
        return;
    }

    foodData.forEach(function (food) {
        const foodItem = document.createElement("div");
        foodItem.classList.add("food-item", "custom-food-item");
        foodItem.innerHTML = `
            <div><strong>${food.name}</strong><p>${food.caloriesPer100g} kcal | P ${food.proteinPer100g}g | C ${food.carbsPer100g}g | F ${food.fatPer100g}g | ${food.category} | ${food.dietType}</p></div>
            <button class="delete-custom-food-btn" data-id="${food.id}" type="button">Remove</button>
        `;
        customFoodsContainer.appendChild(foodItem);
    });
}

// Render the food list on the page
function displayFoods(foods) {
    foodListContainer.innerHTML = ""; // clear previous content
        foodCount.textContent = `${foods.length} ${foods.length === 1 ? "food" : "foods"}`;

        if (foods.length === 0) {
                foodListContainer.innerHTML = '<p class="empty-foods">No foods match your search.</p>';
                return;
        }

    foods.forEach(function (food) {
        const foodItem = document.createElement("div");
        foodItem.classList.add("food-item");

        foodItem.innerHTML = `
            <div class="food-item-topline">
                <span class="food-category">${food.category}</span>
                <span class="food-diet">${food.dietType === "veg" ? "Vegetarian" : "Non-veg"}</span>
            </div>
            <strong>${food.name}</strong>
            <div class="food-calories">${food.caloriesPer100g} kcal <span>per 100g</span></div>
            <div class="food-macros">
                <span><b>${food.proteinPer100g}g</b> protein</span>
                <span><b>${food.carbsPer100g}g</b> carbs</span>
                <span><b>${food.fatPer100g}g</b> fat</span>
            </div>
    `;

        foodListContainer.appendChild(foodItem);
    });
}

// Filter foods based on dietary preference
function filterByDiet(foods, preference) {
    if (preference === "veg") {
        return foods.filter(function (food) {
            return food.dietType === "veg";
        });
    } else if (preference === "non-veg") {
        return foods.filter(function (food) {
            return food.dietType === "non-veg";
        });
    }
    return foods; // default: return all foods
}

function renderFilteredFoods() {
    const searchTerm = foodSearchInput.value.toLowerCase().trim();
    const filteredResults = foodData.filter(function (food) {
        const matchesSearch = !searchTerm || food.name.toLowerCase().includes(searchTerm);
        const matchesDiet = selectedDietFilter === "all" || food.dietType === selectedDietFilter;
        return matchesSearch && matchesDiet;
    });

    displayFoods(filteredResults);
}

// Debounce search input for better performance
let searchDebounceTimer;
function setupSearchDebounce() {
    foodSearchInput.addEventListener("input", function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(renderFilteredFoods, 300);
    });
}

function calculateNutrition(food, quantityInGrams) {
    const multiplier = quantityInGrams / 100;

    return {
        name: food.name,
        quantityInGrams: quantityInGrams,
        calories: food.caloriesPer100g * multiplier,
        protein: food.proteinPer100g * multiplier,
        carbs: food.carbsPer100g * multiplier,
        fat: food.fatPer100g * multiplier
    };
}



const SERVING_SIZES = [25, 50, 75, 100, 125, 150, 175, 200]; // grams to try per food

function generateCombinations(foods) {
    const combinations = [];

    for (let i = 0; i < foods.length; i++) {
        SERVING_SIZES.forEach(function (quantity) {
            combinations.push([{ food: foods[i], quantity: quantity }]);
        });

        for (let j = i + 1; j < foods.length; j++) {
            SERVING_SIZES.forEach(function (qty1) {
                SERVING_SIZES.forEach(function (qty2) {
                    combinations.push([
                        { food: foods[i], quantity: qty1 },
                        { food: foods[j], quantity: qty2 }
                    ]);

                    for (let k = j + 1; k < foods.length; k++) {
                        SERVING_SIZES.forEach(function (qty3) {
                            combinations.push([
                                { food: foods[i], quantity: qty1 },
                                { food: foods[j], quantity: qty2 },
                                { food: foods[k], quantity: qty3 }
                            ]);
                        });
                    }
                });
            });
        }
    }

    return combinations;
}

function calculateCombinationTotal(combination) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    combination.forEach(function (item) {
        const nutrition = calculateNutrition(item.food, item.quantity);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbs += nutrition.carbs;
        totalFat += nutrition.fat;
    });

    return {
        items: combination,
        totalCalories: totalCalories,
        totalProtein: totalProtein,
        totalCarbs: totalCarbs,
        totalFat: totalFat
    };
}

const CALORIE_TOLERANCE_PERCENT = 10; // ±10%

function isWithinTolerance(combinationTotal, targetCalories) {
    const lowerBound = targetCalories * (1 - CALORIE_TOLERANCE_PERCENT / 100);
    const upperBound = targetCalories * (1 + CALORIE_TOLERANCE_PERCENT / 100);

    return combinationTotal.totalCalories >= lowerBound && combinationTotal.totalCalories <= upperBound;
}

function calculateMatchScore(combinationTotal, target) {
    const calorieDiff = Math.abs(combinationTotal.totalCalories - target.calories) / target.calories;
    const proteinDiff = Math.abs(combinationTotal.totalProtein - target.protein) / target.protein;
    const carbsDiff = Math.abs(combinationTotal.totalCarbs - target.carbs) / target.carbs;
    const fatDiff = Math.abs(combinationTotal.totalFat - target.fat) / target.fat;

    // Macro grams are the user's primary targets; calories are a secondary check.
    const averageDiff = (calorieDiff * 0.2) + (proteinDiff * 0.3) + (carbsDiff * 0.3) + (fatDiff * 0.2);

    const matchScore = Math.max(0, (1 - averageDiff) * 100);

    return matchScore;
}

function findBestMeals(foods, target) {
    const allCombinations = generateCombinations(foods);
    const validMeals = [];

    allCombinations.forEach(function (combination) {
        const total = calculateCombinationTotal(combination);

        if (isWithinTolerance(total, target.calories)) {
            const score = calculateMatchScore(total, target);

            if (score >= MINIMUM_MATCH_SCORE) {
                validMeals.push({
                    combination: total,
                    score: score
                });
            }
        }
    });

    validMeals.sort(function (a, b) {
        return b.score - a.score; // highest score first
    });

    return validMeals;
}

function displayResults(results) {
    window.currentResults = results;

    resultsContainer.innerHTML = ""; // clear previous content

    if (results.length === 0) {
        resultsContainer.innerHTML = "<div class='no-results-message'>No combination found within the selected tolerance. Try adjusting your calorie, protein, carb, or fat target.</div>";
        return;
    }

    const topResults = results.slice(0, 5); // show top 5 matches only

    topResults.forEach(function (result) {
        const card = document.createElement("div");
        card.classList.add("meal-card");

        let foodListHTML = "";
        result.combination.items.forEach(function (item) {
            foodListHTML += `<li>${item.food.name} — ${item.quantity}g</li>`;
        });

        card.innerHTML = `
      <div class="meal-card-header">
        <span class="match-score">${result.score.toFixed(1)}% match</span>
      </div>
      <ul class="meal-food-list">${foodListHTML}</ul>
      <div class="meal-totals">
        Calories: ${result.combination.totalCalories.toFixed(0)} kcal |
        Protein: ${result.combination.totalProtein.toFixed(1)}g |
        Carbs: ${result.combination.totalCarbs.toFixed(1)}g |
        Fat: ${result.combination.totalFat.toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="save-favorite-btn">Save to Favorites</button>
        <button class="log-meal-btn">Log This Meal</button>
      </div>
    `;

        resultsContainer.appendChild(card);
    });
}

function saveFavorite(mealTotal) {
    const favorites = getFavorites();

    const favoriteMeal = {
        id: Date.now(), // unique id based on timestamp
        items: mealTotal.items.map(function (item) {
            return { name: item.food.name, quantity: item.quantity };
        }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat
    };

    favorites.push(favoriteMeal);
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getFavorites() {
    const stored = localStorage.getItem("favorites");
    return stored ? JSON.parse(stored) : [];
}

function displayFavorites() {
    const favorites = getFavorites();
    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = "<p>No favorites saved yet.</p>";
        return;
    }

    favorites.forEach(function (favorite) {
        const card = document.createElement("div");
        card.classList.add("meal-card");

        let foodListHTML = "";
        favorite.items.forEach(function (item) {
            foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`;
        });

        card.innerHTML = `
      <ul class="meal-food-list">${foodListHTML}</ul>
      <div class="meal-totals">
        Calories: ${favorite.totalCalories.toFixed(0)} kcal |
        Protein: ${favorite.totalProtein.toFixed(1)}g |
        Carbs: ${favorite.totalCarbs.toFixed(1)}g |
        Fat: ${favorite.totalFat.toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="delete-favorite-btn" data-id="${favorite.id}">Remove</button>
      </div>
    `;

        favoritesContainer.appendChild(card);
    });
}

function deleteFavorite(id) {
    let favorites = getFavorites();
    favorites = favorites.filter(function (favorite) {
        return favorite.id !== id;
    });
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getTodayKey() {
    const today = new Date();
    return "log-" + today.toISOString().split("T")[0]; // e.g. "log-2026-08-17"
}

function logMeal(mealTotal) {
    const key = getTodayKey();
    const todayLog = getTodayLog();

    const loggedMeal = {
        id: Date.now(),
        items: mealTotal.items.map(function (item) {
            return { name: item.food.name, quantity: item.quantity };
        }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat
    };

    todayLog.push(loggedMeal);
    localStorage.setItem(key, JSON.stringify(todayLog));
}

function getTodayLog() {
    const key = getTodayKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function displayDailyLog() {
    const todayLog = getTodayLog();
    dailyLogContainer.innerHTML = "";

    if (todayLog.length === 0) {
        dailyLogContainer.innerHTML = "<p>No meals logged today.</p>";
        dailyTotals.innerHTML = "";
        return;
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    todayLog.forEach(function (meal) {
        totalCalories += meal.totalCalories;
        totalProtein += meal.totalProtein;
        totalCarbs += meal.totalCarbs;
        totalFat += meal.totalFat;

        const card = document.createElement("div");
        card.classList.add("meal-card");

        let foodListHTML = "";
        meal.items.forEach(function (item) {
            foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`;
        });

        card.innerHTML = `
      <ul class="meal-food-list">${foodListHTML}</ul>
      <div class="meal-totals">
        Calories: ${meal.totalCalories.toFixed(0)} kcal |
        Protein: ${meal.totalProtein.toFixed(1)}g |
        Carbs: ${meal.totalCarbs.toFixed(1)}g |
        Fat: ${meal.totalFat.toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="delete-log-btn" data-id="${meal.id}">Remove</button>
      </div>
    `;

        dailyLogContainer.appendChild(card);
    });

    dailyTotals.innerHTML = `
    <strong>Today's Totals:</strong>
    Calories: ${totalCalories.toFixed(0)} kcal |
    Protein: ${totalProtein.toFixed(1)}g |
    Carbs: ${totalCarbs.toFixed(1)}g |
    Fat: ${totalFat.toFixed(1)}g
  `;
}

function deleteLoggedMeal(id) {
    const key = getTodayKey();
    let todayLog = getTodayLog();
    todayLog = todayLog.filter(function (meal) {
        return meal.id !== id;
    });
    localStorage.setItem(key, JSON.stringify(todayLog));
}
// Load food data from JSON file
async function loadFoodData() {
    try {
        const response = await fetch("data/foods.json");

        if (!response.ok) {
            throw new Error("Failed to load food data: " + response.status);
        }

        const deletedFoodIds = getDeletedFoodIds().map(String);
        const builtInFoods = (await response.json()).filter(function (food) {
            return !deletedFoodIds.includes(String(food.id));
        });
        foodData = builtInFoods.concat(getCustomFoods());

        // Display all foods with filters applied
        renderFilteredFoods();
        displayCustomFoods();
        document.getElementById("stat-food-count").textContent = foodData.length;
    } catch (error) {
        console.error("Error loading food data:", error);
        formError.textContent = "Could not load food data. Please refresh the page.";
    }
}

loadFoodData();
displayFavorites();
displayDailyLog();
displayCustomFoods();

roleOptions.forEach(function (option) {
    option.addEventListener("click", function () {
        selectedRole = option.dataset.role;
        roleOptions.forEach(function (roleOption) {
            roleOption.classList.toggle("active", roleOption === option);
        });
        selectedRoleLabel.textContent = selectedRole === "admin" ? "Admin" : "User";
        loginError.textContent = "";
    });
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        loginError.textContent = "Enter your username and password.";
        return;
    }

    if (selectedRole === "admin" && (username !== "admin" || password !== "admin123")) {
        loginError.textContent = "Use the demo admin credentials shown below.";
        return;
    }

    document.getElementById("login-page").classList.add("hidden");
    document.querySelectorAll(".app-shell").forEach(function (element) {
        element.classList.add("visible");
    });
    adminNavTab.classList.toggle("visible", selectedRole === "admin");
    switchTab(selectedRole === "admin" ? "admin" : "home");
});

foodForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(foodForm);
    const customFood = {
        id: "custom-" + Date.now(),
        name: formData.get("name").trim(),
        category: formData.get("category"),
        dietType: formData.get("dietType"),
        caloriesPer100g: Number(formData.get("calories")),
        proteinPer100g: Number(formData.get("protein")),
        carbsPer100g: Number(formData.get("carbs")),
        fatPer100g: Number(formData.get("fat")),
        source: "Added locally"
    };

    const customFoods = getCustomFoods();
    customFoods.push(customFood);
    saveCustomFoods(customFoods);
    foodData.push(customFood);
    displayCustomFoods();
    renderFilteredFoods();
    document.getElementById("stat-food-count").textContent = foodData.length;
    foodForm.reset();
    foodFormMessage.textContent = customFood.name + " was added to the database.";
});

customFoodsContainer.addEventListener("click", function (event) {
    if (!event.target.classList.contains("delete-custom-food-btn")) {
        return;
    }

    const foodId = event.target.dataset.id;
    const isCustomFood = getCustomFoods().some(function (food) {
        return String(food.id) === foodId;
    });

    if (isCustomFood) {
        saveCustomFoods(getCustomFoods().filter(function (food) {
            return String(food.id) !== foodId;
        }));
    } else {
        const deletedFoodIds = getDeletedFoodIds();
        deletedFoodIds.push(foodId);
        saveDeletedFoodIds(deletedFoodIds);
    }

    foodData = foodData.filter(function (food) {
        return String(food.id) !== foodId;
    });
    displayCustomFoods();
    renderFilteredFoods();
    document.getElementById("stat-food-count").textContent = foodData.length;
});

setupSearchDebounce();

dietFilterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedDietFilter = button.dataset.dietFilter;

        dietFilterButtons.forEach(function (filterButton) {
            filterButton.classList.toggle("active", filterButton === button);
        });

        renderFilteredFoods();
    });
});

resultsContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("save-favorite-btn")) {
        const card = event.target.closest(".meal-card");
        const cardIndex = Array.from(resultsContainer.children).indexOf(card);
        const mealToSave = window.currentResults[cardIndex].combination;

        saveFavorite(mealToSave);
        displayFavorites();
        alert("Meal saved to favorites!");
    }

    if (event.target.classList.contains("log-meal-btn")) {
        const card = event.target.closest(".meal-card");
        const cardIndex = Array.from(resultsContainer.children).indexOf(card);
        const mealToLog = window.currentResults[cardIndex].combination;

        logMeal(mealToLog);
        displayDailyLog();
        alert("Meal logged for today!");
    }
});

favoritesContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-favorite-btn")) {
        const id = Number(event.target.dataset.id);
        deleteFavorite(id);
        displayFavorites(); // re-render after deletion
    }
});

// Handle form submission
macroForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const calories = Number(document.getElementById("calories").value);
    const protein = Number(document.getElementById("protein").value);
    const carbs = Number(document.getElementById("carbs").value);
    const fat = Number(document.getElementById("fat").value);

    // Reset previous error
    formError.textContent = "";

    // Validation checks

    if (!calories || !protein || !carbs || !fat) {
        formError.textContent = "Please fill in all fields.";
        return;
    }

    if (calories <= 0 || protein <= 0 || carbs <= 0 || fat <= 0) {
        formError.textContent = "Values must be greater than 0.";
        return;
    }

    const macroCalories = protein * 4 + carbs * 4 + fat * 9;

    if (macroCalories > calories) {
        consistencyWarning.style.display = "block";
        consistencyWarning.textContent =
            `Your macro targets total ${macroCalories.toFixed(0)} kcal, which exceeds your calorie target of ${calories} kcal. Please adjust your targets.`;
        return;
    } else {
        consistencyWarning.style.display = "none";
    }

    const dietPreference = document.querySelector('input[name="dietPreference"]:checked').value;
    const filteredFoods = filterByDiet(foodData, dietPreference);

    const target = { calories, protein, carbs, fat };
    const results = findBestMeals(filteredFoods, target);

    displayResults(results);
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

dailyLogContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-log-btn")) {
        const id = Number(event.target.dataset.id);
        deleteLoggedMeal(id);
        displayDailyLog();
    }
});

document.getElementById("go-to-planner").addEventListener("click", function () {
  switchTab("planner");
});

document.getElementById("go-to-database").addEventListener("click", function () {
  switchTab("database");
});
document.querySelector(".nav-logo").addEventListener("click", function () {
  switchTab("home");
});

requirementsForm.addEventListener("submit", function (event) {
    event.preventDefault();
    requirementsError.textContent = "";

    const weight = Number(document.getElementById("body-weight").value);
    const height = Number(document.getElementById("body-height").value);
    const age = Number(document.getElementById("body-age").value);
    const sex = document.getElementById("body-sex").value;
    const activity = Number(document.getElementById("activity-level").value);
    const goal = document.getElementById("body-goal").value;

    if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
        requirementsError.textContent = "Enter valid body details to calculate targets.";
        requirementsResult.hidden = true;
        return;
    }

    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (sex === "male" ? 5 : -161);
    const maintenanceCalories = bmr * activity;
    const goalAdjustment = goal === "lose" ? 0.8 : goal === "gain" ? 1.1 : 1;
    const calories = Math.round(maintenanceCalories * goalAdjustment);
    const protein = Math.round(weight * (goal === "gain" ? 1.8 : 1.6));
    const fat = Math.round((calories * 0.3) / 9);
    const carbs = Math.max(1, Math.round((calories - (protein * 4) - (fat * 9)) / 4));
    const bmi = weight / Math.pow(height / 100, 2);

    requirementsResult.innerHTML = `
        <div class="requirement-total">${calories} <span>kcal / day</span></div>
        <div class="requirement-stats">
            <div class="requirement-stat"><strong>${protein}g</strong><span>Protein</span></div>
            <div class="requirement-stat"><strong>${carbs}g</strong><span>Carbs</span></div>
            <div class="requirement-stat"><strong>${fat}g</strong><span>Fat</span></div>
        </div>
        <p class="section-description">BMR ${Math.round(bmr)} kcal · Maintenance ${Math.round(maintenanceCalories)} kcal · BMI ${bmi.toFixed(1)}</p>
        <button type="button" class="use-targets-btn">Use These Targets</button>
    `;
    requirementsResult.hidden = false;

    requirementsResult.querySelector(".use-targets-btn").addEventListener("click", function () {
        document.getElementById("calories").value = calories;
        document.getElementById("protein").value = protein;
        document.getElementById("carbs").value = carbs;
        document.getElementById("fat").value = fat;
        document.getElementById("macro-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });
});