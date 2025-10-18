const Event = require('../models/Event');

describe('Event model validation', () => {
  it('accepts a valid event', async () => {
    const valid = new Event({
      eventName: 'Test Event',
      eventDescription: 'Desc',
      location: 'Somewhere',
      requiredSkills: ['driving'],
      urgency: 'Low',
      eventDate: new Date(),
    });

    await expect(valid.validate()).resolves.toBeUndefined();
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

  it('rejects when requiredSkills is not an array', async () => {
    // Mongoose casts a single string to an array for a [String] field
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
