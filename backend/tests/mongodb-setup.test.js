const mongoose = require('mongoose');
const { UserCredentials, UserProfile } = require('../models/User');
const EventDetails = require('../models/Event');
const VolunteerHistory = require('../models/VolunteerHistory');
const States = require('../models/States');
const bcrypt = require('bcryptjs');

const uniqueId = () => Math.random().toString(36).slice(2, 10);
const uniqueUsername = (base = 'user') => {
  const suffix = uniqueId();
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '') || 'user';
  const maxBaseLength = Math.max(1, 30 - suffix.length - 1);
  const trimmedBase = sanitized.slice(0, maxBaseLength);
  return `${trimmedBase}-${suffix}`;
};
const uniqueEmail = (base = 'user') => {
  const suffix = uniqueId();
  const sanitized = base.replace(/[^a-zA-Z0-9]/g, '') || 'user';
  return `${sanitized.slice(0, 20)}${suffix}@example.com`;
};
const uniqueEventName = (base = 'Test Event') => `${base} ${uniqueId()}`;
const uniqueStateCode = () => uniqueId().slice(0, 2).toUpperCase();
const uniqueStateName = () => `State-${uniqueId()}`;
const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

const createUserCredentials = async (overrides = {}) => {
  const hashedPassword = overrides.password || await bcrypt.hash('password123', 10);
  const userCredentials = new UserCredentials({
    username: overrides.username || uniqueUsername('testuser'),
    email: overrides.email || uniqueEmail('testuser'),
    password: hashedPassword,
    ...overrides
  });
  await userCredentials.save();
  return userCredentials;
};

const createUserProfile = async ({ userId, ...overrides }) => {
  const profile = new UserProfile({
    userId,
    fullName: 'Test User',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipcode: '12345',
    skills: ['Communication', 'Organization'],
    preferences: 'Prefers outdoor activities',
    availability: ['2025-01-15', '2025-01-20'],
    ...overrides
  });
  await profile.save();
  return profile;
};

const createEventDetails = async (overrides = {}) => {
  const baseDate = overrides.eventDate || futureDate();
  const baseISO = overrides.eventDateISO || baseDate.toISOString().split('T')[0];
  const event = new EventDetails({
    eventName: overrides.eventName || uniqueEventName(),
    eventDescription:
      overrides.eventDescription ||
      'This is a test event description that meets the minimum length requirement',
    location: overrides.location || '123 Test Location',
    requiredSkills: overrides.requiredSkills || ['Communication', 'Organization'],
    urgency: overrides.urgency || 'Medium',
    eventDate: baseDate,
    eventDateISO: baseISO,
    maxVolunteers: overrides.maxVolunteers || 10,
    currentVolunteers: overrides.currentVolunteers || 0,
    ...overrides
  });
  await event.save();
  return event;
};

// Test database connection
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/volunteer-app-test';
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Close connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('MongoDB Schema Requirements', () => {
  describe('UserCredentials Collection', () => {
    test('should create user credentials with encrypted password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const username = uniqueUsername('testuser');
      const email = uniqueEmail('testuser');
      const savedUser = await createUserCredentials({
        password: hashedPassword,
        username,
        email
      });
      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(username);
      expect(savedUser.email).toBe(email);
      expect(savedUser.password).toBe(hashedPassword);
    });

    test('should validate required fields', async () => {
      const userCredentials = new UserCredentials({});
      
      try {
        await userCredentials.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.username).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.password).toBeDefined();
      }
    });

    test('should validate email format', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: uniqueUsername('testuser'),
        email: 'invalid-email',
        password: hashedPassword
      });
      
      try {
        await userCredentials.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.email).toBeDefined();
      }
    });

    test('should validate username length', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'ab', // Too short
        email: uniqueEmail('user'),
        password: hashedPassword
      });
      
      try {
        await userCredentials.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.username).toBeDefined();
      }
    });
  });

  describe('UserProfile Collection', () => {
    test('should create user profile with all required fields', async () => {
      const userCredentials = await createUserCredentials();
      const savedProfile = await createUserProfile({ userId: userCredentials._id });
      expect(savedProfile._id).toBeDefined();
      expect(savedProfile.fullName).toBe('Test User');
      expect(savedProfile.skills).toEqual(['Communication', 'Organization']);
    });

    test('should validate zipcode format', async () => {
      const userCredentials = await createUserCredentials();

      const userProfile = new UserProfile({
        userId: userCredentials._id,
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipcode: 'invalid-zip',
        skills: ['Communication'],
        preferences: 'Test preferences',
        availability: ['2025-01-15']
      });
      
      try {
        await userProfile.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.zipcode).toBeDefined();
      }
    });

    test('should validate availability date format', async () => {
      const userCredentials = await createUserCredentials();

      const userProfile = new UserProfile({
        userId: userCredentials._id,
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipcode: '12345',
        skills: ['Communication'],
        preferences: 'Test preferences',
        availability: ['invalid-date']
      });
      
      try {
        await userProfile.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.availability).toBeDefined();
      }
    });
  });

  describe('EventDetails Collection', () => {
    test('should create event with all required fields', async () => {
      const eventName = uniqueEventName();
      const savedEvent = await createEventDetails({ eventName, eventDateISO: '2025-12-31', eventDate: new Date('2025-12-31') });
      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.eventName).toBe(eventName);
      expect(savedEvent.requiredSkills).toEqual(['Communication', 'Organization']);
      expect(savedEvent.urgency).toBe('Medium');
    });

    test('should validate urgency enum values', async () => {
      const event = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication'],
        urgency: 'InvalidUrgency',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31'
      });
      
      try {
        await event.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.urgency).toBeDefined();
      }
    });

    test('should validate event date is in the future', async () => {
      const event = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication'],
        urgency: 'Medium',
        eventDate: new Date('2020-01-01'), // Past date
        eventDateISO: '2020-01-01'
      });
      
      try {
        await event.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.eventDate).toBeDefined();
      }
    });

    test('should validate required skills array is not empty', async () => {
      const event = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: [], // Empty array
        urgency: 'Medium',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31'
      });
      
      try {
        await event.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.requiredSkills).toBeDefined();
      }
    });
  });

  describe('VolunteerHistory Collection', () => {
    test('should create volunteer history record', async () => {
      const userCredentials = await createUserCredentials();
      const event = await createEventDetails();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: event.eventName,
        volunteerName: 'Test Volunteer',
        status: 'Registered',
        hoursVolunteered: 4
      });

      const savedHistory = await volunteerHistory.save();
      expect(savedHistory._id).toBeDefined();
      expect(savedHistory.status).toBe('Registered');
      expect(savedHistory.hoursVolunteered).toBe(4);
    });

    test('should validate status enum values', async () => {
      const userCredentials = await createUserCredentials();
      const event = await createEventDetails();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: event.eventName,
        volunteerName: 'Test Volunteer',
        status: 'InvalidStatus'
      });

      try {
        await volunteerHistory.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.status).toBeDefined();
      }
    });

    test('should validate rating range', async () => {
      const userCredentials = await createUserCredentials();
      const event = await createEventDetails();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: event.eventName,
        volunteerName: 'Test Volunteer',
        rating: 6 // Invalid rating
      });

      try {
        await volunteerHistory.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.rating).toBeDefined();
      }
    });
  });

  describe('States Collection', () => {
    test('should create state record', async () => {
      const stateCode = uniqueStateCode();
      const stateName = uniqueStateName();
      const state = new States({
        stateCode,
        stateName,
        region: 'West'
      });

      const savedState = await state.save();
      expect(savedState._id).toBeDefined();
      expect(savedState.stateCode).toBe(stateCode);
      expect(savedState.stateName).toBe(stateName);
      expect(savedState.region).toBe('West');
    });

    test('should validate state code length', async () => {
      const state = new States({
        stateCode: 'CAL', // Too long
        stateName: 'California',
        region: 'West'
      });
      
      try {
        await state.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.stateCode).toBeDefined();
      }
    });

    test('should validate region enum values', async () => {
      const state = new States({
        stateCode: uniqueStateCode(),
        stateName: uniqueStateName(),
        region: 'InvalidRegion'
      });
      
      try {
        await state.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.region).toBeDefined();
      }
    });
  });
});

describe('Database Relationships', () => {
  test('should maintain referential integrity between UserCredentials and UserProfile', async () => {
    const username = uniqueUsername('testuser');
    const userCredentials = await createUserCredentials({ username, email: uniqueEmail('testuser') });
    const userProfile = await createUserProfile({
      userId: userCredentials._id,
      fullName: 'Test User',
      skills: ['Communication'],
      preferences: 'Test preferences',
      availability: ['2025-01-15']
    });

    // Verify the relationship
    const populatedProfile = await UserProfile.findById(userProfile._id).populate('userId');
    expect(populatedProfile.userId.username).toBe(username);
  });

  test('should maintain referential integrity between EventDetails and VolunteerHistory', async () => {
    const event = await createEventDetails();

    const userCredentials = await createUserCredentials();

    const volunteerHistory = new VolunteerHistory({
      userId: userCredentials._id,
      eventId: event._id,
      eventName: event.eventName,
      volunteerName: 'Test Volunteer'
    });
    await volunteerHistory.save();

    // Verify the relationship
    const populatedHistory = await VolunteerHistory.findById(volunteerHistory._id).populate('eventId');
    expect(populatedHistory.eventId.eventName).toBe(event.eventName);
  });
});
mongodb-setup.test.js
16 KB