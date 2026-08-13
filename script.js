// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");

// Test that JS is connected
console.log("script.js connected successfully");

// Basic submit listener (logic comes Day 2)
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
});

let foodData = []; // will hold our loaded food list

async function loadFoodData() {
  try {
    const response = await fetch("data/foods.json");

    if (!response.ok) {
      throw new Error("Failed to load food data: " + response.status);
    }

    foodData = await response.json();
    console.log("Food data loaded:", foodData);
  } catch (error) {
    console.error("Error loading food data:", error);
    formError.textContent = "Could not load food data. Please refresh the page.";
  }
}

loadFoodData();