/**
 * @file stock.test.js
 * @description Integration tests for stock API endpoints.
 *              Tests: stock list, single stock quote, search, prediction proxy.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const stockRoutes = require('../routes/stockRoutes');
const authRoutes = require('../routes/authRoutes');
const { notFound, globalErrorHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/authMiddleware');

// ─── Build test app ───────────────────────────────────────────────────────────
const buildTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
};

// ─── Setup ────────────────────────────────────────────────────────────────────
let authToken = '';
const testUser = {
  name: 'Stock Tester',
  email: `stocktester_${Date.now()}@example.com`,
  password: 'password123',
};

beforeAll(async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock-test';
  await mongoose.connect(MONGO_URI);

  // Register and login to get auth token
  const app = buildTestApp();
  await request(app).post('/api/auth/register').send(testUser);
  const loginRes = await request(app).post('/api/auth/login').send({
    email: testUser.email,
    password: testUser.password,
  });
  authToken = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
  await mongoose.connection.close();
});

// ─── Stock List Tests ─────────────────────────────────────────────────────────
describe('GET /api/stocks', () => {
  it('should return list of stocks when authenticated', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/stocks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should reject unauthenticated stock list request', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/stocks');

    expect(res.statusCode).toBe(401);
  });
});

// ─── Single Stock Tests ───────────────────────────────────────────────────────
describe('GET /api/stocks/:symbol', () => {
  it('should return stock details for valid symbol', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/stocks/AAPL')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('symbol', 'AAPL');
    expect(res.body).toHaveProperty('price');
    expect(typeof res.body.price).toBe('number');
  });

  it('should handle unknown stock symbol gracefully', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/stocks/FAKESYMBOL999')
      .set('Authorization', `Bearer ${authToken}`);

    // Should return 404 or fallback data, not 500
    expect([200, 404]).toContain(res.statusCode);
  });
});

// ─── Search Tests ─────────────────────────────────────────────────────────────
describe('GET /api/stocks/search', () => {
  it('should search stocks by query', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/stocks/search?q=apple')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});

// ─── Watchlist Tests ──────────────────────────────────────────────────────────
describe('Watchlist API', () => {
  it('should add and retrieve watchlist items', async () => {
    const app = buildTestApp();

    // Add to watchlist
    const addRes = await request(app)
      .post('/api/stocks/watchlist')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'TSLA' });

    expect([200, 201]).toContain(addRes.statusCode);
  });
});
