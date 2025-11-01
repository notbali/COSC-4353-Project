const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the actual server setup
const app = require('../server');

// Test database connection
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/volunteer-app-test';
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after each test
afterEach(async () => {
  await UserCredentials.deleteMany({});
  await UserProfile.deleteMany({});
});

// Close connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('MongoDB Authentication System', () => {
  describe('User Registration', () => {
    test('should register user with valid credentials', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully!');
      expect(res.body.userId).toBeDefined();
    });

    test('should return validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
      expect(res.body.errors).toBeDefined();
    });

    test('should return validation error for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });

    test('should return validation error for short username', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });

    test('should return validation error for short password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      const res = await request(app)
        .post('/api/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });

    test('should not allow duplicate usernames', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/register')
        .send(userData);

      // Second registration with same username
      const res = await request(app)
        .post('/api/register')
        .send({
          ...userData,
          email: 'different@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username or email already exists');
    });

    test('should not allow duplicate emails', async () => {
      const userData = {
        username: 'testuser',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/register')
        .send(userData);

      // Second registration with same email
      const res = await request(app)
        .post('/api/register')
        .send({
          ...userData,
          username: 'differentuser'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username or email already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      const { UserCredentials, UserProfile } = require('../models/User');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const userCredentials = new UserCredentials({
        username: 'logintest',
        email: 'logintest@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

      const userProfile = new UserProfile({
        userId: userCredentials._id,
        fullName: 'Login Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipcode: '12345',
        skills: ['Communication'],
        preferences: 'Test preferences',
        availability: ['2025-01-15']
      });
      await userProfile.save();
    });

    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    test('should not login with invalid username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    test('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Profile Management', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create a test user and get auth token
      const { UserCredentials, UserProfile } = require('../models/User');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const userCredentials = new UserCredentials({
        username: 'profiletest',
        email: 'profiletest@example.com',
        password: hashedPassword
      });
      await userCredentials.save();
      userId = userCredentials._id;

      const userProfile = new UserProfile({
        userId: userCredentials._id,
        fullName: 'Profile Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipcode: '12345',
        skills: ['Communication'],
        preferences: 'Test preferences',
        availability: ['2025-01-15']
      });
      await userProfile.save();

      // Generate auth token
      authToken = jwt.sign(
        { username: 'profiletest', userId: userId }, 
        process.env.JWT_SECRET || 'your_jwt_secret'
      );
    });

    test('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Profile Test User');
      expect(res.body.skills).toEqual(['Communication']);
    });

    test('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('no token found');
    });

    test('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('invalid token');
    });

    test('should update user profile with valid data', async () => {
      const updateData = {
        fullName: 'Updated Name',
        city: 'Updated City',
        skills: ['Communication', 'Organization']
      };

      const res = await request(app)
        .put('/api/profile/edit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully!');
    });

    test('should return validation error for invalid profile data', async () => {
      const invalidData = {
        zipcode: 'invalid-zip',
        availability: ['invalid-date']
      };

      const res = await request(app)
        .put('/api/profile/edit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('Data Persistence', () => {
    test('should persist user data across requests', async () => {
      // Register a user
      const userData = {
        username: 'persisttest',
        email: 'persisttest@example.com',
        password: 'password123'
      };

      const registerRes = await request(app)
        .post('/api/register')
        .send(userData);

      expect(registerRes.status).toBe(201);
      const userId = registerRes.body.userId;

      // Login to get token
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: 'persisttest',
          password: 'password123'
        });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token;

      // Get profile
      const profileRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body).toBeDefined();
    });
  });
});
