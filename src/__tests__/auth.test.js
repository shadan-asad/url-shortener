const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const { redisClient } = require('../config/redis');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Clear test database collections
    await User.deleteMany({});
    // Clear redis
    await redisClient.flushAll();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  describe('Google Authentication Endpoints', () => {
    test('GET /api/auth/google should redirect to Google', async () => {
      const response = await request(app).get('/api/auth/google');
      expect(response.status).toBe(302); // Redirect status
      expect(response.header.location).toContain('accounts.google.com');
    });
  });

  describe('Token Verification', () => {
    let validToken;
    
    beforeAll(() => {
      // Create a test token
      validToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET
      );
    });

    test('GET /api/auth/verify should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/verify');
      expect(response.status).toBe(401);
    });

    test('GET /api/auth/verify should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);
      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });
  });

  describe('Logout', () => {
    let validToken;
    
    beforeAll(() => {
      validToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET
      );
    });

    test('POST /api/auth/logout should blacklist token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);
      expect(response.status).toBe(200);
      
      // Verify token is blacklisted by trying to use it
      const verifyResponse = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);
      expect(verifyResponse.status).toBe(401);
    });
  });
});