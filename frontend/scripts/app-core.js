// Grab DOM elements we'll need
const macroForm = document.getElementById("macro-form");
const formError = document.getElementById("form-error");
const resultsContainer = document.getElementById("results-container");
const foodListContainer = document.getElementById("food-list-container");
const consistencyWarning = document.getElementById("consistency-warning");
const foodSearchInput = document.getElementById("food-search");
const favoritesContainer = document.getElementById("favorites-container");
const dailyLogContainer = document.getElementById("daily-log-container");
const dailyTotals = document.getElementById("daily-totals");
const MINIMUM_MATCH_SCORE = 70;
const MAX_CLOSEST_SUGGESTIONS = 1000;
const navTabs = document.querySelectorAll(".nav-tab");
const tabPages = document.querySelectorAll(".tab-page");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

const signupForm = document.getElementById("signup-form");
const signupError = document.getElementById("signup-error");
const showSignupBtn = document.getElementById("show-signup");
const showLoginBtn = document.getElementById("show-login");

const USERS_KEY = "macro-meal-users";

const roleOptions = document.querySelectorAll(".role-option");
const selectedRoleLabel = document.getElementById("selected-role-label");
const adminNavTab = document.querySelector('.nav-tab[data-tab="admin"]');

const LOGIN_KEY = "macro-meal-login";
const TOKEN_KEY = "macro-meal-token";
const API_BASE = window.MACRO_MEAL_API_BASE;
let favoritesCache = [];
let dailyLogCache = [];

function getApiHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...getApiHeaders(), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    return data;
}

async function loadPersistedMealData() {
    if (selectedRole !== "user" || !localStorage.getItem(TOKEN_KEY)) return;
    try {
        const date = new Date().toISOString().slice(0, 10);
        const [favoriteData, logData] = await Promise.all([apiRequest("/api/favorites"), apiRequest(`/api/daily-logs?date=${date}`)]);
        favoritesCache = favoriteData.favorites || [];
        dailyLogCache = logData.meals || [];
        displayFavorites();
        displayDailyLog();
        updateProfileStats();
    } catch (error) {
        console.error("Could not load favorites or daily logs:", error);
        alert(`Could not load saved favorites or daily logs from the server: ${error.message}`);
    }
}

let selectedRole = "user";

// Admin form elements
const foodForm = document.getElementById("food-form");
const foodFormMessage = document.getElementById("food-form-message");
const customFoodsContainer = document.getElementById("custom-foods-container");
const customFoodCount = document.getElementById("custom-food-count");
const restoreDatabaseButton = document.getElementById("restore-database-button");
const restoreDatabaseMessage = document.getElementById("restore-database-message");

// Hero buttons
const goToPlannerBtn = document.getElementById("go-to-planner");
const goToDatabaseBtn = document.getElementById("go-to-database");

// Calorie calculator elements
const calorieForm = document.getElementById("calorie-form");
const calorieResults = document.getElementById("calorie-results");
const calorieFormError = document.getElementById("calorie-form-error");

// Food database elements
const foodCount = document.getElementById("food-count");
const databaseTotalCount = document.getElementById("database-total-count");
const databaseVegCount = document.getElementById("database-veg-count");
const databaseNonVegCount = document.getElementById("database-nonveg-count");
const dietFilterButtons = document.querySelectorAll(".diet-filter-btn");
const categoryFilter = document.getElementById("category-filter");
const clearFoodFiltersButton = document.getElementById("clear-food-filters");
let selectedDietFilter = "all";
let selectedCategoryFilter = "all";
const CALORIE_TOLERANCE_PERCENT = 5;
const MACRO_TOLERANCE_PERCENT = 10;
const CUSTOM_MEAL_PLAN_KEY = "macro-meal-custom-plan";

