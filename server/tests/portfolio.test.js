/**
 * @file portfolio.test.js
 * @description Integration tests for portfolio management API.
 *              Tests: buy, sell, holdings fetch, portfolio summary, invalid trades.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('../routes/authRoutes');
const portfolioRoutes = require('../routes/portfolioRoutes');
const { notFound, globalErrorHandler } = require('../middleware/errorHandler');

// ─── Build test app ───────────────────────────────────────────────────────────
const buildTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
};

// ─── Test Data ────────────────────────────────────────────────────────────────
let authToken = '';
let portfolioId = '';
const testUser = {
  name: 'Portfolio Tester',
  email: `portfoliotester_${Date.now()}@example.com`,
  password: 'password123',
};

beforeAll(async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock-test';
  await mongoose.connect(MONGO_URI);

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
  await mongoose.connection.collection('portfolios').deleteMany({});
  await mongoose.connection.collection('holdings').deleteMany({});
  await mongoose.connection.collection('transactions').deleteMany({});
  await mongoose.connection.close();
});

// ─── Portfolio Overview ───────────────────────────────────────────────────────
describe('GET /api/portfolio', () => {
  it('should return portfolio data for authenticated user', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('holdings');
    expect(Array.isArray(res.body.holdings)).toBe(true);
  });

  it('should reject unauthenticated portfolio request', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/portfolio');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Buy Stock ────────────────────────────────────────────────────────────────
describe('POST /api/portfolio/buy', () => {
  it('should execute a buy trade successfully', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/portfolio/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'AAPL', quantity: 2, price: 150 });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject buy with zero quantity', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/portfolio/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'AAPL', quantity: 0, price: 150 });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should reject buy with missing symbol', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/portfolio/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantity: 2, price: 150 });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should reject buy with negative price', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/portfolio/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'AAPL', quantity: 2, price: -50 });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

// ─── Sell Stock ───────────────────────────────────────────────────────────────
describe('POST /api/portfolio/sell', () => {
  it('should reject sell of stock not held', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/portfolio/sell')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'MSFT', quantity: 100, price: 300 });

    // Should fail — user doesn't own MSFT shares
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

// ─── Transaction History ──────────────────────────────────────────────────────
describe('GET /api/portfolio/transactions', () => {
  it('should return transaction history', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/portfolio/transactions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
