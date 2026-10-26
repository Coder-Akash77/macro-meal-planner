const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createFavorite, getFavorites, deleteFavorite } = require("../controllers/favoriteController");
const router = express.Router();
router.use(authMiddleware);
router.get("/", getFavorites);
router.post("/", createFavorite);
router.delete("/:id", deleteFavorite);
module.exports = router;
