// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");

// Test that JS is connected
console.log("script.js connected successfully");

// Basic submit listener (logic comes Day 2)
macroForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop page reload
  console.log("Form submitted");
});