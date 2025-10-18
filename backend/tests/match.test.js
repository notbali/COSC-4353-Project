const request = require('supertest');
const express = require('express');
const matchRoutes = require('../routes/match');

const app = express();
app.use(express.json());
app.use('/api', matchRoutes);

describe('Match Routes - Full Coverage', () => {
    it('should find matching events for a volunteer', async () => {
    const res = await request(app).get('/api/match/2');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('should not find events that are in the past', async () => {
    const res = await request(app).get('/api/match/1');
    const currentDate = new Date().toISOString().split('T')[0];
    res.body.forEach(event => {
      expect(event.eventDateISO >= currentDate).toBe(true);
    });
  });
  it('should not return events that do not match volunteer skills', async () => {
    const res = await request(app).get('/api/match/2');
    expect(res.statusCode).toBe(200);
    res.body.forEach(event => {
      expect(event.requiredSkills).toBeDefined();
      expect(event.requiredSkills).toBe('Transportation');
    });
  });
    it('should return 400 if volunteerId or eventId is missing', async () => {
    const res = await request(app).post('/api/match').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('volunteerId and eventId required');
  });
  it('should return 404 if volunteer not found', async () => {
    const res = await request(app).post('/api/match').send({ volunteerId: 9999, eventId: 1 });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Volunteer not found');
  });
  it('should return 404 if event not found', async () => {
    const res = await request(app).post('/api/match').send({ volunteerId: 1, eventId: 9999 });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Event not found');
  });
  it('should match volunteer to event successfully', async () => {
    const res = await request(app).post('/api/match').send({ volunteerId: 2, eventId: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('match');
    expect(res.body).toHaveProperty('event');
  });
});

