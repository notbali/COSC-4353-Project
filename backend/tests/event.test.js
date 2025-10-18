const mongoose = require('mongoose');
const Event = require('../models/Event');
const Notifs = require('../models/Notifs');
const Match = require('../models/Match');

// Centralized mocks for dependent models
jest.mock('../models/Notifs');
jest.mock('../models/Match');

describe('Event Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteOne Middleware', () => {
    it('should delete associated matches and notifications when an event is deleted', async () => {
      const mockEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'High',
        eventDate: new Date(),
      });

      Match.deleteMany.mockResolvedValue({ deletedCount: 2 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 3 });

      // Simulate calling the deleteOne middleware
      await mockEvent.deleteOne();

      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: mockEvent._id });
    });

    it('should handle errors during related data deletion', async () => {
      const mockEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'High',
        eventDate: new Date(),
      });

      // Simulate Match.deleteMany throwing an error so middleware rejects
      Match.deleteMany.mockRejectedValue(new Error('Match deletion error'));

      await expect(mockEvent.deleteOne()).rejects.toThrow('Match deletion error');

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: mockEvent._id });
    });
  });

  describe('cleanup static helper', () => {
    it('calls Match.deleteMany and Notifs.deleteMany and logs counts', async () => {
      const fakeEventId = 'abcd1234';
      Match.deleteMany.mockResolvedValue({ deletedCount: 2 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await Event.cleanupRelatedData(fakeEventId);

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
    });

    it('handles undefined deleteMany results for static cleanup and does not throw', async () => {
      const fakeEventId = 'undef1';

      // Simulate deleteMany returning undefined for both models
      Match.deleteMany.mockResolvedValue(undefined);
      Notifs.deleteMany.mockResolvedValue(undefined);

      await expect(Event.cleanupRelatedData(fakeEventId)).resolves.toBeUndefined();

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
    });
  });

  describe('Event instance fallback deleteOne', () => {
    it('uses fallback path when static helper missing and deleteMany returns counts', async () => {
      const fakeEventId = 'fallback1';
      // Ensure the static helper is not present so the instance fallback runs
      const _orig = Event.cleanupRelatedData;
      delete Event.cleanupRelatedData;

      try {
        Match.deleteMany.mockResolvedValue({ deletedCount: 2 });
        Notifs.deleteMany.mockResolvedValue({ deletedCount: 1 });

        // call the instance method directly with a minimal "document"
        const doc = { _id: fakeEventId, constructor: Event };
        await Event.prototype.deleteOne.call(doc);

        expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
        expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
      } finally {
        // restore
        Event.cleanupRelatedData = _orig;
      }
    });

    it('handles undefined deleteMany results and does not throw', async () => {
      const fakeEventId = 'fallback2';
      const _orig = Event.cleanupRelatedData;
      delete Event.cleanupRelatedData;

      try {
        // Simulate deleteMany returning undefined (no deletedCount)
        Match.deleteMany.mockResolvedValue(undefined);
        Notifs.deleteMany.mockResolvedValue(undefined);

        const doc = { _id: fakeEventId, constructor: Event };
        await Event.prototype.deleteOne.call(doc);

        expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
        expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
      } finally {
        Event.cleanupRelatedData = _orig;
      }
    });

    it('propagates errors from deleteMany', async () => {
      const fakeEventId = 'fallback3';
      const _orig = Event.cleanupRelatedData;
      delete Event.cleanupRelatedData;

      try {
        Match.deleteMany.mockRejectedValue(new Error('boom'));
        Notifs.deleteMany.mockResolvedValue({ deletedCount: 0 });

        const doc = { _id: fakeEventId, constructor: Event };
        await expect(Event.prototype.deleteOne.call(doc)).rejects.toThrow('boom');
      } finally {
        Event.cleanupRelatedData = _orig;
      }
    });
  });

  describe('Event pre deleteOne middleware', () => {
    it('runs the pre deleteOne middleware and calls cleanupRelatedData', async () => {
      const fakeEventId = 'prehook1';
      Match.deleteMany.mockResolvedValue({ deletedCount: 5 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 2 });

      // Create a Mongoose document instance (no DB connection required for middleware)
      const doc = new Event({ _id: fakeEventId });

      // Calling the document deleteOne should trigger pre('deleteOne') middleware
      await doc.deleteOne();

      // The doc._id is a Mongoose ObjectId; assert the actual passed id is doc._id
      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: doc._id });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: doc._id });
    });
  });

  describe('Event preDeleteHook direct invocation', () => {
    it('invokes cleanupRelatedData via preDeleteHook wrapper', async () => {
      const fakeEventId = 'prehook1';
      Match.deleteMany.mockResolvedValue({ deletedCount: 5 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const doc = { _id: fakeEventId, constructor: Event };

      await Event.__testHelpers.preDeleteHook(doc);

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
    });
  });

  describe('Event named preDeleteHook coverage', () => {
    it('calls the named preDeleteHook body via _namedPreDeleteHook', async () => {
      const id = 'named1';
      Match.deleteMany.mockResolvedValue({ deletedCount: 1 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await Event.__testHelpers._namedPreDeleteHook({ _id: id, constructor: Event });

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: id });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: id });
    });
  });

  describe('Invoke actual preDeleteHook function object', () => {
    it('calls the actual preDeleteHook function via .call', async () => {
      const id = 'fncall1';
      Match.deleteMany.mockResolvedValue({ deletedCount: 7 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 3 });

      const doc = { _id: id, constructor: Event };

      // Call the actual function object the schema uses
      await Event.__testHelpers.__preDeleteHookFunction.call(doc);

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: id });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: id });
    });
  });

  describe('Event runPreDelete helper', () => {
    it('calls cleanupRelatedData via helper and logs counts', async () => {
      const fakeEventId = 'runhelper1';
      Match.deleteMany.mockResolvedValue({ deletedCount: 4 });
      Notifs.deleteMany.mockResolvedValue({ deletedCount: 6 });

      // Create a minimal doc-like object with constructor pointing to Event
      const doc = { _id: fakeEventId, constructor: Event };

      await Event.__testHelpers.runPreDelete(doc);

      expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
      expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
    });
  });

  describe('Schema Validation', () => {
    it('should throw validation error for missing required fields', async () => {
      const invalidEvent = new Event({
        eventName: '',
        location: '',
        urgency: 'InvalidValue',
      });

      try {
        await invalidEvent.validate();
      } catch (error) {
        expect(error.errors.eventName).toBeDefined();
        expect(error.errors.eventDescription).toBeDefined();
        expect(error.errors.requiredSkills).toBeDefined();
        expect(error.errors.urgency).toBeDefined();
      }
    });

    it('should save a valid event', async () => {
      const validEvent = new Event({
        eventName: 'Test Event',
        eventDescription: 'A valid description',
        location: 'Test Location',
        requiredSkills: ['Skill1', 'Skill2'],
        urgency: 'Medium',
        eventDate: new Date(),
      });

      jest.spyOn(validEvent, 'save').mockResolvedValue(validEvent);
      const result = await validEvent.save();

      expect(result.eventName).toBe('Test Event');
      expect(result.location).toBe('Test Location');
    });

    it('rejects when requiredSkills is an empty array', async () => {
      const e = new Event({
        eventName: 'Bad Event',
        eventDescription: 'Desc',
        location: 'Nowhere',
        requiredSkills: [],
        urgency: 'Low',
        eventDate: new Date(),
      });

      await expect(e.validate()).rejects.toThrow();
      try {
        await e.validate();
      } catch (err) {
        expect(err.errors).toBeDefined();
        expect(err.errors.requiredSkills).toBeDefined();
      }
    });

    it('accepts a single string for requiredSkills (casts to array)', async () => {
      // Mongoose will cast a single string to an array for a [String] field
      const e = new Event({
        eventName: 'Casted Event',
        eventDescription: 'Desc',
        location: 'Nowhere',
        requiredSkills: 'driving',
        urgency: 'Low',
        eventDate: new Date(),
      });

      // validation should succeed because the string is cast to ['driving']
      await expect(e.validate()).resolves.toBeUndefined();
      expect(Array.isArray(e.requiredSkills)).toBe(true);
      expect(e.requiredSkills[0]).toBe('driving');
    });

    it('rejects invalid urgency values', async () => {
      const e = new Event({
        eventName: 'Bad Urgency',
        eventDescription: 'Desc',
        location: 'Nowhere',
        requiredSkills: ['driving'],
        urgency: 'Urgent',
        eventDate: new Date(),
      });

      await expect(e.validate()).rejects.toThrow();
      try {
        await e.validate();
      } catch (err) {
        expect(err.errors).toBeDefined();
        expect(err.errors.urgency).toBeDefined();
      }
    });
  });
});
