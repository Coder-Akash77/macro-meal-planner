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
