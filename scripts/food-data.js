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


