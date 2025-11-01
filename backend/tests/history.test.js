const request = require('supertest');
const express = require('express');

// Mock data stores
const mockUserProfiles = {};
const mockUserCredentials = {};
const mockEvents = {};
const mockVolunteerHistory = {};

// Mock the User model
jest.mock('../models/User', () => {
  const MockUserProfile = {
    find(query = {}) {
      let results = Object.values(mockUserProfiles).filter(profile => {
        if (Object.keys(query).length === 0) return true;
        return Object.entries(query).every(([key, value]) => profile[key] === value);
      });
      
      // Return a chainable query object
      return {
        populate: (field, select) => Promise.resolve(results)
      };
    },

    async findOne(query) {
      return Object.values(mockUserProfiles).find(profile => 
        Object.entries(query).every(([key, value]) => profile[key] === value)
      ) || null;
    }
  };

  const MockUserCredentials = {};

  return {
    UserProfile: MockUserProfile,
    UserCredentials: MockUserCredentials
  };
});

// Mock EventDetails model
jest.mock('../models/Event', () => {
  const MockEventDetails = {
    async find(query = {}) {
      return Object.values(mockEvents);
    },

    async findById(id) {
      return mockEvents[id] || null;
    }
  };

  return MockEventDetails;
});

// Mock VolunteerHistory model
jest.mock('../models/VolunteerHistory', () => {
  const MockVolunteerHistory = function(data) {
    this._id = `history_${Date.now()}_${Math.random()}`;
    this.createdAt = new Date();
    Object.assign(this, data);
  };

  MockVolunteerHistory.prototype.save = async function() {
    mockVolunteerHistory[this._id] = this;
    return this;
  };

  // For the /events endpoint, find() should return results directly when called with eventId
  MockVolunteerHistory.find = function(query = {}) {
    let results = Object.values(mockVolunteerHistory);
    
    if (query.userId) {
      results = results.filter(h => h.userId === query.userId);
    }
    if (query.eventId) {
      results = results.filter(h => h.eventId === query.eventId);
    }
    
    // Check if this is being used in the /volunteer-history/:userId endpoint (with chaining)
    // or the /events endpoint (direct results)
    if (query.userId && !query.eventId) {
      // This is for /volunteer-history/:userId - return chainable object
      return {
        populate: (field, select) => ({
          sort: () => Promise.resolve(results)
        })
      };
    } else {
      // This is for /events endpoint - return results directly as a Promise
      return Promise.resolve(results);
    }
  };

  MockVolunteerHistory.findOne = async function(query) {
    return Object.values(mockVolunteerHistory).find(history => 
      Object.entries(query).every(([key, value]) => history[key] === value)
    ) || null;
  };

  MockVolunteerHistory.findOneAndDelete = async function(query) {
    const history = Object.values(mockVolunteerHistory).find(h => 
      Object.entries(query).every(([key, value]) => h[key] === value)
    );
    if (history) {
      delete mockVolunteerHistory[history._id];
      return history;
    }
    return null;
  };

  return MockVolunteerHistory;
});

const historyRoutes = require('../routes/history');

const app = express();
app.use(express.json());
app.use('/api', historyRoutes);

describe('History Routes - Full Coverage', () => {
  beforeEach(() => {
    // Clear mock data before each test
    Object.keys(mockUserProfiles).forEach(key => delete mockUserProfiles[key]);
    Object.keys(mockUserCredentials).forEach(key => delete mockUserCredentials[key]);
    Object.keys(mockEvents).forEach(key => delete mockEvents[key]);
    Object.keys(mockVolunteerHistory).forEach(key => delete mockVolunteerHistory[key]);
  });

  describe('GET /volunteers', () => {
    it('should return empty array when no volunteers exist', async () => {
      const res = await request(app).get('/api/volunteers');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return list of volunteers with transformed data', async () => {
      // Create mock user credentials
      const userId = 'user_1';
      mockUserCredentials[userId] = { _id: userId, username: 'testuser' };

      // Create mock user profile
      const profile = {
        _id: 'profile_1',
        userId: { _id: userId, username: 'testuser' },
        fullName: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        skills: ['Programming', 'Teaching'],
        availability: ['2023-12-01'],
        preferences: ['Weekend events']
      };
      mockUserProfiles['profile_1'] = profile;

      const res = await request(app).get('/api/volunteers');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: userId,
        name: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        skills: ['Programming', 'Teaching'],
        availability: ['2023-12-01'],
        preferences: ['Weekend events']
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by overriding the find method
      const User = require('../models/User');
      const originalFind = User.UserProfile.find;
      
      User.UserProfile.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const res = await request(app).get('/api/volunteers');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching volunteers');

      // Restore original method
      User.UserProfile.find = originalFind;
    });
  });

  describe('GET /volunteer-history/:userId', () => {
    it('should return volunteer history for specific user', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';
      
      // Create mock history
      mockVolunteerHistory['history_1'] = {
        _id: 'history_1',
        userId: userId,
        eventId: eventId,
        volunteerName: 'John Doe',
        status: 'Registered',
        createdAt: new Date()
      };

      const res = await request(app).get(`/api/volunteer-history/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should return empty array for user with no history', async () => {
      const res = await request(app).get('/api/volunteer-history/nonexistent');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const VolunteerHistory = require('../models/VolunteerHistory');
      const originalFind = VolunteerHistory.find;
      
      // Mock find to return an object that throws when populate is called
      VolunteerHistory.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const res = await request(app).get('/api/volunteer-history/user_1');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching volunteer history');

      // Restore original method
      VolunteerHistory.find = originalFind;
    });
  });

  describe('GET /events', () => {
    it('should return events with assigned volunteers', async () => {
      // Create mock event
      const eventId = 'event_1';
      mockEvents[eventId] = {
        _id: eventId,
        eventName: 'Test Event',
        eventDateISO: '2025-12-01',
        toObject: function() { 
          const { toObject, ...rest } = this;
          return rest;
        }
      };

      // Create mock volunteer history
      const userId = 'user_1';
      mockVolunteerHistory['history_1'] = {
        _id: 'history_1',
        userId: userId,
        eventId: eventId,
        volunteerName: 'John Doe',
        status: 'Registered',
        createdAt: new Date()
      };

      // Create mock user profile
      mockUserProfiles['profile_1'] = {
        userId: userId,
        fullName: 'John Doe'
      };

      const res = await request(app).get('/api/events');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('futureEvents');
      expect(res.body).toHaveProperty('pastEvents');
    });

    it('should handle events with no volunteers', async () => {
      // Create mock event with no volunteers
      const eventId = 'event_1';
      mockEvents[eventId] = {
        _id: eventId,
        eventName: 'Test Event',
        eventDateISO: '2025-12-01',
        toObject: function() { 
          const { toObject, ...rest } = this;
          return rest;
        }
      };

      const res = await request(app).get('/api/events');
      expect(res.statusCode).toBe(200);
      expect(res.body.futureEvents).toHaveLength(1);
      expect(res.body.futureEvents[0].assignedVolunteerNames).toBe('Unassigned');
    });

    it('should handle database errors', async () => {
      const EventDetails = require('../models/Event');
      const originalFind = EventDetails.find;
      EventDetails.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/events');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching events');

      // Restore original method
      EventDetails.find = originalFind;
    });
  });

  describe('POST /volunteer-history', () => {
    it('should create volunteer history record successfully', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';

      // Create mock event
      mockEvents[eventId] = {
        _id: eventId,
        eventName: 'Test Event',
        currentVolunteers: 0,
        save: async function() { return this; }
      };

      // Create mock user profile
      mockUserProfiles['profile_1'] = {
        userId: userId,
        fullName: 'John Doe'
      };

      const res = await request(app)
        .post('/api/volunteer-history')
        .send({
          userId: userId,
          eventId: eventId,
          volunteerName: 'john_doe'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Successfully registered for event');
      expect(res.body.historyRecord.volunteerName).toBe('John Doe'); // Should use full name
    });

    it('should return 400 if already registered', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';

      // Create existing history record
      mockVolunteerHistory['history_1'] = {
        userId: userId,
        eventId: eventId
      };

      const res = await request(app)
        .post('/api/volunteer-history')
        .send({
          userId: userId,
          eventId: eventId,
          volunteerName: 'john_doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Already registered for this event');
    });

    it('should return 404 if event not found', async () => {
      const res = await request(app)
        .post('/api/volunteer-history')
        .send({
          userId: 'user_1',
          eventId: 'nonexistent_event',
          volunteerName: 'john_doe'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Event not found');
    });

    it('should handle validation errors', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';

      // Create mock event
      mockEvents[eventId] = {
        _id: eventId,
        eventName: 'Test Event',
        currentVolunteers: 0,
        save: async function() { 
          mockEvents[eventId] = this;
          return this; 
        }
      };

      // Temporarily override the save method to simulate validation error
      const VolunteerHistory = require('../models/VolunteerHistory');
      const originalSave = VolunteerHistory.prototype.save;
      
      VolunteerHistory.prototype.save = jest.fn().mockRejectedValue({
        name: 'ValidationError',
        errors: {
          volunteerName: { message: 'Volunteer name is required' }
        }
      });

      const res = await request(app)
        .post('/api/volunteer-history')
        .send({
          userId: userId,
          eventId: eventId,
          volunteerName: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation error');
      
      // Restore original save method
      VolunteerHistory.prototype.save = originalSave;
    });
  });

  describe('DELETE /volunteer-history/:userId/:eventId', () => {
    it('should successfully remove volunteer from event', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';

      // Create mock history record
      mockVolunteerHistory['history_1'] = {
        _id: 'history_1',
        userId: userId,
        eventId: eventId
      };

      // Create mock event
      mockEvents[eventId] = {
        _id: eventId,
        currentVolunteers: 1,
        save: async function() { return this; }
      };

      const res = await request(app).delete(`/api/volunteer-history/${userId}/${eventId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully unregistered from event');
    });

    it('should return 404 if volunteer registration not found', async () => {
      const res = await request(app).delete('/api/volunteer-history/nonexistent/nonexistent');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Volunteer registration not found');
    });

    it('should handle event update gracefully when event not found', async () => {
      const userId = 'user_1';
      const eventId = 'event_1';

      // Create mock history record but no event
      mockVolunteerHistory['history_1'] = {
        _id: 'history_1',
        userId: userId,
        eventId: eventId
      };

      const res = await request(app).delete(`/api/volunteer-history/${userId}/${eventId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully unregistered from event');
    });

    it('should handle database errors', async () => {
      const VolunteerHistory = require('../models/VolunteerHistory');
      const originalFindOneAndDelete = VolunteerHistory.findOneAndDelete;
      VolunteerHistory.findOneAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/api/volunteer-history/user_1/event_1');
      
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error removing volunteer from event');

      // Restore original method
      VolunteerHistory.findOneAndDelete = originalFindOneAndDelete;
    });
  });
});
