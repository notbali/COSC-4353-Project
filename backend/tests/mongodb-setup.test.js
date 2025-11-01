const mongoose = require('mongoose');
const { UserCredentials, UserProfile } = require('../models/User');
const EventDetails = require('../models/Event');
const VolunteerHistory = require('../models/VolunteerHistory');
const States = require('../models/States');
const bcrypt = require('bcryptjs');

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
  await EventDetails.deleteMany({});
  await VolunteerHistory.deleteMany({});
  await States.deleteMany({});
});

// Close connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('MongoDB Schema Requirements', () => {
  describe('UserCredentials Collection', () => {
    test('should create user credentials with encrypted password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      const savedUser = await userCredentials.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
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
        username: 'testuser',
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
        email: 'test@example.com',
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
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

      const userProfile = new UserProfile({
        userId: userCredentials._id,
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipcode: '12345',
        skills: ['Communication', 'Organization'],
        preferences: 'Prefers outdoor activities',
        availability: ['2025-01-15', '2025-01-20']
      });
      
      const savedProfile = await userProfile.save();
      expect(savedProfile._id).toBeDefined();
      expect(savedProfile.fullName).toBe('Test User');
      expect(savedProfile.skills).toEqual(['Communication', 'Organization']);
    });

    test('should validate zipcode format', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

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
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

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
      const event = new EventDetails({
        eventName: 'Test Event',
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication', 'Organization'],
        urgency: 'Medium',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31',
        maxVolunteers: 10,
        currentVolunteers: 0
      });
      
      const savedEvent = await event.save();
      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.eventName).toBe('Test Event');
      expect(savedEvent.requiredSkills).toEqual(['Communication', 'Organization']);
      expect(savedEvent.urgency).toBe('Medium');
    });

    test('should validate urgency enum values', async () => {
      const event = new EventDetails({
        eventName: 'Test Event',
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
        eventName: 'Test Event',
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
        eventName: 'Test Event',
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
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

      const event = new EventDetails({
        eventName: 'Test Event',
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication'],
        urgency: 'Medium',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31'
      });
      await event.save();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: 'Test Event',
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
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

      const event = new EventDetails({
        eventName: 'Test Event',
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication'],
        urgency: 'Medium',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31'
      });
      await event.save();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: 'Test Event',
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
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userCredentials = new UserCredentials({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      await userCredentials.save();

      const event = new EventDetails({
        eventName: 'Test Event',
        eventDescription: 'This is a test event description that meets the minimum length requirement',
        location: '123 Test Location',
        requiredSkills: ['Communication'],
        urgency: 'Medium',
        eventDate: new Date('2025-12-31'),
        eventDateISO: '2025-12-31'
      });
      await event.save();

      const volunteerHistory = new VolunteerHistory({
        userId: userCredentials._id,
        eventId: event._id,
        eventName: 'Test Event',
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
      const state = new States({
        stateCode: 'CA',
        stateName: 'California',
        region: 'West'
      });
      
      const savedState = await state.save();
      expect(savedState._id).toBeDefined();
      expect(savedState.stateCode).toBe('CA');
      expect(savedState.stateName).toBe('California');
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
        stateCode: 'CA',
        stateName: 'California',
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
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userCredentials = new UserCredentials({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    await userCredentials.save();

    const userProfile = new UserProfile({
      userId: userCredentials._id,
      fullName: 'Test User',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipcode: '12345',
      skills: ['Communication'],
      preferences: 'Test preferences',
      availability: ['2025-01-15']
    });
    await userProfile.save();

    // Verify the relationship
    const populatedProfile = await UserProfile.findById(userProfile._id).populate('userId');
    expect(populatedProfile.userId.username).toBe('testuser');
  });

  test('should maintain referential integrity between EventDetails and VolunteerHistory', async () => {
    const event = new EventDetails({
      eventName: 'Test Event',
      eventDescription: 'This is a test event description that meets the minimum length requirement',
      location: '123 Test Location',
      requiredSkills: ['Communication'],
      urgency: 'Medium',
      eventDate: new Date('2025-12-31'),
      eventDateISO: '2025-12-31'
    });
    await event.save();

    const hashedPassword = await bcrypt.hash('password123', 10);
    const userCredentials = new UserCredentials({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    await userCredentials.save();

    const volunteerHistory = new VolunteerHistory({
      userId: userCredentials._id,
      eventId: event._id,
      eventName: 'Test Event',
      volunteerName: 'Test Volunteer'
    });
    await volunteerHistory.save();

    // Verify the relationship
    const populatedHistory = await VolunteerHistory.findById(volunteerHistory._id).populate('eventId');
    expect(populatedHistory.eventId.eventName).toBe('Test Event');
  });
});
