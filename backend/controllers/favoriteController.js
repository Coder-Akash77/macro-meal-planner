const Favorite = require("../models/Favorite");

const createFavorite = async (req, res) => {
  try {
    const { items, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one food item is required." });
    const favorite = await Favorite.create({ user: req.user.id, items, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber });
    return res.status(201).json({ message: "Favorite saved successfully", favorite });
  } catch (error) { return res.status(400).json({ error: error.message }); }
};

const getFavorites = async (req, res) => {
  try { return res.json({ favorites: await Favorite.find({ user: req.user.id }).sort({ createdAt: -1 }) }); }
  catch (error) { return res.status(500).json({ error: error.message }); }
};

const deleteFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!favorite) return res.status(404).json({ error: "Favorite not found" });
    return res.json({ message: "Favorite removed successfully" });
  } catch (error) { return res.status(400).json({ error: error.message }); }
};

module.exports = { createFavorite, getFavorites, deleteFavorite };
