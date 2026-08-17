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


let foodData = []; // will hold our loaded food list

// Render the food list on the page
function displayFoods(foods) {
    foodListContainer.innerHTML = ""; // clear previous content

    foods.forEach(function (food) {
        const foodItem = document.createElement("div");
        foodItem.classList.add("food-item");

        foodItem.innerHTML = `
      <strong>${food.name}</strong>
      <p>Calories: ${food.caloriesPer100g} | Protein: ${food.proteinPer100g}g | Carbs: ${food.carbsPer100g}g | Fat: ${food.fatPer100g}g | Diet: ${food.dietType}</p>
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
    }
    return foods; // "non-veg" or "both" -> no exclusion
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



function deriveCarbsAndFat(calories, protein) {
    const proteinCalories = protein * 4;
    const remainingCalories = calories - proteinCalories;

    const carbsCalories = remainingCalories * 0.5;
    const fatCalories = remainingCalories * 0.5;

    const carbsGrams = carbsCalories / 4;
    const fatGrams = fatCalories / 9;

    return {
        carbs: carbsGrams,
        fat: fatGrams,
        isPossible: remainingCalories > 0
    };
}

const SERVING_SIZES = [50, 100, 150, 200]; // grams to try per food

function generateCombinations(foods) {
    const combinations = [];

    for (let i = 0; i < foods.length; i++) {
        for (let j = i + 1; j < foods.length; j++) {
            SERVING_SIZES.forEach(function (qty1) {
                SERVING_SIZES.forEach(function (qty2) {
                    combinations.push([
                        { food: foods[i], quantity: qty1 },
                        { food: foods[j], quantity: qty2 }
                    ]);
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

    const averageDiff = (calorieDiff + proteinDiff + carbsDiff + fatDiff) / 4;

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
        resultsContainer.innerHTML = "<div class='no-results-message'>No combination found within the selected tolerance. Try adjusting your calorie or protein target.</div>"; 
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

        foodData = await response.json();
        

        displayFoods(foodData);
    } catch (error) {
        console.error("Error loading food data:", error);
        formError.textContent = "Could not load food data. Please refresh the page.";
    }
}

loadFoodData();
displayFavorites();
displayDailyLog();

foodSearchInput.addEventListener("input", function () {
    const searchTerm = foodSearchInput.value.toLowerCase();

    const filteredResults = foodData.filter(function (food) {
        return food.name.toLowerCase().includes(searchTerm);
    });

    displayFoods(filteredResults);
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
    

    // Reset previous error
    formError.textContent = "";

    // Validation checks

    if (!calories || !protein) {
        formError.textContent = "Please fill in all fields.";
        return;
    }

    if (calories <= 0 || protein <= 0) {
        formError.textContent = "Values must be greater than 0.";
        return;
    }

    const derived = deriveCarbsAndFat(calories, protein);

    if (!derived.isPossible) {
        consistencyWarning.style.display = "block";
        consistencyWarning.textContent =
            `Your protein target alone (${(protein * 4).toFixed(0)} kcal) exceeds your calorie target (${calories} kcal). Please lower protein or raise calories.`;
        return;
    } else {
        consistencyWarning.style.display = "none";
    }

    const dietPreference = document.querySelector('input[name="dietPreference"]:checked').value;
    const filteredFoods = filterByDiet(foodData, dietPreference);

    const target = { calories, protein, carbs: derived.carbs, fat: derived.fat };
    //   const target = { calories, protein, carbs, fat };
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