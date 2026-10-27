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