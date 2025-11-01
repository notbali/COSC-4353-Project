const request = require('supertest');
const express = require('express');
const historyRoutes = require('../routes/history');

const app = express();
app.use(express.json());
app.use('/api', historyRoutes);

describe('History Routes - Full Coverage', () => {
    it('should fetch volunteer history for a user', async () => {
        const userId = 1;
        const res = await request(app).get(`/api/history/${userId}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    it('should return 404 if volunteer history not found', async () => {
        const userId = 9999;
        const res = await request(app).get(`/api/history/${userId}`);
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message', 'History not found');
    });
    it('should return 500 if there is a server error', async () => {
        // Mock the VolunteerHistory.find method to throw an error
        const VolunteerHistory = require('../models/VolunteerHistory');
        jest.spyOn(VolunteerHistory, 'find').mockImplementation(() => {
            throw new Error('Database error');
        });
        const userId = 1;
        const res = await request(app).get(`/api/history/${userId}`);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('message', 'Internal server error');
    }
    );
    it('should create a new volunteer history record', async () => {
        const newHistory = {
            userId: 1,
            activity: 'Volunteered at local shelter',
            date: '2023-03-15'
        };
        const res = await request(app).post('/api/history').send(newHistory);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'History created successfully');
    });
    it('should return 400 if required fields are missing', async () => {
        const newHistory = {
            userId: 1,
            activity: 'Volunteered at local shelter',
            // date is missing
        };
        const res = await request(app).post('/api/history').send(newHistory);
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Missing required fields: date');
    });
    it('should return 500 if there is a server error when creating history', async () => {
        // Mock the VolunteerHistory.create method to throw an error
        const VolunteerHistory = require('../models/VolunteerHistory');
        jest.spyOn(VolunteerHistory, 'create').mockImplementation(() => {
            throw new Error('Database error');
        });
        const newHistory = {
            userId: 1,
            activity: 'Volunteered at local shelter',
            date: '2023-03-15'
        };
        const res = await request(app).post('/api/history').send(newHistory);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('message', 'Error creating history');
    }
    );
    it('should return 400 if there is a validation error when creating history', async () => {
        // Mock the VolunteerHistory.create method to throw a validation error
        const VolunteerHistory = require('../models/VolunteerHistory');
        jest.spyOn(VolunteerHistory, 'create').mockImplementation(() => {
            const error = new Error('Validation error');
            error.name = 'ValidationError';
            error.errors = { date: { message: 'Date is required' } };
            throw error;
        });
        const newHistory = {
            userId: 1,
            activity: 'Volunteered at local shelter',
            // date is missing
        };
        const res = await request(app).post('/api/history').send(newHistory);
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Validation error');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toContain('Date is required');
    });
    it('should delete a volunteer history record', async () => {
        const userId = 1;
        const eventId = 1;
        const res = await request(app).delete(`/api/history/${userId}/${eventId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'History deleted successfully');
    });
    it('should return 404 if history record to delete is not found', async () => {
        const userId = 9999;
        const eventId = 9999;
        const res = await request(app).delete(`/api/history/${userId}/${eventId}`);
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message', 'History not found');
    });
    it('should return 500 if there is a server error when deleting history', async () => {
        // Mock the VolunteerHistory.findOneAndDelete method to throw an error
        const VolunteerHistory = require('../models/VolunteerHistory');
        jest.spyOn(VolunteerHistory, 'findOneAndDelete').mockImplementation(() => {
            throw new Error('Database error');
        });
        const userId = 1;
        const eventId = 1;
        const res = await request(app).delete(`/api/history/${userId}/${eventId}`);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('message', 'Error deleting history');
    });
  });
  