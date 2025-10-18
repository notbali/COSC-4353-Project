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

describe('Event Routes - toObject branch', () => {
  afterEach(() => jest.clearAllMocks());

  it('handles events that are Mongoose docs with toObject()', async () => {
    const docLike = { _id: 'doc1', eventName: 'Doc Event', location: 'X' };
    const doc = { toObject: () => docLike };
    Event.find.mockResolvedValue([doc]);

    const res = await request(app).get('/events/all-with-volunteer-count');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].volunteerCount).toBe(0);
    expect(res.body[0].volunteers).toEqual([]);
  });
});
