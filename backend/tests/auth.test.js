const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

describe('Auth Routes - Full Coverage', () => {
  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/api/register').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('All fields are required.');
  });

  it('should return 400 for invalid field types', async () => {
    const res = await request(app).post('/api/register').send({
      username: 123,
      email: {},
      password: []
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid field types.');
  });

  it('should return 400 for username too short', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Username must be 3-20 characters/);
  });

  it('should return 400 for username too long', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'a'.repeat(21),
      email: 'test@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Username must be 3-20 characters/);
  });

  it('should return 400 for password too short', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Password must be at least 6 characters/);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'testuser',
      email: 'notanemail',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid email format.');
  });

  it('should register a user successfully', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'uniqueuser',
      email: 'uniqueuser@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered!');
  });

  it('should not register duplicate usernames', async () => {
    await request(app).post('/api/register').send({
      username: 'dupeuser',
      email: 'dupe1@example.com',
      password: 'password123'
    });
    const res = await request(app).post('/api/register').send({
      username: 'dupeuser',
      email: 'dupe2@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if login fields are missing', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Username and password are required.');
  });

  it('should return 400 for invalid login field types', async () => {
    const res = await request(app).post('/api/login').send({
      username: {},
      password: []
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid field types.');
  });

  it('should not login nonexistent user', async () => {
    const res = await request(app).post('/api/login').send({
      username: 'nouser',
      password: 'nopassword'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should not login with wrong password', async () => {
    await request(app).post('/api/register').send({
      username: 'wrongpassuser',
      email: 'wrongpass@example.com',
      password: 'password123'
    });
    const res = await request(app).post('/api/login').send({
      username: 'wrongpassuser',
      password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should login successfully with correct credentials', async () => {
    await request(app).post('/api/register').send({
      username: 'loginuser',
      email: 'loginuser@example.com',
      password: 'password123'
    });
    const res = await request(app).post('/api/login').send({
      username: 'loginuser',
      password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should handle registration failure (simulate DB error)', async () => {
    // Temporarily override User.save to throw
    const User = require('../models/User');
    const originalSave = User.prototype.save;
    User.prototype.save = () => { throw new Error('DB error'); };

    const res = await request(app).post('/api/register').send({
      username: 'failuser',
      email: 'failuser@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Registration failed');

    // Restore original save
    User.prototype.save = originalSave;
  });

  it('should handle login failure (simulate DB error)', async () => {
    // Temporarily override User.findOne to throw
    const User = require('../models/User');
    const originalFindOne = User.findOne;
    User.findOne = () => { throw new Error('DB error'); };

    const res = await request(app).post('/api/login').send({
      username: 'anyuser',
      password: 'anypassword'
    });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Login failed');

    // Restore original findOne
    User.findOne = originalFindOne;
  });
});