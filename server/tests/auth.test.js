/**
 * @file auth.test.js
 * @description Integration tests for authentication API endpoints.
 *              Tests: register, login, profile, invalid inputs, duplicate users.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Import routes
const authRoutes = require('../routes/authRoutes');
const { notFound, globalErrorHandler } = require('../middleware/errorHandler');

// ─── Build minimal test app ───────────────────────────────────────────────────
const buildTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
};

// ─── Test Data ────────────────────────────────────────────────────────────────
const testUser = {
  name: 'Test User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'password123',
};

let authToken = '';

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock-test';
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  // Clean up test users
  await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
  await mongoose.connection.close();
});

// ─── REGISTER Tests ───────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should reject registration with missing fields', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should reject registration with short password', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test2@example.com', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/6 characters/i);
  });

  it('should reject duplicate email registration', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser); // Already registered above

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ─── LOGIN Tests ──────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(testUser.email);

    authToken = res.body.token; // Save for protected route tests
  });

  it('should reject login with wrong password', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('should reject login with non-existent email', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
  });

  it('should reject login with missing fields', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(400);
  });
});

// ─── PROFILE Tests ────────────────────────────────────────────────────────────
describe('GET /api/auth/profile', () => {
  it('should return user profile with valid token', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should reject request without token', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.statusCode).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const app = buildTestApp();
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.statusCode).toBe(401);
  });
});
