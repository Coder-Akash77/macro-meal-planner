const LoggedMeal = require("../models/LoggedMeal");

function dateRange(dateValue) {
  const value = typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : new Date().toISOString().slice(0, 10);
  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

const createLoggedMeal = async (req, res) => {
  try {
    const { items, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber, loggedDate } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one food item is required." });
    const meal = await LoggedMeal.create({ user: req.user.id, items, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber, loggedDate: loggedDate || new Date() });
    return res.status(201).json({ message: "Meal logged successfully", meal });
  } catch (error) { return res.status(400).json({ error: error.message }); }
};

const getLoggedMeals = async (req, res) => {
  try {
    const range = dateRange(req.query.date);
    if (!range) return res.status(400).json({ error: "Date must use YYYY-MM-DD format." });
    const meals = await LoggedMeal.find({ user: req.user.id, loggedDate: { $gte: range.start, $lt: range.end } }).sort({ createdAt: -1 });
    return res.json({ meals });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

const deleteLoggedMeal = async (req, res) => {
  try {
    const meal = await LoggedMeal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!meal) return res.status(404).json({ error: "Logged meal not found" });
    return res.json({ message: "Logged meal removed successfully" });
  } catch (error) { return res.status(400).json({ error: error.message }); }
};

module.exports = { createLoggedMeal, getLoggedMeals, deleteLoggedMeal };
