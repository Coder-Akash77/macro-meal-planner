const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const cors = require('cors');
const express = require('express');
const createCorsOptions = require('../middleware/corsOptions');

const app = express();
app.use(cors(createCorsOptions({ FRONTEND_ORIGIN: 'http://127.0.0.1:5500' })));
app.get('/api/test', (req, res) => res.json({ status: 'ok' }));

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('allows the production origin when the configured origin is local', async () => {
  const response = await fetch(`${baseUrl}/api/test`, {
    headers: { Origin: 'https://macro-meal-planner-3.onrender.com' },
  });

  assert.equal(response.headers.get('access-control-allow-origin'), 'https://macro-meal-planner-3.onrender.com');
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('allows both local development origins', async () => {
  for (const origin of ['http://localhost:5500', 'http://127.0.0.1:5500']) {
    const response = await fetch(`${baseUrl}/api/test`, { headers: { Origin: origin } });
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }
});

test('does not allow an unknown origin', async () => {
  const response = await fetch(`${baseUrl}/api/test`, {
    headers: { Origin: 'https://untrusted.example' },
  });

  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('answers authorization and JSON preflight requests', async () => {
  const response = await fetch(`${baseUrl}/api/test`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://macro-meal-planner-3.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://macro-meal-planner-3.onrender.com');
  assert.match(response.headers.get('access-control-allow-methods'), /\bPOST\b/);
  assert.deepEqual(
    response.headers.get('access-control-allow-headers').toLowerCase().split(',').map((header) => header.trim()).sort(),
    ['authorization', 'content-type'],
  );
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});
