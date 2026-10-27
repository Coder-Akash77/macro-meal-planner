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

