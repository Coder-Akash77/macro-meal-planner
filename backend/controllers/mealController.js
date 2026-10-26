
const Meal = require("../models/Meal");

const createMeal = async (req, res) => {
  try {
    const meal = await Meal.create({
      ...req.body,
      user: req.user.id,
    });

    return res.status(201).json({
      message: "Meal created successfully",
      meal,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

const getMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ meals });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    return res.status(200).json({ meal });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    return res.status(200).json({
      message: "Meal updated successfully",
      meal,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    return res.status(200).json({
      message: "Meal deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
};
