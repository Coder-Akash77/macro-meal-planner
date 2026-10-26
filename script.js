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
const TOKEN_KEY = "macro-meal-token";
const API_BASE = "http://localhost:5000";
let favoritesCache = [];
let dailyLogCache = [];

function getApiHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...getApiHeaders(), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    return data;
}

async function loadPersistedMealData() {
    if (selectedRole !== "user" || !localStorage.getItem(TOKEN_KEY)) return;
    try {
        const date = new Date().toISOString().slice(0, 10);
        const [favoriteData, logData] = await Promise.all([apiRequest("/api/favorites"), apiRequest(`/api/daily-logs?date=${date}`)]);
        favoritesCache = favoriteData.favorites || [];
        dailyLogCache = logData.meals || [];
        displayFavorites();
        displayDailyLog();
        updateProfileStats();
    } catch (error) {
        console.error("Could not load favorites or daily logs:", error);
        alert(`Could not load saved favorites or daily logs from the server: ${error.message}`);
    }
}

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
const CUSTOM_MEAL_PLAN_KEY = "macro-meal-custom-plan";


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

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function copyMealItems(items) {
    return items.map(function (item) {
        return { food: item.food, quantity: Number(item.quantity) };
    });
}

function serializeMealItems(items) {
    return items.map(function (item) {
        return { food: item.food, quantity: Number(item.quantity) };
    });
}

function getMealResultState(result) {
    return {
        id: result.id,
        target: result.target,
        dietPreference: result.dietPreference,
        mealSlot: result.mealSlot,
        editing: result.editing,
        pickerMode: result.pickerMode,
        pickerQuery: result.pickerQuery,
        pickerFoodId: result.pickerFoodId,
        pickerQuantity: result.pickerQuantity,
        replaceIndex: result.replaceIndex,
        originalItems: serializeMealItems(result.originalCombination.items),
        items: serializeMealItems(result.combination.items),
        editBaselineItems: result.editBaselineItems
            ? serializeMealItems(result.editBaselineItems)
            : null
    };
}

function saveMealPlan() {
    const results = window.currentResults || [];
    if (results.length === 0) {
        localStorage.removeItem(CUSTOM_MEAL_PLAN_KEY);
        return;
    }

    localStorage.setItem(CUSTOM_MEAL_PLAN_KEY, JSON.stringify({
        target: results[0].target,
        dietPreference: results[0].dietPreference,
        results: results.map(getMealResultState)
    }));
}

function getMealTargetStatus(total, target) {
    const values = [
        { label: "calories", actual: total.totalCalories, target: target.calories, tolerance: CALORIE_TOLERANCE_PERCENT, unit: "kcal" },
        { label: "protein", actual: total.totalProtein, target: target.protein, tolerance: MACRO_TOLERANCE_PERCENT, unit: "g" },
        { label: "carbs", actual: total.totalCarbs, target: target.carbs, tolerance: MACRO_TOLERANCE_PERCENT, unit: "g" },
        { label: "fat", actual: total.totalFat, target: target.fat, tolerance: MACRO_TOLERANCE_PERCENT, unit: "g" },
        { label: "estimated fiber", actual: total.totalFiber, target: target.fiber, tolerance: MACRO_TOLERANCE_PERCENT, unit: "g" }
    ];
    const differences = values.filter(function (value) {
        return value.target > 0 && Math.abs(value.actual - value.target) / value.target > value.tolerance / 100;
    }).map(function (value) {
        const direction = value.actual > value.target ? "above" : "below";
        const difference = Math.abs(value.actual - value.target);
        return value.label + " " + direction + " by " + difference.toFixed(value.unit === "kcal" ? 0 : 1) + value.unit;
    });
    return differences;
}

function renderMealDashboard(result, total) {
    const target = result.target;
    const score = calculateMatchScore(total, target);
    const withinTolerance = isWithinTolerance(total, target);
    const originalTotal = result.originalCombination;
    const proteinCalories = total.totalProtein * 4;
    const carbsCalories = total.totalCarbs * 4;
    const fatCalories = total.totalFat * 9;
    const fiberCalories = total.totalFiber * 2;
    const macroCalories = proteinCalories + carbsCalories + fatCalories + fiberCalories;
    const proteinShare = macroCalories ? proteinCalories / macroCalories * 100 : 0;
    const carbsShare = macroCalories ? carbsCalories / macroCalories * 100 : 0;
    const fatShare = macroCalories ? fatCalories / macroCalories * 100 : 0;
    const fiberShare = macroCalories ? fiberCalories / macroCalories * 100 : 0;
    const feedback = getMealTargetStatus(total, target);
    const targetRows = [
        { label: "Protein", actual: total.totalProtein, target: target.protein, unit: "g", className: "protein" },
        { label: "Carbs", actual: total.totalCarbs, target: target.carbs, unit: "g", className: "carbs" },
        { label: "Fat", actual: total.totalFat, target: target.fat, unit: "g", className: "fat", },
        { label: "Fiber (est.)", actual: total.totalFiber, target: target.fiber, unit: "g", className: "fiber" }
    ];
    const targetBars = targetRows.map(function (row) {
        const progress = row.target > 0 ? Math.min(100, row.actual / row.target * 100) : 0;
        return `<div class="target-progress-row">
            <div><span>${row.label}</span><strong>${row.actual.toFixed(1)} / ${row.target} ${row.unit}</strong></div>
            <div class="target-progress-track"><span class="target-progress-${row.className}" style="width:${progress}%"></span></div>
        </div>`;
    }).join("");
    const calorieProgress = target.calories > 0 ? Math.min(100, total.totalCalories / target.calories * 100) : 0;
    const hasNutritionDifference = Math.abs(total.totalCalories - originalTotal.totalCalories) > 0.05 ||
        Math.abs(total.totalProtein - originalTotal.totalProtein) > 0.05 ||
        Math.abs(total.totalCarbs - originalTotal.totalCarbs) > 0.05 ||
        Math.abs(total.totalFat - originalTotal.totalFat) > 0.05 ||
        Math.abs(total.totalFiber - originalTotal.totalFiber) > 0.05;
    const originalDifference = hasNutritionDifference
        ? `<p class="original-nutrition-note">Original suggestion: ${originalTotal.totalCalories.toFixed(0)} kcal · P ${originalTotal.totalProtein.toFixed(1)}g · C ${originalTotal.totalCarbs.toFixed(1)}g · F ${originalTotal.totalFat.toFixed(1)}g · Fiber ${originalTotal.totalFiber.toFixed(1)}g</p>`
        : "";
    const statusMessage = feedback.length === 0
        ? "Within the planner's calorie and macro tolerance."
        : "To get closer, adjust: " + feedback.join(", ") + ".";

    return `<div class="meal-dashboard">
        <div class="meal-dashboard-top">
            <div class="macro-doughnut" role="img" aria-label="Estimated nutrition distribution: protein ${proteinShare.toFixed(0)}%, carbs ${carbsShare.toFixed(0)}%, fat ${fatShare.toFixed(0)}%, fiber ${fiberShare.toFixed(0)}%"
                style="--protein-share:${proteinShare}%;--carbs-share:${carbsShare}%;--fat-share:${fatShare}%;--fiber-share:${fiberShare}%">
                <div><strong>${score.toFixed(1)}%</strong><span>match</span></div>
            </div>
            <div class="macro-legend">
                <span><i class="legend-protein"></i>Protein ${total.totalProtein.toFixed(1)}g</span>
                <span><i class="legend-carbs"></i>Carbs ${total.totalCarbs.toFixed(1)}g</span>
                <span><i class="legend-fat"></i>Fat ${total.totalFat.toFixed(1)}g</span>
                <span><i class="legend-fiber"></i>Fiber (est.) ${total.totalFiber.toFixed(1)}g</span>
            </div>
        </div>
        <div class="calorie-progress">
            <div><strong>Estimated calories</strong><span>${total.totalCalories.toFixed(0)} / ${target.calories} kcal</span></div>
            <div class="target-progress-track"><span class="target-progress-calories" style="width:${calorieProgress}%"></span></div>
        </div>
        <div class="target-progress-list">${targetBars}</div>
        <p class="match-feedback ${withinTolerance ? "match-within-target" : "match-outside-target"}" role="status">${escapeHTML(statusMessage)}</p>
        <p class="nutrition-estimate-note">Calories are calculated from macros; fiber is estimated because the food database does not include fiber values.</p>
        ${originalDifference}
    </div>`;
}

function renderPlannerDaySummary(results) {
    const slots = ["Breakfast", "Lunch", "Dinner"];
    const selected = slots.map(function (slot) {
        return results.find(function (result) {
            return result.mealSlot === slot;
        });
    }).filter(Boolean);
    const total = selected.reduce(function (sum, result) {
        sum.totalCalories += result.combination.totalCalories;
        sum.totalProtein += result.combination.totalProtein;
        sum.totalCarbs += result.combination.totalCarbs;
        sum.totalFat += result.combination.totalFat;
        sum.totalFiber += result.combination.totalFiber;
        return sum;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 });
    const choices = selected.length
        ? `<p>${selected.map(function (result) {
            return escapeHTML(result.mealSlot) + ": " + result.combination.totalCalories.toFixed(0) + " kcal";
        }).join(" · ")}</p>
           <strong>Selected meals · daily total: ${total.totalCalories.toFixed(0)} estimated kcal | P ${total.totalProtein.toFixed(1)}g | C ${total.totalCarbs.toFixed(1)}g | F ${total.totalFat.toFixed(1)}g | Estimated fiber ${total.totalFiber.toFixed(1)}g</strong>`
        : "<p>Assign a suggestion to breakfast, lunch, or dinner to build a separate daily total. Each card shows its own meal totals.</p>";
    return `<div class="planner-day-summary"><strong>Selected meals — full day</strong>${choices}</div>`;
}

function renderFoodPicker(result) {
    if (!result.pickerMode) {
        return "";
    }
    const allowedFoods = filterByDiet(foodData, result.dietPreference);
    const query = (result.pickerQuery || "").trim().toLowerCase();
    const matchingFoods = allowedFoods.filter(function (food) {
        return !query || food.name.toLowerCase().includes(query);
    });
    const options = matchingFoods.map(function (food) {
        return `<option value="${escapeHTML(food.id)}" ${String(food.id) === String(result.pickerFoodId) ? "selected" : ""}>${escapeHTML(food.name)} · ${escapeHTML(food.category)}</option>`;
    }).join("");
    return `<div class="meal-food-picker">
        <label>Search ${result.dietPreference === "veg" ? "vegetarian" : "diet-compatible"} foods
            <input type="search" class="meal-food-search" data-result-id="${escapeHTML(result.id)}" value="${escapeHTML(result.pickerQuery || "")}" placeholder="Search foods..." aria-label="Search foods to add or replace">
        </label>
        <label>Choose food
            <select class="meal-food-choice" data-result-id="${escapeHTML(result.id)}" ${matchingFoods.length ? "" : "disabled"}>
                ${matchingFoods.length ? options : "<option>No matching foods</option>"}
            </select>
        </label>
        ${result.pickerMode === "add" ? `<label>Quantity in grams
            <input type="number" min="0.1" step="1" value="${Number(result.pickerQuantity) || 100}" data-role="picker-quantity" aria-label="Quantity in grams to add">
        </label>` : ""}
        <div class="meal-picker-actions">
            <button type="button" class="apply-food-picker" data-action="apply-food-picker" data-result-id="${escapeHTML(result.id)}" ${matchingFoods.length ? "" : "disabled"}>${result.pickerMode === "replace" ? "Replace food" : "Add selected food"}</button>
            <button type="button" class="cancel-food-picker" data-action="cancel-food-picker" data-result-id="${escapeHTML(result.id)}">Close</button>
        </div>
    </div>`;
}

function renderMealCard(result, index) {
    const total = calculateCombinationTotal(result.combination.items);
    result.combination = total;
    const foodRows = result.combination.items.map(function (item, itemIndex) {
        const nutrition = calculateNutrition(item.food, item.quantity);
        const controls = result.editing
            ? `<div class="meal-food-controls">
                <button type="button" class="quantity-step" data-action="decrease" data-index="${itemIndex}" aria-label="Decrease ${escapeHTML(item.food.name)} quantity">−</button>
                <label class="quantity-field"><span class="visually-hidden">Quantity in grams for ${escapeHTML(item.food.name)}</span><input type="number" min="0.1" step="1" value="${Number(item.quantity)}" data-role="quantity" data-index="${itemIndex}" aria-label="${escapeHTML(item.food.name)} quantity in grams"><span>g</span></label>
                <button type="button" class="quantity-step" data-action="increase" data-index="${itemIndex}" aria-label="Increase ${escapeHTML(item.food.name)} quantity">+</button>
                <button type="button" class="food-row-action" data-action="replace" data-index="${itemIndex}">Replace</button>
                <button type="button" class="food-row-remove" data-action="remove" data-index="${itemIndex}" aria-label="Remove ${escapeHTML(item.food.name)}">Remove</button>
            </div>`
            : `<span class="food-quantity">${Number(item.quantity)} g</span>`;
        return `<li class="meal-food-row">
            <div class="meal-food-info"><strong>${escapeHTML(item.food.name)}</strong>${controls}
                <small>${nutrition.calories.toFixed(0)} estimated kcal · P ${nutrition.protein.toFixed(1)}g · C ${nutrition.carbs.toFixed(1)}g · F ${nutrition.fat.toFixed(1)}g · Estimated fiber ${nutrition.fiber.toFixed(1)}g</small>
            </div>
        </li>`;
    }).join("");
    const slotOptions = ["Unassigned", "Breakfast", "Lunch", "Dinner"].map(function (slot) {
        return `<option value="${slot === "Unassigned" ? "" : slot}" ${result.mealSlot === (slot === "Unassigned" ? "" : slot) ? "selected" : ""}>${slot}</option>`;
    }).join("");
    const editActions = result.editing
        ? `<button type="button" class="add-food-btn" data-action="add-food">Add Food</button>
           <button type="button" class="restore-original-btn" data-action="restore-original">Restore Original</button>
           <button type="button" class="save-changes-btn" data-action="save-changes">Save Changes</button>
           <button type="button" class="cancel-edits-btn" data-action="cancel-edits">Cancel</button>`
        : `<button type="button" class="customize-meal-btn" data-action="edit-meal">Customize Meal</button>`;
    const rowContent = foodRows || `<li class="meal-empty-items">No foods in this meal yet. Use Add Food to build your combination.</li>`;
    return `<article class="meal-card" data-result-id="${escapeHTML(result.id)}">
        <div class="meal-card-header">
            <span class="suggestion-label">Suggestion ${index + 1}</span>
            <span class="match-score">${calculateMatchScore(total, result.target).toFixed(1)}% match</span>
        </div>
        <label class="meal-slot-label">Plan this as
            <select class="meal-slot-select" data-role="meal-slot" aria-label="Select meal slot for suggestion ${index + 1}">${slotOptions}</select>
        </label>
        <ul class="meal-food-list">${rowContent}</ul>
        ${renderFoodPicker(result)}
        <div class="meal-totals">
            Estimated calories: ${total.totalCalories.toFixed(0)} kcal | Protein: ${total.totalProtein.toFixed(1)}g | Carbs: ${total.totalCarbs.toFixed(1)}g | Fat: ${total.totalFat.toFixed(1)}g | Estimated fiber: ${total.totalFiber.toFixed(1)}g
        </div>
        ${renderMealDashboard(result, total)}
        <div class="meal-card-actions">
            ${editActions}
            <button type="button" class="save-favorite-btn">Save to Favorites</button>
            <button type="button" class="log-meal-btn">Log This Meal</button>
        </div>
    </article>`;
}

function displayResults(results) {
    window.currentResults = results;
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
        resultsContainer.innerHTML = "<div class='no-results-message'>No combination found within the selected tolerance. Try adjusting your calorie, protein, carb, fat, or fiber target.</div>";
        saveMealPlan();
        return;
    }

    resultsContainer.innerHTML = renderPlannerDaySummary(results) + results.slice(0, 5).map(renderMealCard).join("");
}

function restoreMealPlan() {
    const storedPlan = localStorage.getItem(CUSTOM_MEAL_PLAN_KEY);
    if (!storedPlan) {
        return;
    }

    const plan = JSON.parse(storedPlan);
    if (!plan || !plan.target || !Array.isArray(plan.results) || plan.results.length === 0) {
        return;
    }
    ["calories", "protein", "carbs", "fat", "fiber"].forEach(function (nutrient) {
        document.getElementById(nutrient).value = plan.target[nutrient];
    });
    const preference = document.querySelector('input[name="dietPreference"][value="' + plan.dietPreference + '"]');
    if (preference) {
        preference.checked = true;
    }

    window.currentResults = plan.results.map(function (saved) {
        const originalItems = saved.originalItems || saved.items || [];
        const items = saved.items || originalItems;
        const originalCombination = calculateCombinationTotal(copyMealItems(originalItems));
        const currentItems = copyMealItems(items);
        return {
            id: saved.id,
            target: saved.target || plan.target,
            dietPreference: saved.dietPreference || plan.dietPreference,
            mealSlot: saved.mealSlot || "",
            editing: Boolean(saved.editing),
            pickerMode: saved.pickerMode || "",
            pickerQuery: saved.pickerQuery || "",
            pickerFoodId: saved.pickerFoodId || "",
            pickerQuantity: Number(saved.pickerQuantity) || 100,
            replaceIndex: Number.isInteger(saved.replaceIndex) ? saved.replaceIndex : -1,
            originalCombination: originalCombination,
            editBaselineItems: saved.editBaselineItems ? copyMealItems(saved.editBaselineItems) : null,
            combination: calculateCombinationTotal(currentItems)
        };
    });
    displayResults(window.currentResults);
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

async function saveFavorite(mealTotal) {
    const newSignature = getMealSignature(mealTotal.items);
    const alreadySaved = getFavorites().some(function (favorite) {
        return getMealSignature(favorite.items) === newSignature;
    });
    if (alreadySaved) return false;

    const favoritePayload = {
        items: mealTotal.items.map(function (item) { return { name: item.food.name, quantity: item.quantity }; }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
    };
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        const data = await apiRequest("/api/favorites", { method: "POST", body: JSON.stringify(favoritePayload) });
        favoritesCache.unshift(data.favorite);
    } else {
        const favorites = getFavorites();
        favorites.push({ ...favoritePayload, id: Date.now() });
        localStorage.setItem("favorites", JSON.stringify(favorites));
        favoritesCache = favorites;
    }
    return true;
}

function getFavorites() {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) return favoritesCache;
    const stored = localStorage.getItem("favorites");
    return stored ? JSON.parse(stored) : favoritesCache;
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
        favorite.items.forEach(function (item) { foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`; });
        card.innerHTML = `
          <ul class="meal-food-list">${foodListHTML}</ul>
          <div class="meal-totals">Estimated calories: ${Number(favorite.totalCalories || 0).toFixed(0)} kcal | Protein: ${Number(favorite.totalProtein || 0).toFixed(1)}g | Carbs: ${Number(favorite.totalCarbs || 0).toFixed(1)}g | Fat: ${Number(favorite.totalFat || 0).toFixed(1)}g | Estimated fiber: ${Number(favorite.totalFiber || 0).toFixed(1)}g</div>
          <div class="meal-card-actions"><button class="delete-favorite-btn" data-id="${favorite._id || favorite.id}">Remove</button></div>`;
        favoritesContainer.appendChild(card);
    });
}

async function deleteFavorite(id) {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        await apiRequest(`/api/favorites/${encodeURIComponent(id)}`, { method: "DELETE" });
        favoritesCache = favoritesCache.filter(favorite => String(favorite._id) !== String(id));
    } else {
        const favorites = getFavorites().filter(favorite => String(favorite.id) !== String(id));
        localStorage.setItem("favorites", JSON.stringify(favorites));
        favoritesCache = favorites;
    }
}

function getTodayKey() {
    return "log-" + new Date().toISOString().split("T")[0];
}

async function logMeal(mealTotal) {
    const payload = {
        items: mealTotal.items.map(function (item) { return { name: item.food.name, quantity: item.quantity }; }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber,
        loggedDate: new Date().toISOString()
    };
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        const data = await apiRequest("/api/daily-logs", { method: "POST", body: JSON.stringify(payload) });
        dailyLogCache.unshift(data.meal);
    } else {
        const todayLog = getTodayLog();
        todayLog.push({ ...payload, id: Date.now() });
        localStorage.setItem(getTodayKey(), JSON.stringify(todayLog));
        dailyLogCache = todayLog;
    }
}

function getTodayLog() {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) return dailyLogCache;
    const stored = localStorage.getItem(getTodayKey());
    return stored ? JSON.parse(stored) : dailyLogCache;
}

function displayDailyLog() {
    const todayLog = getTodayLog();
    dailyLogContainer.innerHTML = "";
    if (todayLog.length === 0) {
        dailyLogContainer.innerHTML = "<p>No meals logged today.</p>";
        dailyTotals.innerHTML = "";
        return;
    }
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    todayLog.forEach(function (meal) {
        totalCalories += Number(meal.totalCalories || 0);
        totalProtein += Number(meal.totalProtein || 0);
        totalCarbs += Number(meal.totalCarbs || 0);
        totalFat += Number(meal.totalFat || 0);
        totalFiber += Number(meal.totalFiber || 0);
        const card = document.createElement("div");
        card.classList.add("meal-card");
        const items = meal.items || [];
        const foodListHTML = items.map(item => `<li>${item.name} — ${item.quantity}g</li>`).join("");
        card.innerHTML = `<ul class="meal-food-list">${foodListHTML}</ul><div class="meal-totals">Estimated calories: ${Number(meal.totalCalories || 0).toFixed(0)} kcal | Protein: ${Number(meal.totalProtein || 0).toFixed(1)}g | Carbs: ${Number(meal.totalCarbs || 0).toFixed(1)}g | Fat: ${Number(meal.totalFat || 0).toFixed(1)}g | Estimated fiber: ${Number(meal.totalFiber || 0).toFixed(1)}g</div><div class="meal-card-actions"><button class="delete-log-btn" data-id="${meal._id || meal.id}">Remove</button></div>`;
        dailyLogContainer.appendChild(card);
    });
    dailyTotals.innerHTML = `<strong>Today's Totals:</strong> Estimated calories: ${totalCalories.toFixed(0)} kcal | Protein: ${totalProtein.toFixed(1)}g | Carbs: ${totalCarbs.toFixed(1)}g | Fat: ${totalFat.toFixed(1)}g | Estimated fiber: ${totalFiber.toFixed(1)}g`;
}

async function deleteLoggedMeal(id) {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        await apiRequest(`/api/daily-logs/${encodeURIComponent(id)}`, { method: "DELETE" });
        dailyLogCache = dailyLogCache.filter(meal => String(meal._id) !== String(id));
    } else {
        const todayLog = getTodayLog().filter(meal => String(meal.id) !== String(id));
        localStorage.setItem(getTodayKey(), JSON.stringify(todayLog));
        dailyLogCache = todayLog;
    }
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
        restoreMealPlan();
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
    if (role === "user") loadPersistedMealData();
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


signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    signupError.textContent = "";

    if (username.length < 3) {
        signupError.textContent = "Username must be at least 3 characters.";
        return;
    }

    if (password.length < 8) {
        signupError.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        signupError.textContent = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        signupForm.reset();
        document.getElementById("signup-view").style.display = "none";
        document.getElementById("login-view").style.display = "block";
        document.getElementById("login-username").value = email;
        loginError.textContent = "Account created! Please log in.";
    } catch (error) {
        signupError.textContent = error.message || "Could not connect to the server.";
    }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    loginError.textContent = "";

    if (!email || !password) {
        loginError.textContent = "Enter your email and password.";
        return;
    }

    // Keep the existing demo admin login.
    if (selectedRole === "admin") {
        if (email !== "admin" || password !== "admin123") {
            loginError.textContent = "Use the demo admin credentials shown below.";
            return;
        }

        localStorage.setItem(LOGIN_KEY, JSON.stringify({
            loggedIn: true,
            role: "admin",
            username: "admin"
        }));
        showApp("admin", "admin");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Invalid email or password.");
        }

        if (!data.token) {
            throw new Error("Login succeeded but no token was returned.");
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(LOGIN_KEY, JSON.stringify({
            loggedIn: true,
            role: "user",
            username: data.user.name,
            email: data.user.email
        }));

        showApp("user", data.user.name);
    } catch (error) {
        loginError.textContent = error.message || "Could not connect to the server.";
    }
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

resultsContainer.addEventListener("click", async function (event) {
    const target = event.target;
    const card = target.closest(".meal-card");
    if (!card) {
        return;
    }
    const resultIndex = Array.from(resultsContainer.querySelectorAll(".meal-card")).indexOf(card);
    const result = window.currentResults[resultIndex];
    if (!result) {
        return;
    }

    const actionButton = target.closest("[data-action]");
    if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === "edit-meal") {
            result.editing = true;
            result.editBaselineItems = copyMealItems(result.combination.items);
            result.pickerMode = "";
        } else if (action === "save-changes") {
            result.editing = false;
            result.editBaselineItems = null;
            result.pickerMode = "";
        } else if (action === "cancel-edits") {
            result.combination = calculateCombinationTotal(copyMealItems(result.editBaselineItems || result.combination.items));
            result.editing = false;
            result.editBaselineItems = null;
            result.pickerMode = "";
        } else if (action === "restore-original") {
            result.combination = calculateCombinationTotal(copyMealItems(result.originalCombination.items));
            result.pickerMode = "";
        } else if (action === "add-food") {
            result.pickerMode = "add";
            result.pickerQuery = "";
            result.pickerQuantity = 100;
            const allowedFoods = filterByDiet(foodData, result.dietPreference);
            result.pickerFoodId = allowedFoods.length ? allowedFoods[0].id : "";
        } else if (action === "replace") {
            result.pickerMode = "replace";
            result.pickerQuery = "";
            result.replaceIndex = Number(actionButton.dataset.index);
            const allowedFoods = filterByDiet(foodData, result.dietPreference);
            result.pickerFoodId = allowedFoods.length ? allowedFoods[0].id : "";
        } else if (action === "remove") {
            result.combination.items.splice(Number(actionButton.dataset.index), 1);
        } else if (action === "increase" || action === "decrease") {
            const item = result.combination.items[Number(actionButton.dataset.index)];
            if (item) {
                const delta = action === "increase" ? 10 : -10;
                item.quantity = Math.max(0.1, Number(item.quantity) + delta);
            }
        } else if (action === "apply-food-picker") {
            const selectedFood = foodData.find(function (food) {
                return String(food.id) === String(result.pickerFoodId);
            });
            if (!selectedFood || !filterByDiet([selectedFood], result.dietPreference).length) {
                return;
            }
            if (result.pickerMode === "replace") {
                const oldItem = result.combination.items[result.replaceIndex];
                if (oldItem && String(oldItem.food.id) !== String(selectedFood.id)) {
                    const duplicate = result.combination.items.find(function (item, itemIndex) {
                        return itemIndex !== result.replaceIndex && String(item.food.id) === String(selectedFood.id);
                    });
                    if (duplicate) {
                        duplicate.quantity += oldItem.quantity;
                        result.combination.items.splice(result.replaceIndex, 1);
                    } else {
                        oldItem.food = selectedFood;
                    }
                }
            } else {
                const quantity = Number(result.pickerQuantity);
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return;
                }
                const duplicate = result.combination.items.find(function (item) {
                    return String(item.food.id) === String(selectedFood.id);
                });
                if (duplicate) {
                    duplicate.quantity += quantity;
                } else {
                    result.combination.items.push({ food: selectedFood, quantity: quantity });
                }
            }
            result.pickerMode = "";
        } else if (action === "cancel-food-picker") {
            result.pickerMode = "";
        }

        displayResults(window.currentResults);
        saveMealPlan();
        return;
    }

    if (target.classList.contains("save-favorite-btn")) {
        try {
            const wasSaved = await saveFavorite(result.combination);
            displayFavorites();
            updateProfileStats();
            alert(wasSaved ? "Meal saved to favorites!" : "This meal is already in your favorites.");
        } catch (error) { alert(`Could not save favorite: ${error.message}`); }
    }

    if (target.classList.contains("log-meal-btn")) {
        if (target.disabled) {
            return;
        }
        target.disabled = true;
        try {
            await logMeal(result.combination);
            displayDailyLog();
            updateProfileStats();
            target.textContent = "Logged";
        } catch (error) {
            target.disabled = false;
            alert(`Could not log meal: ${error.message}`);
        }
    }
});

resultsContainer.addEventListener("input", function (event) {
    const input = event.target;
    const card = input.closest(".meal-card");
    if (!card) {
        return;
    }
    const resultIndex = Array.from(resultsContainer.querySelectorAll(".meal-card")).indexOf(card);
    const result = window.currentResults[resultIndex];
    if (!result) {
        return;
    }
    const cursorPosition = input.selectionStart;
    if (input.dataset.role === "quantity") {
        const quantity = Number(input.value);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            return;
        }
        const item = result.combination.items[Number(input.dataset.index)];
        if (!item) {
            return;
        }
        item.quantity = quantity;
    } else if (input.classList.contains("meal-food-search")) {
        result.pickerQuery = input.value;
        const firstMatch = filterByDiet(foodData, result.dietPreference).find(function (food) {
            return food.name.toLowerCase().includes(result.pickerQuery.trim().toLowerCase());
        });
        result.pickerFoodId = firstMatch ? firstMatch.id : "";
    } else if (input.dataset.role === "picker-quantity") {
        const quantity = Number(input.value);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            return;
        }
        result.pickerQuantity = quantity;
    } else {
        return;
    }
    displayResults(window.currentResults);
    saveMealPlan();
    const refreshedCard = resultsContainer.querySelectorAll(".meal-card")[resultIndex];
    let replacement;
    if (input.dataset.role === "quantity") {
        replacement = refreshedCard.querySelector('[data-role="quantity"][data-index="' + input.dataset.index + '"]');
    } else if (input.classList.contains("meal-food-search")) {
        replacement = refreshedCard.querySelector(".meal-food-search");
    } else {
        replacement = refreshedCard.querySelector('[data-role="picker-quantity"]');
    }
    if (replacement) {
        replacement.focus();
        if (cursorPosition !== null && replacement.setSelectionRange) {
            replacement.setSelectionRange(cursorPosition, cursorPosition);
        }
    }
});

resultsContainer.addEventListener("change", function (event) {
    const input = event.target;
    const card = input.closest(".meal-card");
    if (!card) {
        return;
    }
    const resultIndex = Array.from(resultsContainer.querySelectorAll(".meal-card")).indexOf(card);
    const result = window.currentResults[resultIndex];
    if (!result) {
        return;
    }
    if (input.dataset.role === "quantity" || input.dataset.role === "picker-quantity") {
        const quantity = Number(input.value);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            const item = result.combination.items[Number(input.dataset.index)];
            input.value = input.dataset.role === "quantity"
                ? (item ? item.quantity : 0)
                : (result.pickerQuantity || 100);
            return;
        }
    }
    if (input.dataset.role === "meal-slot") {
        result.mealSlot = input.value;
        if (result.mealSlot) {
            window.currentResults.forEach(function (otherResult) {
                if (otherResult !== result && otherResult.mealSlot === result.mealSlot) {
                    otherResult.mealSlot = "";
                }
            });
        }
    } else if (input.classList.contains("meal-food-choice")) {
        result.pickerFoodId = input.value;
    } else {
        return;
    }
    displayResults(window.currentResults);
    saveMealPlan();
});

favoritesContainer.addEventListener("click", async function (event) {
    if (event.target.classList.contains("delete-favorite-btn")) {
        const id = event.target.dataset.id;
        try { await deleteFavorite(id); displayFavorites(); updateProfileStats(); }
        catch (error) { alert(`Could not remove favorite: ${error.message}`); }
    }
});

// Handle form submission
macroForm.addEventListener("submit", function (event) {
    event.preventDefault();
    resultsContainer.innerHTML = "";

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
    const results = findBestMeals(filteredFoods, target, dietPreference).map(function (result, index) {
        const originalItems = copyMealItems(result.combination.items);
        return {
            id: "suggestion-" + index + "-" + getMealSignature(originalItems),
            target: target,
            dietPreference: dietPreference,
            mealSlot: "",
            editing: false,
            pickerMode: "",
            pickerQuery: "",
            pickerFoodId: "",
            pickerQuantity: 100,
            replaceIndex: -1,
            originalCombination: calculateCombinationTotal(copyMealItems(originalItems)),
            combination: calculateCombinationTotal(copyMealItems(originalItems)),
            editBaselineItems: null
        };
    });

    displayResults(results);
    saveMealPlan();
    document.getElementById("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

dailyLogContainer.addEventListener("click", async function (event) {
    if (event.target.classList.contains("delete-log-btn")) {
        const id = event.target.dataset.id;
        try { await deleteLoggedMeal(id); displayDailyLog(); updateProfileStats(); }
        catch (error) { alert(`Could not remove logged meal: ${error.message}`); }
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
    document.getElementById("signup-view").style.display = "none";
    document.getElementById("login-view").style.display = "block";
    signupForm.reset();
    window.location.href = "index.html";
});