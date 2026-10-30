const PRODUCTION_FRONTEND_ORIGIN = 'https://macro-meal-planner-3.onrender.com';
const DEVELOPMENT_FRONTEND_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/+$/, '');
}

function createCorsOptions(env = process.env) {
  const configuredOrigins = (env.FRONTEND_ORIGIN || PRODUCTION_FRONTEND_ORIGIN)
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  const allowedOrigins = new Set([
    PRODUCTION_FRONTEND_ORIGIN,
    ...DEVELOPMENT_FRONTEND_ORIGINS,
    ...configuredOrigins,
  ]);

  return {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(normalizeOrigin(origin)));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };
}

module.exports = createCorsOptions;
