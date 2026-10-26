require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const foodRoutes = require('./routes/foodRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const frontendPath = path.join(__dirname, '..', 'frontend');
const authRoutes = require('./routes/authRoutes');

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}` }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(frontendPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MacroMeal backend is running', timestamp: new Date().toISOString() });
});

app.get('/api/db/status', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const connected = readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'connected' : (process.env.MONGODB_URI ? (states[readyState] || 'unknown') : 'not_configured'),
    message: connected ? 'MongoDB connection is working' : 'Set a valid MONGODB_URI in backend/.env and restart the server'
  });
});

app.use('/api/foods', foodRoutes);
app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Request error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      console.error('The server will still start so you can test the USDA API. Check MONGODB_URI in backend/.env.');
    }
  } else {
    console.warn('MONGODB_URI is missing. Database status will show not_configured.');
  }

  app.listen(PORT, () => console.log(`MacroMeal is running at http://localhost:${PORT}`));
}

start();
