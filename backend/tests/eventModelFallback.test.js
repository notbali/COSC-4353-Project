const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event instance fallback deleteOne', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses fallback path when static helper missing and deleteMany returns counts', async () => {
    const fakeEventId = 'fallback1';
    // Ensure the static helper is not present so the instance fallback runs
    delete Event.cleanupRelatedData;

    Match.deleteMany.mockResolvedValue({ deletedCount: 2 });
    Notifs.deleteMany.mockResolvedValue({ deletedCount: 1 });

    // call the instance method directly with a minimal "document"
    const doc = { _id: fakeEventId, constructor: Event };
    await Event.prototype.deleteOne.call(doc);

    expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
    expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
  });

  it('handles undefined deleteMany results and does not throw', async () => {
    const fakeEventId = 'fallback2';
    delete Event.cleanupRelatedData;

    // Simulate deleteMany returning undefined (no deletedCount)
    Match.deleteMany.mockResolvedValue(undefined);
    Notifs.deleteMany.mockResolvedValue(undefined);

    const doc = { _id: fakeEventId, constructor: Event };
    await Event.prototype.deleteOne.call(doc);

    expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: fakeEventId });
    expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: fakeEventId });
  });

  it('propagates errors from deleteMany', async () => {
    const fakeEventId = 'fallback3';
    delete Event.cleanupRelatedData;

    Match.deleteMany.mockRejectedValue(new Error('boom'));
    Notifs.deleteMany.mockResolvedValue({ deletedCount: 0 });

    const doc = { _id: fakeEventId, constructor: Event };
    await expect(Event.prototype.deleteOne.call(doc)).rejects.toThrow('boom');
  });
});
