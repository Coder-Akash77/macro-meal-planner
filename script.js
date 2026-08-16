// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");
const foodListContainer = document.getElementById("food-list-container");
const consistencyWarning = document.getElementById("consistency-warning");
const foodSearchInput = document.getElementById("food-search");

// Test that JS is connected
console.log("script.js connected successfully");

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

function checkMacroConsistency(calories, protein, carbs, fat) {
    const derivedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
    const percentDiff = Math.abs(derivedCalories - calories) / calories * 100;

    return {
        derivedCalories: derivedCalories,
        percentDiff: percentDiff,
        isConsistent: percentDiff <= 10
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
      validMeals.push({
        combination: total,
        score: score
      });
    }
  });

  validMeals.sort(function (a, b) {
    return b.score - a.score; // highest score first
  });

  return validMeals;
}

function displayResults(results) {
  resultsContainer.innerHTML = ""; // clear previous content

  if (results.length === 0) {
    resultsContainer.innerHTML = "<p>No combination found within the selected tolerance.</p>";
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
    `;

    resultsContainer.appendChild(card);
  });
}

// Load food data from JSON file
async function loadFoodData() {
    try {
        const response = await fetch("data/foods.json");

        if (!response.ok) {
            throw new Error("Failed to load food data: " + response.status);
        }

        foodData = await response.json();
        console.log("Food data loaded:", foodData);

        displayFoods(foodData);
    } catch (error) {
        console.error("Error loading food data:", error);
        formError.textContent = "Could not load food data. Please refresh the page.";
    }
}

loadFoodData();

foodSearchInput.addEventListener("input", function () {
  const searchTerm = foodSearchInput.value.toLowerCase();

  const filteredResults = foodData.filter(function (food) {
    return food.name.toLowerCase().includes(searchTerm);
  });

  displayFoods(filteredResults);
});

// Handle form submission
macroForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const calories = Number(document.getElementById("calories").value);
    const protein = Number(document.getElementById("protein").value);
    const carbs = Number(document.getElementById("carbs").value);
    const fat = Number(document.getElementById("fat").value);

    // Reset previous error
    formError.textContent = "";

    // Validation checks
    if (!calories || !protein || !carbs || !fat) {
        formError.textContent = "Please fill in all fields.";
        return;
    }

    if (calories <= 0 || protein <= 0 || carbs <= 0 || fat <= 0) {
        formError.textContent = "Values must be greater than 0.";
        return;
    }

    console.log("Valid targets:", { calories, protein, carbs, fat });
    // Check macro/calorie consistency
    const consistencyResult = checkMacroConsistency(calories, protein, carbs, fat);

    if (!consistencyResult.isConsistent) {
        consistencyWarning.style.display = "block";
        consistencyWarning.textContent =
            `Your macros add up to ${consistencyResult.derivedCalories.toFixed(0)} kcal, but your target is ${calories} kcal (${consistencyResult.percentDiff.toFixed(1)}% difference). Please adjust your values.`;
        return;
    } else {
        consistencyWarning.style.display = "none";
    }

   const dietPreference = document.querySelector('input[name="dietPreference"]:checked').value;
  const filteredFoods = filterByDiet(foodData, dietPreference);

  const target = { calories, protein, carbs, fat };
  const results = findBestMeals(filteredFoods, target);

  displayResults(results);
  document.getElementById("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

