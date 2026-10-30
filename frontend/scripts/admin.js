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

