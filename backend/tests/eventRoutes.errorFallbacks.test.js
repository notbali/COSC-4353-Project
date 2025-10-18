const request = require('supertest');
const express = require('express');
const eventRoutes = require('../routes/eventRoutes');
const Event = require('../models/Event');

jest.mock('../models/Event', () => {
  function MockEvent(data) { Object.assign(this, data); }
  MockEvent.find = jest.fn();
  MockEvent.findById = jest.fn();
  MockEvent.findByIdAndUpdate = jest.fn();
  MockEvent.findByIdAndDelete = jest.fn();
  return MockEvent;
});

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

describe('Event Routes - error message fallbacks', () => {
  afterEach(() => jest.clearAllMocks());

  it('uses fallback message when save rejects with non-Error', async () => {
    Event.prototype.save = jest.fn().mockRejectedValue({});

    const res = await request(app).post('/events/create').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Error creating event');
  });

  it('uses fallback message when find rejects with non-Error', async () => {
    Event.find.mockRejectedValue({});

    const res = await request(app).get('/events/all');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error fetching events');
  });
});
