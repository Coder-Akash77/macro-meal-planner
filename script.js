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
const MAX_CLOSEST_SUGGESTIONS = 1000;
const navTabs = document.querySelectorAll(".nav-tab");
const tabPages = document.querySelectorAll(".tab-page");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

const signupForm = document.getElementById("signup-form");
const signupError = document.getElementById("signup-error");
const showSignupBtn = document.getElementById("show-signup");
const showLoginBtn = document.getElementById("show-login");

const USERS_KEY = "macro-meal-users";

const roleOptions = document.querySelectorAll(".role-option");
const selectedRoleLabel = document.getElementById("selected-role-label");
const adminNavTab = document.querySelector('.nav-tab[data-tab="admin"]');

const LOGIN_KEY = "macro-meal-login";

let selectedRole = "user";

// Admin form elements
const foodForm = document.getElementById("food-form");
const foodFormMessage = document.getElementById("food-form-message");
const customFoodsContainer = document.getElementById("custom-foods-container");
const customFoodCount = document.getElementById("custom-food-count");
const restoreDatabaseButton = document.getElementById("restore-database-button");
const restoreDatabaseMessage = document.getElementById("restore-database-message");

// Hero buttons
const goToPlannerBtn = document.getElementById("go-to-planner");
const goToDatabaseBtn = document.getElementById("go-to-database");

// Calorie calculator elements
const calorieForm = document.getElementById("calorie-form");
const calorieResults = document.getElementById("calorie-results");
const calorieFormError = document.getElementById("calorie-form-error");

// Food database elements
const foodCount = document.getElementById("food-count");
const databaseTotalCount = document.getElementById("database-total-count");
const databaseVegCount = document.getElementById("database-veg-count");
const databaseNonVegCount = document.getElementById("database-nonveg-count");
const dietFilterButtons = document.querySelectorAll(".diet-filter-btn");
const categoryFilter = document.getElementById("category-filter");
const clearFoodFiltersButton = document.getElementById("clear-food-filters");
let selectedDietFilter = "all";
let selectedCategoryFilter = "all";
const CALORIE_TOLERANCE_PERCENT = 5;
const MACRO_TOLERANCE_PERCENT = 10;


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
        const macroCalories = (food.proteinPer100g * 4) + (food.carbsPer100g * 4) + (food.fatPer100g * 9);

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
        foodListContainer.innerHTML = `
                    <div class="empty-foods">
                        <span class="empty-foods-icon" aria-hidden="true">⌕</span>
                        <strong>No foods found</strong>
                        <p>Try another search or clear the active filters.</p>
                        <button type="button" class="empty-foods-reset">Clear filters</button>
                    </div>`;
        return;
    }

    foods.forEach(function (food) {
        const foodItem = document.createElement("div");
        foodItem.classList.add("food-item");

        const proteinCalories = Number(food.proteinPer100g) * 4;
        const carbsCalories = Number(food.carbsPer100g) * 4;
        const fatCalories = Number(food.fatPer100g) * 9;
        const fiberGrams = getFiberPer100g(food);
        const totalMacroAmount = proteinCalories + carbsCalories + fatCalories + fiberGrams * 2;

        const proteinShare = (proteinCalories / totalMacroAmount) * 100;
        const carbsShare = (carbsCalories / totalMacroAmount) * 100;
        const fatShare = (fatCalories / totalMacroAmount) * 100;
        const fiberShare = (fiberGrams * 2 / totalMacroAmount) * 100;

        foodItem.innerHTML = `
            <div class="food-item-topline">
                <span class="food-category">${food.category}</span>
                <span class="food-diet ${food.dietType === "veg" ? "food-diet-veg" : "food-diet-non-veg"}">
                    <span aria-hidden="true">${food.dietType === "veg" ? "●" : "◆"}</span>
                    ${food.dietType === "veg" ? "Vegetarian" : "Non-veg"}
                </span>
            </div>
            <strong>${food.name}</strong>
            <div class="food-calories">
    ${(proteinCalories + carbsCalories + fatCalories + fiberGrams * 2).toFixed(0)} kcal
    <span>per 100g</span>
</div>
            <div class="food-macros">
                <span><b>${food.proteinPer100g}g</b><small>Protein</small></span>
                <span><b>${food.carbsPer100g}g</b><small>Carbs</small></span>
                <span><b>${food.fatPer100g}g</b><small>Fat</small></span>
                <span><b>${getFiberPer100g(food).toFixed(1)}g</b><small>Fiber</small></span>
            </div>
            <div class="macro-distribution" aria-label="Macro calorie distribution">
                <span class="macro-bar macro-bar-protein" style="width: ${proteinShare}%"></span>
                <span class="macro-bar macro-bar-carbs" style="width: ${carbsShare}%"></span>
                <span class="macro-bar macro-bar-fat" style="width: ${fatShare}%"></span>
                <span class="macro-bar macro-bar-fiber" style="width: ${fiberShare}%"></span>
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
            return food.dietType === "non-veg" || food.category !== "Protein";
        });
    }
    return foods; // default: return all foods
}

function renderFilteredFoods() {
    const searchTerm = foodSearchInput.value.toLowerCase().trim();
    const filteredResults = foodData.filter(function (food) {
        const matchesSearch = !searchTerm || food.name.toLowerCase().includes(searchTerm);
        const matchesDiet = selectedDietFilter === "all" || food.dietType === selectedDietFilter;
        const matchesCategory = selectedCategoryFilter === "all" || food.category === selectedCategoryFilter;
        return matchesSearch && matchesDiet && matchesCategory;
    });

    displayFoods(filteredResults);
}

function updateDatabaseStats() {
    databaseTotalCount.textContent = foodData.length;
    databaseVegCount.textContent = foodData.filter(function (food) {
        return food.dietType === "veg";
    }).length;
    databaseNonVegCount.textContent = foodData.filter(function (food) {
        return food.dietType === "non-veg";
    }).length;
}

// Debounce search input for better performance
let searchDebounceTimer;
function setupSearchDebounce() {
    foodSearchInput.addEventListener("input", function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(renderFilteredFoods, 300);
    });
}

function estimateFiberPer100g(food) {
    const name = food.name.toLowerCase();

    if (food.category === "Vegetable") {
        return 3;
    }
    if (food.category === "Fat") {
        if (name.includes("oil") || name.includes("butter") || name.includes("ghee") || name.includes("mayonnaise")) {
            return 0;
        }
        return 7;
    }
    if (food.category === "Dairy" || food.dietType === "non-veg") {
        return 0;
    }
    if (name.includes("bean") || name.includes("lentil") || name.includes("chickpea") || name.includes("dal")) {
        return 7;
    }
    if (name.includes("oat") || name.includes("whole wheat") || name.includes("barley") || name.includes("quinoa")) {
        return 8;
    }
    if (name.includes("fruit") || name.includes("apple") || name.includes("banana") || name.includes("orange") || name.includes("mango") || name.includes("berry") || name.includes("grape")) {
        return 2.5;
    }
    return 1.5;
}

function getFiberPer100g(food) {
    return Number.isFinite(Number(food.fiberPer100g)) ? Number(food.fiberPer100g) : estimateFiberPer100g(food);
}

function calculateNutrition(food, quantityInGrams) {
    const multiplier = quantityInGrams / 100;

    const protein = food.proteinPer100g * multiplier;
    const carbs = food.carbsPer100g * multiplier;
    const fat = food.fatPer100g * multiplier;
    const fiber = getFiberPer100g(food) * multiplier;

    return {
        name: food.name,
        quantityInGrams: quantityInGrams,

        // Fiber contributes 2 kcal per gram
        calories: (protein * 4) + (carbs * 4) + (fat * 9) + (fiber * 2),

        protein: protein,
        carbs: carbs,
        fat: fat,
        fiber: fiber
    };
}


function getServingSizes(food) {
    const name = food.name.toLowerCase();

    if (name.includes("psyllium")) {
        return [5, 10, 15, 20];
    }

    if (food.category === "Protein") {
        if (name.includes("egg")) {
            return [50, 100, 150, 200];
        }
        if (name.includes("powder") || name.includes("whey")) {
            return [20, 25, 30, 35, 40, 50];
        }
        if (name.includes("lentil") || name.includes("bean") || name.includes("chickpea") || name.includes("dal") || name.includes("edamame")) {
            return [100, 125, 150, 175, 200, 250];
        }
       return [100, 125, 150, 175, 200, 225, 250, 275, 300];
    }

    if (food.category === "Carbs") {
        if (name.includes("oat")) {
            return [40, 50, 60, 75, 80, 100];
        }
        if (name.includes("bread") || name.includes("tortilla") || name.includes("roti")) {
            return [50, 75, 100, 125, 150, 175];
        }
        if (name.includes("banana") || name.includes("apple") || name.includes("orange") || name.includes("mango") || name.includes("grape")) {
            return [75, 100, 125, 150, 200];
        }
        return [100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500]; 
     }

    if (food.category === "Fat") {
    if (name.includes("oil") || name.includes("ghee") || name.includes("butter")) {
        return [5, 10, 15, 20, 25, 30, 35];
    }
    if (name.includes("nut") || name.includes("almond") || name.includes("peanut") || name.includes("seed") || name.includes("tahini")) {
        return [15, 20, 25, 30, 40, 50, 60];
    }
    return [25, 50, 75, 100, 125];
}

    if (food.category === "Dairy") {
        return [100, 125, 150, 175, 200, 250];
    }

    return [50, 100, 150, 200];
}

function getSearchServingSizes(food) {
    const servingSizes = getServingSizes(food);
    const candidateIndexes = [0, Math.floor((servingSizes.length - 1) / 2), servingSizes.length - 1];

    return candidateIndexes.filter(function (index, position, indexes) {
        return indexes.indexOf(index) === position;
    }).map(function (index) {
        return servingSizes[index];
    });
}

function generateCombinations(foods) {
    const combinations = [];

    for (let i = 0; i < foods.length; i++) {
        getServingSizes(foods[i]).forEach(function (quantity) {
            combinations.push([{ food: foods[i], quantity: quantity }]);
        });

        for (let j = i + 1; j < foods.length; j++) {
            getServingSizes(foods[i]).forEach(function (qty1) {
                getServingSizes(foods[j]).forEach(function (qty2) {
                    combinations.push([
                        { food: foods[i], quantity: qty1 },
                        { food: foods[j], quantity: qty2 }
                    ]);

                    for (let k = j + 1; k < foods.length; k++) {
                        getServingSizes(foods[k]).forEach(function (qty3) {
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
    let totalFiber = 0;

    combination.forEach(function (item) {
        const nutrition = calculateNutrition(item.food, item.quantity);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbs += nutrition.carbs;
        totalFat += nutrition.fat;
        totalFiber += nutrition.fiber;
    });

    return {
        items: combination,
        totalCalories: totalCalories,
        totalProtein: totalProtein,
        totalCarbs: totalCarbs,
        totalFat: totalFat,
        totalFiber: totalFiber
    };
}

function isWithinTolerance(combinationTotal, target) {
    const calorieDifference = Math.abs(combinationTotal.totalCalories - target.calories) / target.calories;
    const proteinDifference = Math.abs(combinationTotal.totalProtein - target.protein) / target.protein;
    const carbDifference = Math.abs(combinationTotal.totalCarbs - target.carbs) / target.carbs;
    const fatDifference = Math.abs(combinationTotal.totalFat - target.fat) / target.fat;
    const fiberDifference = target.fiber
        ? Math.abs(combinationTotal.totalFiber - target.fiber) / target.fiber
        : 0;

    return calorieDifference <= CALORIE_TOLERANCE_PERCENT / 100 &&
        proteinDifference <= MACRO_TOLERANCE_PERCENT / 100 &&
        carbDifference <= MACRO_TOLERANCE_PERCENT / 100 &&
        fatDifference <= MACRO_TOLERANCE_PERCENT / 100 &&
        fiberDifference <= MACRO_TOLERANCE_PERCENT / 100;
}

function calculateMatchScore(combinationTotal, target) {
    const calorieDiff = Math.abs(combinationTotal.totalCalories - target.calories) / target.calories;
    const proteinDiff = Math.abs(combinationTotal.totalProtein - target.protein) / target.protein;
    const carbsDiff = Math.abs(combinationTotal.totalCarbs - target.carbs) / target.carbs;
    const fatDiff = Math.abs(combinationTotal.totalFat - target.fat) / target.fat;
    const fiberDiff = target.fiber
        ? Math.abs(combinationTotal.totalFiber - target.fiber) / target.fiber
        : 0;

    const averageDiff = (calorieDiff * 0.15) + (proteinDiff * 0.25) + (carbsDiff * 0.25) + (fatDiff * 0.2) + (fiberDiff * 0.15);

    const matchScore = Math.max(0, (1 - averageDiff) * 100);

    return matchScore;
}
function findBestMeals(foods, target, dietPreference) {
    const allSuggestions = findBalancedMealSuggestions(target, dietPreference, true);
    return selectDiverseMeals(allSuggestions, 5);
}

function selectDiverseMeals(suggestions, count) {
    const selected = [];
    const usedFoodIds = new Set();
    let previousProteinId = null;

    while (selected.length < count && selected.length < suggestions.length) {
        let bestSuggestion = null;
        let bestScore = -Infinity;

        suggestions.forEach(function (suggestion) {
            if (selected.indexOf(suggestion) !== -1) {
                return;
            }

            const proteinItem = suggestion.combination.items.find(function (item) {
                return item.food.category === "Protein";
            });
            const proteinId = proteinItem ? String(proteinItem.food.id) : null;

            let repetitionPenalty = 0;
            if (proteinId && proteinId === previousProteinId) {
                repetitionPenalty += 20;
            }

            suggestion.combination.items.forEach(function (item) {
                const foodId = String(item.food.id);
                if (usedFoodIds.has(foodId)) {
                    if (item.food.category === "Protein") {
                        repetitionPenalty += 15;
                    } else if (item.food.category === "Carbs") {
                        repetitionPenalty += 8;
                    } else if (item.food.category === "Fat") {
                        repetitionPenalty += 5;
                    } else {
                        repetitionPenalty += 3;
                    }
                }
            });

            const adjustedScore = suggestion.score - repetitionPenalty;

            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestSuggestion = suggestion;
            }
        });

        if (!bestSuggestion) {
            break;
        }

        selected.push(bestSuggestion);

        bestSuggestion.combination.items.forEach(function (item) {
            usedFoodIds.add(String(item.food.id));
        });

        const selectedProtein = bestSuggestion.combination.items.find(function (item) {
            return item.food.category === "Protein";
        });
        if (selectedProtein) {
            previousProteinId = String(selectedProtein.food.id);
        }
    }

    return selected;
}

function displayResults(results) {
    window.currentResults = results;

    resultsContainer.innerHTML = ""; // clear previous content

    if (results.length === 0) {
        resultsContainer.innerHTML = "<div class='no-results-message'>No combination found within the selected tolerance. Try adjusting your calorie, protein, carb, fat, or fiber target.</div>";
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
                Fat: ${result.combination.totalFat.toFixed(1)}g |
                Fiber: ${result.combination.totalFiber.toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="save-favorite-btn">Save to Favorites</button>
        <button class="log-meal-btn">Log This Meal</button>
      </div>
    `;

        resultsContainer.appendChild(card);
    });
}

function getMealSignature(items) {
    return items
        .map(function (item) {
            const name = item.food ? item.food.name : item.name;
            return name + "-" + item.quantity;
        })
        .sort()
        .join("|");
}

function saveFavorite(mealTotal) {
    const favorites = getFavorites();

    const newSignature = getMealSignature(mealTotal.items);

    const alreadySaved = favorites.some(function (favorite) {
        return getMealSignature(favorite.items) === newSignature;
    });

    if (alreadySaved) {
        return false; // already in favorites, don't add a duplicate
    }

    const favoriteMeal = {
        id: Date.now(), // unique id based on timestamp
        items: mealTotal.items.map(function (item) {
            return { name: item.food.name, quantity: item.quantity };
        }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
    };

    favorites.push(favoriteMeal);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    return true;
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
        Fat: ${favorite.totalFat.toFixed(1)}g |
        Fiber: ${Number(favorite.totalFiber || 0).toFixed(1)}g
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
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
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
    let totalFiber = 0;

    todayLog.forEach(function (meal) {
        totalCalories += meal.totalCalories;
        totalProtein += meal.totalProtein;
        totalCarbs += meal.totalCarbs;
        totalFat += meal.totalFat;
        totalFiber += Number(meal.totalFiber || 0);

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
        Fat: ${meal.totalFat.toFixed(1)}g |
        Fiber: ${Number(meal.totalFiber || 0).toFixed(1)}g
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
    Fat: ${totalFat.toFixed(1)}g |
    Fiber: ${totalFiber.toFixed(1)}g
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
        const response = await fetch("data/foods.json", { cache: "no-store" });

        if (!response.ok) {
            throw new Error("Failed to load food data: " + response.status);
        }

        const deletedFoodIds = getDeletedFoodIds().map(String);
        const builtInFoods = (await response.json()).filter(function (food) {
            return !deletedFoodIds.includes(String(food.id));
        });
        foodData = builtInFoods.concat(getCustomFoods());

        // Display all foods with filters applied
        updateDatabaseStats();
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

        selectedRoleLabel.textContent =
            selectedRole === "admin" ? "Admin" : "User";

        loginError.textContent = "";

        if (selectedRole === "admin") {
            document.getElementById("show-signup").style.display = "none";
        } else {
            document.getElementById("show-signup").style.display = "inline";
        }
    });
});


function showApp(role, username) {
    document.getElementById("login-page").classList.add("hidden");

    document.querySelectorAll(".app-shell").forEach(function (element) {
        element.classList.add("visible");
    });

    adminNavTab.classList.toggle("visible", role === "admin");

    selectedRole = role;

    const roleLabel = role === "admin" ? "Admin" : "User";
    document.getElementById("profile-avatar").textContent = username.charAt(0).toUpperCase();
    document.getElementById("profile-username").textContent = username;
    document.getElementById("profile-role-badge").textContent = roleLabel;
    document.getElementById("profile-info-username").textContent = username;
    document.getElementById("profile-info-role").textContent = roleLabel;
    updateProfileStats();

    switchTab(role === "admin" ? "admin" : "home");
}

function updateProfileStats() {
    document.getElementById("profile-favorites-count").textContent = getFavorites().length;
    document.getElementById("profile-log-count").textContent = getTodayLog().length;
    document.getElementById("profile-custom-count").textContent = getCustomFoods().length;
}

function getUsers() {
    const storedUsers = localStorage.getItem(USERS_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

showSignupBtn.addEventListener("click", function () {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("signup-view").style.display = "block";
});

showLoginBtn.addEventListener("click", function () {
    document.getElementById("signup-view").style.display = "none";
    document.getElementById("login-view").style.display = "block";
    signupError.textContent = "";
});

signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    signupError.textContent = "";

    if (password !== confirmPassword) {
        signupError.textContent = "Passwords do not match.";
        if (username.length < 3) { signupError.textContent = "Username must be at least 3 characters."; return; }
        if (password.length < 4) { signupError.textContent = "Password must be at least 4 characters."; return; }
        return;
    }

    const users = getUsers();

    const existingUser = users.find(function (user) {
        return user.username.toLowerCase() === username.toLowerCase();
    });

    if (existingUser) {
        signupError.textContent = "Username already exists.";
        return;
    }

    users.push({
        username: username,
        password: password,
        role: "user"
    });

    saveUsers(users);

    alert("Account created successfully. You can now log in.");

    signupForm.reset();

    document.getElementById("signup-view").classList.add("hidden");
    document.getElementById("login-view").classList.remove("hidden");
});



loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    loginError.textContent = "";

    if (!username || !password) {
        loginError.textContent = "Enter your username and password.";
        return;
    }

    if (selectedRole === "admin") {
        if (username !== "admin" || password !== "admin123") {
            loginError.textContent = "Use the demo admin credentials shown below.";
            return;
        }
        localStorage.setItem(LOGIN_KEY, JSON.stringify({ loggedIn: true, role: "admin", username: "admin" }));
        showApp("admin", "admin");
        return;
    }

    const users = getUsers();
    const validUser = users.find(function (user) {
        return user.username === username && user.password === password;
    });

    if (!validUser) {
        loginError.textContent = "Invalid username or password.";
        return;
    }

    localStorage.setItem(LOGIN_KEY, JSON.stringify({ loggedIn: true, role: "user", username: validUser.username }));
    showApp("user", validUser.username);
});

const savedLogin = localStorage.getItem(LOGIN_KEY);

if (savedLogin) {
    try {
        const loginData = JSON.parse(savedLogin);

        if (loginData.loggedIn && loginData.role) {
            showApp(loginData.role, loginData.username);
        }

    } catch (error) {
        localStorage.removeItem(LOGIN_KEY);
    }
}

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
    updateDatabaseStats();
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
    updateDatabaseStats();
    displayCustomFoods();
    renderFilteredFoods();
    document.getElementById("stat-food-count").textContent = foodData.length;
});

restoreDatabaseButton.addEventListener("click", async function () {
    if (!window.confirm("Restore the original database? This will remove all locally added foods and undo built-in food removals.")) {
        return;
    }

    localStorage.removeItem(CUSTOM_FOODS_KEY);
    localStorage.removeItem(DELETED_FOODS_KEY);
    await loadFoodData();
    restoreDatabaseMessage.textContent = "The original food database has been restored.";
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

        const wasSaved = saveFavorite(mealToSave);
        displayFavorites();
        updateProfileStats();

        if (wasSaved) {
            alert("Meal saved to favorites!");
        } else {
            alert("This meal is already in your favorites.");
        }
    }

    if (event.target.classList.contains("log-meal-btn")) {
        const card = event.target.closest(".meal-card");
        const cardIndex = Array.from(resultsContainer.children).indexOf(card);
        const mealToLog = window.currentResults[cardIndex].combination;

        logMeal(mealToLog);
        displayDailyLog();
        updateProfileStats();
        alert("Meal logged for today!");
    }
});

favoritesContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-favorite-btn")) {
        const id = Number(event.target.dataset.id);
        deleteFavorite(id);
        deleteLoggedMeal(id);
        displayFavorites(); // re-render after deletion
        updateProfileStats();
    }
});

// Handle form submission
macroForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const calories = Number(document.getElementById("calories").value);
    const protein = Number(document.getElementById("protein").value);
    const carbs = Number(document.getElementById("carbs").value);
    const fat = Number(document.getElementById("fat").value);
    const fiber = Number(document.getElementById("fiber").value);

    // Reset previous error
    formError.textContent = "";

    // Validation checks


    const macroCalories = protein * 4 + carbs * 4 + fat * 9 + fiber * 2;

    const calorieDifferencePercent =
        Math.abs(macroCalories - calories) / calories * 100;

    if (calorieDifferencePercent > 20) {
        consistencyWarning.style.display = "block";

        consistencyWarning.innerHTML = `
        <div class="consistency-message">
            <strong>Your calorie and macro targets don't match.</strong>
            <p>
                Your calorie target is ${calories} kcal, but your
                protein, carbs,fatand fiber add up to only
                ${macroCalories.toFixed(0)} kcal.
            </p>

            <button type="button"
                    id="go-to-calculator-btn"
                    class="go-to-calculator-btn">
                Calculate Your Daily Needs
            </button>
        </div>
    `;

        // Make sure the user sees the message
        setTimeout(function () {
            consistencyWarning.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 100);

        document
            .getElementById("go-to-calculator-btn")
            .addEventListener("click", function () {
                switchTab("calculator");
            });

        return;
    }

    // consistencyWarning.style.display = "none";

    else {
        consistencyWarning.style.display = "none";
    }

    const dietPreference = document.querySelector('input[name="dietPreference"]:checked').value;
    const filteredFoods = filterByDiet(foodData, dietPreference);

    const target = { calories, protein, carbs, fat, fiber };
    const results = findBestMeals(filteredFoods, target, dietPreference);

    displayResults(results);
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

dailyLogContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-log-btn")) {
        const id = Number(event.target.dataset.id);
        deleteLoggedMeal(id);
        displayDailyLog();
        updateProfileStats();
    }
});

document.getElementById("go-to-planner").addEventListener("click", function () {
    switchTab("planner");
});

document.getElementById("go-to-database").addEventListener("click", function () {
    switchTab("database");
});

function getCalculatorMealFoods(dietPreference) {
    const eligibleFoods = filterByDiet(foodData, dietPreference);
    const preferredFoods = eligibleFoods.filter(function (food) {
        return food.category === "Protein";
    }).slice(0, 8).concat(eligibleFoods.filter(function (food) {
        return food.category === "Carbs";
    }).slice(0, 8), eligibleFoods.filter(function (food) {
        return food.category === "Fat";
    }).slice(0, 8), eligibleFoods.filter(function (food) {
        return food.category === "Dairy";
    }).slice(0, 7), eligibleFoods.filter(function (food) {
        return food.category === "Vegetable";
    }).slice(0, 7));

    return preferredFoods.filter(function (food, index, foods) {
        return foods.findIndex(function (candidate) {
            return String(candidate.id) === String(food.id);
        }) === index;
    });
}
function scaleCombinationToTarget(items, target) {
    const currentTotal = calculateCombinationTotal(items);

    if (currentTotal.totalCalories <= 0) {
        return items;
    }

    let scaleFactor = target.calories / currentTotal.totalCalories;

    // Keep scaling within a sane range so items don't become unrealistic
    scaleFactor = Math.max(0.5, Math.min(scaleFactor, 2.5));

    const scaledItems = items.map(function (item) {
        const rawQuantity = item.quantity * scaleFactor;
        const roundedQuantity = Math.max(5, Math.round(rawQuantity / 5) * 5);
        return { food: item.food, quantity: roundedQuantity };
    });

    return scaledItems;
}
function findBalancedMealSuggestions(mealTarget, dietPreference, includeClosest) {
    const foods = getCalculatorMealFoods(dietPreference);
    const proteins = foods
        .filter(food => food.category === "Protein")
        .slice(0, 7);
    const carbs = foods
        .filter(food => food.category === "Carbs")
        .slice(0, 5);
    const fats = foods
        .filter(food => food.category === "Fat")
        .slice(0, 4);
    const vegetables = foods
        .filter(food => food.category === "Vegetable")
        .slice(0, 4);
    const fiberSources = foodData
        .filter(function (food) {
            const name = food.name.toLowerCase();
            return (
                name.includes("lentil") ||
                name.includes("bean") ||
                name.includes("chickpea") ||
                name.includes("dal") ||
                name.includes("oat") ||
                name.includes("whole wheat") ||
                name.includes("barley") ||
                name.includes("seed") ||
                food.category === "Vegetable"
            );
        })
        .sort(function (a, b) {
            return getFiberPer100g(b) - getFiberPer100g(a);
        })
        .slice(0, 3);

    const suggestions = [];
    const seen = new Set();

    function addSuggestion(items) {
        if (suggestions.length >= 500) {
        return; // safety cap — stop searching once we have enough candidates
    }
    
        const originalTotal = calculateCombinationTotal(items);
    const originalScore = calculateMatchScore(originalTotal, mealTarget);

    // Also try scaling quantities up/down toward the target
    const scaledItems = scaleCombinationToTarget(items, mealTarget);
    const scaledTotal = calculateCombinationTotal(scaledItems);
    const scaledScore = calculateMatchScore(scaledTotal, mealTarget);

    // Keep whichever version scores better
    const useScaled = scaledScore > originalScore;
    const finalItems = useScaled ? scaledItems : items;
    const combinationTotal = useScaled ? scaledTotal : originalTotal;
    
        const signature = items
            .map(item => String(item.food.id))
            .sort()
            .join("-");

        if (seen.has(signature)) {
            return;
        }

        seen.add(signature);

        if (
            !includeClosest &&
            !isWithinTolerance(combinationTotal, mealTarget)
        ) {
            return;
        }

                const score = useScaled ? scaledScore : originalScore;

        if (includeClosest || score >= MINIMUM_MATCH_SCORE) {
            suggestions.push({
                combination: combinationTotal,
                score: score
            });
        }
    }
    
    function fastServingSizes(food) {
    const sizes = getServingSizes(food);

    if (sizes.length <= 3) {
        return sizes;
    }

    return [
        sizes[0],
        sizes[Math.floor(sizes.length / 2)],
        sizes[sizes.length - 1]
    ];
}

    proteins.forEach(function (protein) {

        carbs.forEach(function (carb) {

            fats.forEach(function (fat) {

                vegetables.forEach(function (vegetable) {

                    
                    if (
                        protein.id === carb.id ||
                        protein.id === fat.id ||
                        protein.id === vegetable.id ||
                        carb.id === fat.id ||
                        carb.id === vegetable.id ||
                        fat.id === vegetable.id
                    ) {
                        return;
                    }

                    // Pick only the best fiber sources
                    fiberSources.forEach(function (fiberSource) {

                        if (
                            [
                                protein,
                                carb,
                                fat,
                                vegetable
                            ].some(function (food) {
                                return String(food.id) ===
                                    String(fiberSource.id);
                            })
                        ) {
                            return;
                        }

                        fastServingSizes(protein).forEach(function (proteinQuantity) {

                            fastServingSizes(carb).forEach(function (carbQuantity) {

                                fastServingSizes(fat).forEach(function (fatQuantity) {

                                    fastServingSizes(vegetable).forEach(function (vegetableQuantity) {

                                        fastServingSizes(fiberSource).forEach(function (fiberQuantity) {

                                            addSuggestion([
                                                {
                                                    food: protein,
                                                    quantity: proteinQuantity
                                                },
                                                {
                                                    food: carb,
                                                    quantity: carbQuantity
                                                },
                                                {
                                                    food: fat,
                                                    quantity: fatQuantity
                                                },
                                                {
                                                    food: vegetable,
                                                    quantity: vegetableQuantity
                                                },
                                                {
                                                    food: fiberSource,
                                                    quantity: fiberQuantity
                                                }
                                            ]);

                                        });

                                    });

                                });

                            });

                        });

                    });

                });

            });

        });

    });

    suggestions.sort(function (a, b) {
        return b.score - a.score;
    });


    if (suggestions.length > 100) {
        suggestions.length = 100;
    }

    return suggestions;

}
function displayCalculatorMealSuggestions(mealTarget, dailyTarget, mealsPerDay, dietPreference) {
    const allSuggestions = findBalancedMealSuggestions(mealTarget, dietPreference, true);
    const usedFoodIds = new Set();
    const usedMealSignatures = new Set();
    const mealSuggestions = [];

    let previousProteinId = null;

    for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {

        let bestSuggestion = null;
        let bestScore = -Infinity;

        allSuggestions.forEach(function (suggestion) {

            const signature = suggestion.combination.items
                .map(function (item) {
                    return String(item.food.id);
                })
                .sort()
                .join("-");

            // Don't show the exact same meal again
            if (usedMealSignatures.has(signature)) {
                return;
            }

            // Find protein source
            const proteinItem = suggestion.combination.items.find(function (item) {
                return item.food.category === "Protein";
            });

            if (!proteinItem) {
                return;
            }

            const proteinId = String(proteinItem.food.id);

            // IMPORTANT:
            // Same protein is NOT allowed in consecutive meals
            if (proteinId === previousProteinId) {
                return;
            }

            let repetitionPenalty = 0;

            suggestion.combination.items.forEach(function (item) {

                const foodId = String(item.food.id);

                if (usedFoodIds.has(foodId)) {

                    if (item.food.category === "Protein") {
                        repetitionPenalty += 12;
                    } else if (item.food.category === "Carbs") {
                        repetitionPenalty += 8;
                    } else if (item.food.category === "Fat") {
                        repetitionPenalty += 6;
                    } else {
                        repetitionPenalty += 4;
                    }
                }
            });

            const adjustedScore =
                suggestion.score - repetitionPenalty;

            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestSuggestion = suggestion;
            }
        });

        // Fallback:
        // If no meal is available without repeating the previous
        // protein, allow a different meal with the best score.
        if (!bestSuggestion) {

            allSuggestions.forEach(function (suggestion) {

                const signature = suggestion.combination.items
                    .map(function (item) {
                        return String(item.food.id);
                    })
                    .sort()
                    .join("-");

                if (usedMealSignatures.has(signature)) {
                    return;
                }

                const proteinItem = suggestion.combination.items.find(function (item) {
                    return item.food.category === "Protein";
                });

                if (!proteinItem) {
                    return;
                }

                let adjustedScore = suggestion.score;

                suggestion.combination.items.forEach(function (item) {
                    if (usedFoodIds.has(String(item.food.id))) {
                        adjustedScore -= 3;
                    }
                });

                if (!bestSuggestion || adjustedScore > bestScore) {
                    bestScore = adjustedScore;
                    bestSuggestion = suggestion;
                }
            });
        }

        if (!bestSuggestion) {
            break;
        }

        const bestSignature = bestSuggestion.combination.items
            .map(function (item) {
                return String(item.food.id);
            })
            .sort()
            .join("-");

        usedMealSignatures.add(bestSignature);

        bestSuggestion.combination.items.forEach(function (item) {
            usedFoodIds.add(String(item.food.id));
        });

        // Remember this meal's protein
        const selectedProtein = bestSuggestion.combination.items.find(function (item) {
            return item.food.category === "Protein";
        });

        if (selectedProtein) {
            previousProteinId = String(selectedProtein.food.id);
        }

        mealSuggestions.push(bestSuggestion);
    }
    const suggestionsContainer = document.getElementById("calculator-meal-suggestions");

    if (!suggestionsContainer) {
        return;
    }

    if (mealSuggestions.length === 0) {
        suggestionsContainer.innerHTML = "<p class='calculator-meal-empty'>No close meal matches were found for this split. Try a different number of meals.</p>";
        return;
    }

    const planTotals = mealSuggestions.reduce(function (totals, suggestion) {
        totals.calories += suggestion.combination.totalCalories;
        totals.protein += suggestion.combination.totalProtein;
        totals.carbs += suggestion.combination.totalCarbs;
        totals.fat += suggestion.combination.totalFat;
        totals.fiber += suggestion.combination.totalFiber;
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const planTotalsContainer = document.getElementById("calculator-plan-totals");
    if (planTotalsContainer) {
        planTotalsContainer.innerHTML = `
            <strong>Generated plan totals</strong>
            <span>Target ${dailyTarget.calories.toFixed(0)} kcal | Plan ${planTotals.calories.toFixed(0)} kcal | Difference ${(planTotals.calories - dailyTarget.calories).toFixed(0)} kcal</span>
            <span>P ${planTotals.protein.toFixed(0)}g / ${dailyTarget.protein.toFixed(0)}g | C ${planTotals.carbs.toFixed(0)}g / ${dailyTarget.carbs.toFixed(0)}g | F ${planTotals.fat.toFixed(0)}g / ${dailyTarget.fat.toFixed(0)}g | Fiber ${planTotals.fiber.toFixed(0)}g / ${dailyTarget.fiber.toFixed(0)}g</span>`;
    }

    suggestionsContainer.innerHTML = mealSuggestions.map(function (suggestion, index) {
        const items = suggestion.combination.items.map(function (item) {
            return `<li>${item.food.name} <span>${item.quantity}g</span></li>`;
        }).join("");

        return `
            <article class="calculator-meal-card">
                <div class="calculator-meal-card-heading"><strong>Meal ${index + 1}</strong><span>${suggestion.score.toFixed(0)}% match</span></div>
                <ul>${items}</ul>
                <small>${suggestion.combination.totalCalories.toFixed(0)} kcal | ${suggestion.combination.totalProtein.toFixed(0)}g protein | ${suggestion.combination.totalCarbs.toFixed(0)}g carbs | ${suggestion.combination.totalFat.toFixed(0)}g fat | ${suggestion.combination.totalFiber.toFixed(0)}g fiber</small>
            </article>`;
    }).join("");
}

calorieForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const heightCm = Number(document.getElementById("height").value);
    const height = heightCm / 100;
    const weight = Number(document.getElementById("weight").value);
    const activityLevel = Number(document.getElementById("activity-level").value);
    const mealsPerDay = Number(document.getElementById("meals-per-day").value);
    const dietPreference = document.getElementById("calculator-diet").value;
    const goal = document.querySelector('input[name="calorieGoal"]:checked').value;

    calorieFormError.textContent = "";

    if (!height || !weight || height <= 0 || weight <= 0) {
        calorieFormError.textContent = "Enter a valid height and weight to continue.";
        return;
    }

    const bmi = weight / (height * height);
    const maintenanceCalories = weight * 24 * activityLevel;
    const goalAdjustments = {
        "fat-loss": 0.8,
        "muscle-build": 1.1,
        maintenance: 1
    };
    const calorieTarget = goal === "weight-gain"
        ? maintenanceCalories + 300
        : maintenanceCalories * goalAdjustments[goal];
    const calories = goal === "weight-gain"
        ? Math.round(calorieTarget)
        : Math.round(calorieTarget / 50) * 50;
    const proteinPerKgByGoal = {
        "fat-loss": 1.8,
        "muscle-build": 1.8,
        maintenance: 1.4,
        "weight-gain": 1.8
    };
    const fatRatioByGoal = {
        "fat-loss": 0.30,
        "muscle-build": 0.25,
        maintenance: 0.30,
        "weight-gain": 0.25
    };
    const protein = Math.round(weight * proteinPerKgByGoal[goal]);

    const fat = Math.round(
        (calories * fatRatioByGoal[goal]) / 9
    );

    const fiber = Math.round(
        calories / 1000 * 14
    );

    // Fiber = 2 kcal/g
    const carbs = Math.max(
        1,
        Math.round(
            (calories - (protein * 4) - (fat * 9) - (fiber * 2)) / 4
        )
    );
    const mealTarget = {
        calories: Math.round(calories / mealsPerDay),
        protein: Math.round(protein / mealsPerDay * 10) / 10,
        carbs: Math.round(carbs / mealsPerDay * 10) / 10,
        fat: Math.round(fat / mealsPerDay * 10) / 10,
        fiber: Math.round(fiber / mealsPerDay * 10) / 10
    };
    const goalLabels = {
        "fat-loss": "Fat loss",
        "muscle-build": "Muscle build",
        maintenance: "Maintenance",
        "weight-gain": "Weight gain"
    };
    const roundedMaintenance = Math.round(maintenanceCalories);
    const calorieDifference = calories - roundedMaintenance;
    const adjustmentLabel = calorieDifference > 0
        ? `${calorieDifference.toLocaleString()} kcal added`
        : calorieDifference < 0
            ? `${Math.abs(calorieDifference).toLocaleString()} kcal reduced`
            : "No calorie change";
    const adjustmentOperator = calorieDifference > 0 ? "+" : calorieDifference < 0 ? "-" : "=";
    const calorieBreakdown = `
        <div class="calorie-breakdown" aria-label="Calorie target calculation">
            <div><span>Estimated maintenance</span><strong>${roundedMaintenance.toLocaleString()} kcal</strong></div>
            <span class="calorie-breakdown-operator">${adjustmentOperator}</span>
            <div><span>Your adjustment</span><strong>${adjustmentLabel}</strong></div>
            <span class="calorie-breakdown-operator">=</span>
            <div><span>Daily target</span><strong>${calories.toLocaleString()} kcal</strong></div>
        </div>`;

    calorieResults.innerHTML = `
        <div class="calorie-result-heading">
            <div><span class="section-kicker">YOUR DAILY ESTIMATE</span><h3>${goalLabels[goal]} targets</h3></div>
            <span class="goal-result-badge">${goalLabels[goal]}</span>
        </div>
        <div class="calorie-highlight"><strong>${calories.toLocaleString()}</strong><span>kcal per day</span></div>
        ${calorieBreakdown}
        <div class="calculator-metrics">
            <div><strong>${protein}g</strong><span>Protein</span></div>
            <div><strong>${carbs}g</strong><span>Carbs</span></div>
            <div><strong>${fat}g</strong><span>Fats</span></div>
            <div><strong>${fiber}g</strong><span>Fiber</span></div>
        </div>
        <div class="meal-split-heading"><strong>${mealsPerDay} meals per day</strong><span>Each meal: ${mealTarget.calories} kcal | P ${mealTarget.protein}g | C ${mealTarget.carbs}g | F ${mealTarget.fat}g | Fiber ${mealTarget.fiber}g</span></div>
        <div id="calculator-meal-suggestions" class="calculator-meal-suggestions"></div>
        <div id="calculator-plan-totals" class="calculator-plan-totals"></div>
        <div class="calculator-context"><span>BMI estimate <strong>${bmi.toFixed(1)}</strong></span><span>Activity adjusted</span></div>
    `;

    displayCalculatorMealSuggestions(mealTarget, { calories, protein, carbs, fat, fiber }, mealsPerDay, dietPreference);
});

document.querySelector(".nav-logo").addEventListener("click", function () {
    switchTab("home");
});

categoryFilter.addEventListener("change", function () {
    selectedCategoryFilter = categoryFilter.value;
    renderFilteredFoods();
});

function clearFoodFilters() {
    foodSearchInput.value = "";
    selectedDietFilter = "all";
    selectedCategoryFilter = "all";
    categoryFilter.value = "all";
    dietFilterButtons.forEach(function (filterButton) {
        filterButton.classList.toggle("active", filterButton.dataset.dietFilter === "all");
    });
    renderFilteredFoods();
}

clearFoodFiltersButton.addEventListener("click", clearFoodFilters);

foodListContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("empty-foods-reset")) {
        clearFoodFilters();
    }
});

document.getElementById("logout-btn").addEventListener("click", function () {
    localStorage.removeItem(LOGIN_KEY);
    location.reload();
});