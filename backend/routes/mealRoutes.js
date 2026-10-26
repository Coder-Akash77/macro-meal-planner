
const express = require("express");
const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
} = require("../controllers/mealController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createMeal);
router.get("/", getMeals);
router.get("/:id", getMealById);
router.put("/:id", updateMeal);
router.delete("/:id", deleteMeal);

module.exports = router;
