const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

async function searchUSDAFoods(query) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey || apiKey === 'replace_with_your_usda_api_key') {
    const error = new Error('USDA_API_KEY is missing. Add your key to backend/.env and restart the server.');
    error.status = 503;
    throw error;
  }

  const url = new URL(USDA_BASE_URL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '10');

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const error = new Error(`USDA API request failed (${response.status}). Check your API key or try again later.`);
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }

  const data = await response.json();
  return (data.foods || []).map((food) => {
    const nutrients = food.foodNutrients || [];
    const findNutrient = (names) => {
      const match = nutrients.find((item) => names.includes(String(item.nutrientName || '').toLowerCase()));
      return match && Number.isFinite(Number(match.value)) ? Number(match.value) : null;
    };
    return {
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner || null,
      dataType: food.dataType || null,
      servingSize: food.servingSize ?? null,
      servingSizeUnit: food.servingSizeUnit || null,
      nutrients: {
        calories: findNutrient(['energy']),
        protein: findNutrient(['protein']),
        carbohydrates: findNutrient(['carbohydrate, by difference']),
        fat: findNutrient(['total lipid (fat)'])
      }
    };
  });
}

module.exports = { searchUSDAFoods };
