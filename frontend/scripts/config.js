const LOCAL_API_BASE = 'http://localhost:5000';
const PRODUCTION_API_BASE = 'https://macro-meal-planner-2.onrender.com';
const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);

window.MACRO_MEAL_API_BASE = (isLocalDevelopment ? LOCAL_API_BASE : PRODUCTION_API_BASE)
  .replace(/\/+$/, '');
