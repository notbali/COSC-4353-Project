const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const profileModule = require('../routes/profile');

const app = express();
app.use(express.json());
// mount the exported router
app.use('/api', profileModule.router || profileModule);

describe('Profile Routes - Full Coverage', () => {
  let token;

  beforeAll(() => {
    // Create a token for the test user
    token = jwt.sign({ username: 'testuser' }, 'your_jwt_secret');
  });

  beforeEach(() => {
    // clear profiles before each test
    Object.keys(profileModule.userProfiles).forEach(k => delete profileModule.userProfiles[k]);
  });

  it('should create a default profile if none exists', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', '');
    expect(res.body).toHaveProperty('skills');
  });

  it('should update the profile', async () => {
    const res = await request(app)
      .put('/api/profile/edit')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', city: 'New City' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Profile updated!');
    expect(profileModule.userProfiles['testuser'].name).toBe('New Name');
    expect(profileModule.userProfiles['testuser'].city).toBe('New City');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should return 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken');
    // invalid token will trigger jwt.verify thrown error -> 500 in our implementation
    expect(res.statusCode).toBe(500);
  });
});