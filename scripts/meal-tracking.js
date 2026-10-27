async function saveFavorite(mealTotal) {
    const newSignature = getMealSignature(mealTotal.items);
    const alreadySaved = getFavorites().some(function (favorite) {
        return getMealSignature(favorite.items) === newSignature;
    });
    if (alreadySaved) return false;

    const favoritePayload = {
        items: mealTotal.items.map(function (item) { return { name: item.food.name, quantity: item.quantity }; }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber
    };
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        const data = await apiRequest("/api/favorites", { method: "POST", body: JSON.stringify(favoritePayload) });
        favoritesCache.unshift(data.favorite);
    } else {
        const favorites = getFavorites();
        favorites.push({ ...favoritePayload, id: Date.now() });
        localStorage.setItem("favorites", JSON.stringify(favorites));
        favoritesCache = favorites;
    }
    return true;
}

function getFavorites() {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) return favoritesCache;
    const stored = localStorage.getItem("favorites");
    return stored ? JSON.parse(stored) : favoritesCache;
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
        favorite.items.forEach(function (item) { foodListHTML += `<li>${item.name} — ${item.quantity}g</li>`; });
        card.innerHTML = `
          <ul class="meal-food-list">${foodListHTML}</ul>
          <div class="meal-totals">Estimated calories: ${Number(favorite.totalCalories || 0).toFixed(0)} kcal | Protein: ${Number(favorite.totalProtein || 0).toFixed(1)}g | Carbs: ${Number(favorite.totalCarbs || 0).toFixed(1)}g | Fat: ${Number(favorite.totalFat || 0).toFixed(1)}g | Estimated fiber: ${Number(favorite.totalFiber || 0).toFixed(1)}g</div>
          <div class="meal-card-actions"><button class="delete-favorite-btn" data-id="${favorite._id || favorite.id}">Remove</button></div>`;
        favoritesContainer.appendChild(card);
    });
}

async function deleteFavorite(id) {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        await apiRequest(`/api/favorites/${encodeURIComponent(id)}`, { method: "DELETE" });
        favoritesCache = favoritesCache.filter(favorite => String(favorite._id) !== String(id));
    } else {
        const favorites = getFavorites().filter(favorite => String(favorite.id) !== String(id));
        localStorage.setItem("favorites", JSON.stringify(favorites));
        favoritesCache = favorites;
    }
}

function getTodayKey() {
    return "log-" + new Date().toISOString().split("T")[0];
}

async function logMeal(mealTotal) {
    const payload = {
        items: mealTotal.items.map(function (item) { return { name: item.food.name, quantity: item.quantity }; }),
        totalCalories: mealTotal.totalCalories,
        totalProtein: mealTotal.totalProtein,
        totalCarbs: mealTotal.totalCarbs,
        totalFat: mealTotal.totalFat,
        totalFiber: mealTotal.totalFiber,
        loggedDate: new Date().toISOString()
    };
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        const data = await apiRequest("/api/daily-logs", { method: "POST", body: JSON.stringify(payload) });
        dailyLogCache.unshift(data.meal);
    } else {
        const todayLog = getTodayLog();
        todayLog.push({ ...payload, id: Date.now() });
        localStorage.setItem(getTodayKey(), JSON.stringify(todayLog));
        dailyLogCache = todayLog;
    }
}

function getTodayLog() {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) return dailyLogCache;
    const stored = localStorage.getItem(getTodayKey());
    return stored ? JSON.parse(stored) : dailyLogCache;
}

function displayDailyLog() {
    const todayLog = getTodayLog();
    dailyLogContainer.innerHTML = "";
    if (todayLog.length === 0) {
        dailyLogContainer.innerHTML = "<p>No meals logged today.</p>";
        dailyTotals.innerHTML = "";
        return;
    }
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    todayLog.forEach(function (meal) {
        totalCalories += Number(meal.totalCalories || 0);
        totalProtein += Number(meal.totalProtein || 0);
        totalCarbs += Number(meal.totalCarbs || 0);
        totalFat += Number(meal.totalFat || 0);
        totalFiber += Number(meal.totalFiber || 0);
        const card = document.createElement("div");
        card.classList.add("meal-card");
        const items = meal.items || [];
        const foodListHTML = items.map(item => `<li>${item.name} — ${item.quantity}g</li>`).join("");
        card.innerHTML = `<ul class="meal-food-list">${foodListHTML}</ul><div class="meal-totals">Estimated calories: ${Number(meal.totalCalories || 0).toFixed(0)} kcal | Protein: ${Number(meal.totalProtein || 0).toFixed(1)}g | Carbs: ${Number(meal.totalCarbs || 0).toFixed(1)}g | Fat: ${Number(meal.totalFat || 0).toFixed(1)}g | Estimated fiber: ${Number(meal.totalFiber || 0).toFixed(1)}g</div><div class="meal-card-actions"><button class="delete-log-btn" data-id="${meal._id || meal.id}">Remove</button></div>`;
        dailyLogContainer.appendChild(card);
    });
    dailyTotals.innerHTML = `<strong>Today's Totals:</strong> Estimated calories: ${totalCalories.toFixed(0)} kcal | Protein: ${totalProtein.toFixed(1)}g | Carbs: ${totalCarbs.toFixed(1)}g | Fat: ${totalFat.toFixed(1)}g | Estimated fiber: ${totalFiber.toFixed(1)}g`;
}

async function deleteLoggedMeal(id) {
    if (selectedRole === "user" && localStorage.getItem(TOKEN_KEY)) {
        await apiRequest(`/api/daily-logs/${encodeURIComponent(id)}`, { method: "DELETE" });
        dailyLogCache = dailyLogCache.filter(meal => String(meal._id) !== String(id));
    } else {
        const todayLog = getTodayLog().filter(meal => String(meal.id) !== String(id));
        localStorage.setItem(getTodayKey(), JSON.stringify(todayLog));
        dailyLogCache = todayLog;
    }
}
// Load food data from JSON file
