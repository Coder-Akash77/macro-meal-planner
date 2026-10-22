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

