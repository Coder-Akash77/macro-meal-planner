// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");
const foodListContainer = document.getElementById("food-list-container");

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

  // Get selected dietary preference
  const dietPreference = document.querySelector('input[name="dietPreference"]:checked').value;

  // Filter foods according to diet preference
  const filteredFoods = filterByDiet(foodData, dietPreference);

  console.log("Diet preference:", dietPreference);
  console.log("Filtered food count:", filteredFoods.length);
});