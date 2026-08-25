<div align="center">

# 🥗 MacroMeal

### Hit your macros. Effortlessly.

**A frontend nutrition planner that works *backwards* from your calorie and macro targets to find real food combinations that fit them.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/Data-JSON-000000?style=flat-square&logo=json&logoColor=white)
![No Backend](https://img.shields.io/badge/Backend-None%20(Client--Side)-lightgrey?style=flat-square)
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
| 🥦 **Food Database** | 190 foods, browsable and filterable by diet type and category |
| ⭐ **Favorites** | Save meal combinations you like and reuse them instantly |
| 📆 **Daily Log** | Track what you actually eat, stored locally per device |
| 🔐 **Role-Based Access** | Separate User and Admin workspaces from a single login flow |
| 🛠️ **Admin Mode** | Add custom foods to the database — instantly available to the planner |
| 💾 **Zero Backend** | Runs entirely client-side using `localStorage`, no server or account database required |

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

---

## 🧰 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3, Google Fonts |
| Logic | Vanilla JavaScript |
| Data | JSON (`data/foods.json`) |
| Persistence | Browser `localStorage` |

</div>

There is **no backend server** in the current version — this is a deliberate scope decision to focus on the search/matching logic and UI, not infrastructure.

---

## 🚀 Getting Started

Since the app loads its food database via `fetch()`, opening `index.html` directly **will not work** — it needs to be served locally.

### Option 1 — VS Code Live Server
```bash
1. Clone the repository
2. Open the project folder in VS Code
3. Install the "Live Server" extension
4. Right-click index.html → "Open with Live Server"
```

### Option 2 — Python's built-in server
```bash
python -m http.server 8000
```
Then visit **http://localhost:8000**

### Demo Admin Login
```
Username: admin
Password: admin123
```
> This is a frontend-only demo login and is **not** real authentication.

---

## 📁 Project Structure

```
MacroMeal/
│
├── index.html
├── style.css
├── script.js
│
├── data/
│   └── foods.json          # Food nutrition database
│
├── assets/
│   └── macromeal-logo.png
│
└── README.md
```

---

## 💾 Data Storage

| Source | Purpose |
|---|---|
| `data/foods.json` | Core food nutrition dataset |
| `localStorage` | Custom foods added by admin, deleted food IDs, favorite meals, daily logs |

> ⚠️ Since data lives in the browser, it is **device-specific** and does not sync across devices.

---

## 🧱 Current Limitations

- No real user authentication
- No backend or persistent database
- User data is stored locally only
- Admin credentials are hardcoded for demo purposes
- Nutrition values are estimates
- Meal combinations are limited to the current food dataset

These are intentional scope boundaries for a frontend-focused build — not oversights — and are the natural next steps for a v2.

---

## 🗺️ Roadmap

- [ ] Backend + proper database
- [ ] Real user accounts and authentication
- [ ] Cloud-synced meal history
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
