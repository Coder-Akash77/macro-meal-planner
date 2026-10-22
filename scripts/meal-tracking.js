function getMealSignature(items) {
    return items
        .map(function (item) {
            const name = item.food ? item.food.name : item.name;
            return name + "-" + item.quantity;
        })
        .sort()
        .join("|");
}

function saveFavorite(mealTotal) {
    const favorites = getFavorites();

    const newSignature = getMealSignature(mealTotal.items);

    const alreadySaved = favorites.some(function (favorite) {
        return getMealSignature(favorite.items) === newSignature;
    });

    if (alreadySaved) {
        return false; // already in favorites, don't add a duplicate
    }

    const favoriteMeal = {
        id: Date.now(), // unique id based on timestamp
        items: mealTotal.items.map(function (item) {
            return { name: item.food.name, quantity: item.quantity };
        }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
    };

    favorites.push(favoriteMeal);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    return true;
}

function getFavorites() {
    const stored = localStorage.getItem("favorites");
    return stored ? JSON.parse(stored) : [];
}

function displayFavorites() {
    const favorites = getFavorites();
    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = "<p>No favorites saved yet.</p>";
        return;
    }

    favorites.forEach(function (favorite) {
        const card = document.createElement("div");
        card.classList.add("meal-card");

        let foodListHTML = "";
        favorite.items.forEach(function (item) {
            foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`;
        });

        card.innerHTML = `
      <ul class="meal-food-list">${foodListHTML}</ul>
      <div class="meal-totals">
        Calories: ${favorite.totalCalories.toFixed(0)} kcal |
        Protein: ${favorite.totalProtein.toFixed(1)}g |
        Carbs: ${favorite.totalCarbs.toFixed(1)}g |
        Fat: ${favorite.totalFat.toFixed(1)}g |
        Fiber: ${Number(favorite.totalFiber || 0).toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="delete-favorite-btn" data-id="${favorite.id}">Remove</button>
      </div>
    `;

        favoritesContainer.appendChild(card);
    });
}

function deleteFavorite(id) {
    let favorites = getFavorites();
    favorites = favorites.filter(function (favorite) {
        return favorite.id !== id;
    });
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getTodayKey() {
    const today = new Date();
    return "log-" + today.toISOString().split("T")[0]; // e.g. "log-2026-08-17"
}

function logMeal(mealTotal) {
    const key = getTodayKey();
    const todayLog = getTodayLog();

    const loggedMeal = {
        id: Date.now(),
        items: mealTotal.items.map(function (item) {
            return { name: item.food.name, quantity: item.quantity };
        }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
    };

    todayLog.push(loggedMeal);
    localStorage.setItem(key, JSON.stringify(todayLog));
}

function getTodayLog() {
    const key = getTodayKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function displayDailyLog() {
    const todayLog = getTodayLog();
    dailyLogContainer.innerHTML = "";

    if (todayLog.length === 0) {
        dailyLogContainer.innerHTML = "<p>No meals logged today.</p>";
        dailyTotals.innerHTML = "";
        return;
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    todayLog.forEach(function (meal) {
        totalCalories += meal.totalCalories;
        totalProtein += meal.totalProtein;
        totalCarbs += meal.totalCarbs;
        totalFat += meal.totalFat;
        totalFiber += Number(meal.totalFiber || 0);

        const card = document.createElement("div");
        card.classList.add("meal-card");

        let foodListHTML = "";
        meal.items.forEach(function (item) {
            foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`;
        });

        card.innerHTML = `
      <ul class="meal-food-list">${foodListHTML}</ul>
      <div class="meal-totals">
        Calories: ${meal.totalCalories.toFixed(0)} kcal |
        Protein: ${meal.totalProtein.toFixed(1)}g |
        Carbs: ${meal.totalCarbs.toFixed(1)}g |
        Fat: ${meal.totalFat.toFixed(1)}g |
        Fiber: ${Number(meal.totalFiber || 0).toFixed(1)}g
      </div>
      <div class="meal-card-actions">
        <button class="delete-log-btn" data-id="${meal.id}">Remove</button>
      </div>
    `;

        dailyLogContainer.appendChild(card);
    });

    dailyTotals.innerHTML = `
    <strong>Today's Totals:</strong>
    Calories: ${totalCalories.toFixed(0)} kcal |
    Protein: ${totalProtein.toFixed(1)}g |
    Carbs: ${totalCarbs.toFixed(1)}g |
    Fat: ${totalFat.toFixed(1)}g |
    Fiber: ${totalFiber.toFixed(1)}g
  `;
}

function deleteLoggedMeal(id) {
    const key = getTodayKey();
    let todayLog = getTodayLog();
    todayLog = todayLog.filter(function (meal) {
        return meal.id !== id;
    });
    localStorage.setItem(key, JSON.stringify(todayLog));
}
dailyLogContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-log-btn")) {
        const id = Number(event.target.dataset.id);
        deleteLoggedMeal(id);
        displayDailyLog();
        updateProfileStats();
    }
});

document.getElementById("go-to-planner").addEventListener("click", function () {
    switchTab("planner");
});

document.getElementById("go-to-database").addEventListener("click", function () {
    switchTab("database");
});

