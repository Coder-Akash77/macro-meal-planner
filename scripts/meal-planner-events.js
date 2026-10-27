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

