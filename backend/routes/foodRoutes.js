const express = require('express');
const { searchFoods } = require('../controllers/foodController');

const router = express.Router();
router.get('/search', searchFoods);
module.exports = router;
