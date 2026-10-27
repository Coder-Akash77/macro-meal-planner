<div align="center">

# 🥗 MacroMeal

### Hit your macros. Effortlessly.

**A frontend nutrition planner that works *backwards* from your calorie and macro targets to find real food combinations that fit them.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/Data-JSON-000000?style=flat-square&logo=json&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Express%20%7C%20MongoDB-2F855A?style=flat-square)
![License](https://img.shields.io/badge/License-Student%20Project-informational?style=flat-square)

[Overview](#-overview) • [Features](#-features) • [Screenshots](#-app-walkthrough) • [How It Works](#-how-the-matching-engine-works) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Roadmap](#-roadmap)

</div>

---

## 📌 Overview

Most calorie calculators stop at giving you a number. **MacroMeal goes one step further.**

Instead of just telling you *"eat 2,100 kcal a day,"* it takes your calorie and macro targets — protein, carbs, fats, and fiber — and **searches a real food database to find combinations that actually hit those numbers.**

That single design decision turned this from a basic calculator into a genuine **search-and-optimization problem**: given a target vector `(calories, protein, carbs, fat, fiber)`, find the food combination(s) that minimize the distance to it. That's the core engineering challenge this project solves.

> 💡 **In short:** you give MacroMeal the numbers you already know. It works backwards to tell you *what to eat.*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧮 **Calorie Calculator** | Converts height, weight, activity level, meals/day and goal into daily calorie & macro targets |
| 🍽️ **Smart Meal Planner** | Runs a combinatorial search across the food database and ranks results by closeness to your target |
| ✏️ **Editable Meal Suggestions** | Add, remove, replace, and resize foods; see live nutrition and target matching, then save edits locally |
| 🥦 **Food Database** | 190 foods, browsable and filterable by diet type and category |
| ⭐ **Favorites** | Save meal combinations you like and reuse them instantly |
| 📆 **Daily Log** | Track meals by date; authenticated user logs persist in MongoDB Atlas |
| 🔐 **Role-Based Access** | Separate User and Admin workspaces from a single login flow |
| 🛠️ **Admin Mode** | Add custom foods to the database — instantly available to the planner |
| 🔐 **Persistent backend** | Express APIs, JWT authentication, and MongoDB Atlas persistence for accounts, meals, favorites, and daily logs |

---

## 🖼️ App Walkthrough

### 1️⃣ Login & Role Selection

Users choose their workspace — **User** or **Admin** — before entering the planner. This keeps the day-to-day experience simple while still supporting admin tooling inside the same project.

<p align="center">
  <img src="assets/Screenshot 2026-08-25 163926.png" alt="Login screen" width="800"/>
</p>

---

### 2️⃣ Landing Page

A quick snapshot of what the app offers — database size, match tolerance, and the core search approach — right on the homepage.

<p align="center">
  <img src="assets/Screenshot 2026-08-25 163938.png" alt="Landing page" width="800"/>
</p>

---

### 3️⃣ Calorie Calculator

Body metrics and a goal go in; a daily calorie and macro starting point comes out — the foundation the meal planner builds on.

<p align="center">
  <img src="assets/Screenshot 2026-08-25 163948.png" alt="Calorie calculator" width="800"/>
</p>

**Supported goals:** Fat loss · Muscle build · Maintenance · Weight gain
> ⚠️ Intended as a planning tool, not medical advice.

---

### 4️⃣ Food Database

A clean, dashboard-style browser for all 190 foods — searchable, filterable by diet and category, with an at-a-glance nutrition snapshot.

<p align="center">
  <img src="assets/Screenshot 2026-08-25 163958.png" alt="Food database" width="800"/>
</p>

---

## ⚙️ How the Matching Engine Works

The Meal Planner is the heart of the project. Here's the pipeline:

```
User Targets (kcal, protein, carbs, fat, fiber)
        │
        ▼
Generate candidate food combinations (predefined serving sizes)
        │
        ▼
Compute nutrition totals for each combination
        │
        ▼
Score each combination against the target
        │
        ▼
Rank by closeness → return best matches
```

**Scoring logic:**
- ✅ Calorie tolerance: **±5%**
- ✅ Macro tolerance: **±10%**
- ✅ Protein, carbs, and fat are **weighted more heavily** than calories and fiber — so the planner optimizes for actual macro accuracy, not just hitting a calorie number.

Rather than dumping every possible combination on the user, MacroMeal surfaces only the closest matches — turning a huge search space into a short, usable list.

Suggested meals can be customized independently. Food quantities use grams, matching the database's per-100g nutrition values. Changes update the meal's score and target feedback immediately; the original suggestion remains available to restore. Calories are calculated from macros and fiber is marked as estimated because the current food database does not provide fiber values. Customized meal plans and meal-slot selections are stored in browser local storage. For signed-in users, favorites and daily logs are stored in MongoDB Atlas through authenticated APIs.

---

## 🧰 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3, Google Fonts |
| Logic | Vanilla JavaScript |
| Data | JSON (`data/foods.json`) |
| Frontend persistence | `localStorage` for UI preferences and admin-only demo data; MongoDB Atlas for authenticated account data |
| Backend | Node.js, Express, Mongoose |
| Authentication | bcryptjs + JWT |
| External food search | USDA FoodData Central API (backend endpoint) |

</div>

The meal-planning algorithm and built-in food catalog run in the browser. Account data, saved meals, favorites, and daily logs use the Express backend and MongoDB Atlas when a user is signed in.

---

## 🚀 Getting Started

### Requirements
- Node.js (LTS recommended) and npm
- MongoDB Atlas database/connection URI
- VS Code Live Server extension (or another static frontend server)

### 1. Configure the backend

Open a terminal in `backend/` and install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env`, then fill in your own values. Never commit `.env`.

```env
PORT=5000
FRONTEND_ORIGIN=http://127.0.0.1:5500
USDA_API_KEY=your_usda_fooddata_central_api_key
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Start the API:

```bash
npm run dev
```

Check `http://localhost:5000/api/health` and `http://localhost:5000/api/db/status`.

### 2. Start the frontend

Open the project root in VS Code, right-click `index.html`, and choose **Open with Live Server**. The frontend API base is configured in `scripts/app-core.js` as `http://localhost:5000`.

### 3. Test the core user flow

1. Register with a new email and log in.
2. Generate meal suggestions and save one to Favorites.
3. Log a meal to Today's Log.
4. Refresh the page and verify both still appear.
5. In MongoDB Atlas, check the `favorites` and `loggedmeals` collections, as well as `users` and `meals`.
6. Remove a favorite/logged meal and verify the corresponding document is deleted.
7. Log out and verify protected API requests are rejected without a valid token.

### Demo Admin Login

```text
Username: admin
Password: admin123
```

This remains a frontend demo/admin workspace. Real user registration and login use the backend. Do not use the demo admin credentials as a production security mechanism.

---

## 📁 Project Structure

```text
MacroMeal/
├── index.html
├── app.html
├── scripts/
│   ├── app-core.js
│   ├── navigation.js
│   ├── food-database.js
│   ├── nutrition.js
│   ├── meal-planner.js
│   ├── meal-tracking.js
│   ├── food-data.js
│   ├── auth.js
│   ├── admin.js
│   ├── meal-planner-events.js
│   ├── calorie-calculator.js
│   └── app-init.js
├── style.css
├── landing.css
├── data/foods.json
└── backend/
    ├── server.js
    ├── models/       # User, Meal, Favorite, LoggedMeal
    ├── controllers/  # Auth, food search, meals, favorites, daily logs
    ├── routes/
    ├── middleware/   # JWT authentication
    └── services/     # USDA API integration
```

---

## 💾 Data Storage

| Source | Purpose |
|---|---|
| `data/foods.json` | Built-in food nutrition catalog used by the meal planner |
| `localStorage` | UI/session token, meal-plan draft, and local admin/demo preferences |
| MongoDB `users` | Registered user accounts (passwords are hashed) |
| MongoDB `meals` | User-owned saved meal documents |
| MongoDB `favorites` | User-owned reusable favorite combinations |
| MongoDB `loggedmeals` | User-owned meals logged by date |

Favorites and daily logs are protected by JWT middleware and scoped to the authenticated user. The frontend requests the current day's logs from the backend; the historical records remain in MongoDB.

---

## 🧱 Current Limitations

- The meal suggestion algorithm uses the bundled `data/foods.json` dataset; the USDA search endpoint is separate and should be tested if external food search is required in the UI.
- The demo admin login is client-side and is not suitable for production use.
- Nutrition values and recommendations are estimates, not medical advice.
- The project has not been security-audited for production deployment.

---

## 🗺️ Roadmap

- [x] Express backend and MongoDB Atlas persistence
- [x] Real user registration/login with JWT authentication
- [x] Cloud-persisted favorites and daily meal logs
- [ ] Improved recommendation algorithm
- [ ] Richer nutrition data (micronutrients)
- [ ] Weekly meal planning
- [ ] Auto-generated shopping lists
- [ ] Custom calorie/macro presets
- [ ] Mobile-first redesign
- [ ] Third-party nutrition API integration

---

## 💭 Why This Project

Calorie calculators are everywhere. What's missing is the *next step* — turning a target number into an actual plate of food.

MacroMeal reframes nutrition planning as a **search and optimization problem**: given a target vector, find the closest achievable combination from a real dataset. Building that pipeline — from candidate generation, to scoring, to ranking, to a usable UI — was the real goal of this project, alongside a from-scratch frontend built without any framework.

---

## ⚕️ Disclaimer

MacroMeal is intended for **general nutrition planning and educational purposes only**. All calorie and macro recommendations are estimates and should not be treated as medical or dietary advice.

---

## 👥 Authors

**Akash Anand** · **Bhavya Singla** · **Aayush Madan**

*Built as a personal/student project while exploring frontend development, JavaScript logic, and nutrition-based recommendation systems.*

</div>
