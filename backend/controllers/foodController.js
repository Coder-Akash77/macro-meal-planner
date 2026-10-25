const { searchUSDAFoods } = require('../services/usdaService');

async function searchFoods(req, res, next) {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) {
    return res.status(400).json({ error: 'Enter at least 2 characters in the q query parameter.' });
  }

  try {
    const foods = await searchUSDAFoods(query);
    res.json({ source: 'USDA FoodData Central', count: foods.length, foods });
  } catch (error) {
    next(error);
  }
}

module.exports = { searchFoods };
