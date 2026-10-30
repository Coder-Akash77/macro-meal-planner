const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const authController = require('../controllers/authController');
const User = require('../models/User');

const originalFindOne = User.findOne;

test('register returns message text alongside error details for duplicate emails', async () => {
  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async () => ({ email: 'existing@example.com' });

  const req = {
    body: {
      name: 'Tester',
      email: 'existing@example.com',
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

  assert.equal(statusCode, 409);
  assert.equal(responseBody.message, 'An account with this email already exists');
  assert.equal(responseBody.error, 'An account with this email already exists');

  User.findOne = originalFindOne;
});

test('login returns message text alongside error details for invalid credentials', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const hashedPassword = await bcrypt.hash('correct-password', 12);
  User.findOne = () => ({
    email: 'missing@example.com',
    password: hashedPassword,
    select() {
      return this;
    },
  });

  const req = {
    body: {
      email: 'missing@example.com',
      password: 'wrong-password',
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

  assert.equal(statusCode, 401);
  assert.equal(responseBody.message, 'Invalid email or password');
  assert.equal(responseBody.error, 'Invalid email or password');

  User.findOne = originalFindOne;
});
