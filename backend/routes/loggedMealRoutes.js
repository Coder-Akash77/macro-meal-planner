const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createLoggedMeal, getLoggedMeals, deleteLoggedMeal } = require("../controllers/loggedMealController");
const router = express.Router();
router.use(authMiddleware);
router.get("/", getLoggedMeals);
router.post("/", createLoggedMeal);
router.delete("/:id", deleteLoggedMeal);
module.exports = router;
