const request = require('supertest');
const express = require('express');
const historyRoutes = require('../routes/history');

const app = express();
app.use(express.json());
app.use('/api', historyRoutes);

describe('History Routes - Full Coverage', () => {
  it('should get volunteers', async () => {
    const res = await request(app).get('/api/volunteers');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
    it('should get events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('futureEvents');
    expect(res.body).toHaveProperty('pastEvents');
  });
  it('should have future events only with dates today or later', async () => {
    const res = await request(app).get('/api/events');
    const currentDate = new Date().toISOString().split('T')[0];
    const futureEvents = res.body.futureEvents;
    futureEvents.forEach(event => {
      expect(event.eventDateISO >= currentDate).toBe(true);
    });
  });
  it('should have past events only with dates before today', async () => {
    const res = await request(app).get('/api/events');
    const currentDate = new Date().toISOString().split('T')[0];
    const pastEvents = res.body.pastEvents;
    pastEvents.forEach(event => {
      expect(event.eventDateISO < currentDate).toBe(true);
    });
  });
  it('should have future events sorted by date', async () => {
    const res = await request(app).get('/api/events');
    const futureEvents = res.body.futureEvents;
    for (let i = 1; i < futureEvents.length; i++) {
      expect(futureEvents[i].eventDateISO >= futureEvents[i - 1].eventDateISO).toBe(true);
    }
  });
  it('should have past events sorted by date', async () => {
    const res = await request(app).get('/api/events');
    const pastEvents = res.body.pastEvents;
    for (let i = 1; i < pastEvents.length; i++) {
      expect(pastEvents[i].eventDateISO <= pastEvents[i - 1].eventDateISO).toBe(true);
    } 
  });
});

