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

