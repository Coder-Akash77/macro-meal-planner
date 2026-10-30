const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const authController = require('../controllers/authController');

test('register returns a clear 503 when MongoDB is not connected', async () => {
  const originalReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true, writable: true });

  const req = {
    body: {
      name: 'Tester',
      email: 'tester@example.com',
      password: 'password123',
    },
  };

  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await authController.register(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(statusCode, 503);
  assert.equal(responseBody.message, 'Database connection is unavailable. Please try again later.');
  assert.equal(responseBody.error, 'Database connection is unavailable. Please try again later.');

  Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true, writable: true });
});

test('login returns a clear 503 when MongoDB is not connected', async () => {
  const originalReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true, writable: true });

  const req = {
    body: {
      email: 'tester@example.com',
      password: 'password123',
    },
  };

  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await authController.login(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(statusCode, 503);
  assert.equal(responseBody.message, 'Database connection is unavailable. Please try again later.');
  assert.equal(responseBody.error, 'Database connection is unavailable. Please try again later.');

  Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true, writable: true });
});
