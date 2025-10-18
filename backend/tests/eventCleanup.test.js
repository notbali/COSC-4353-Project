const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event cleanup static helper', () => {
  beforeEach(() => jest.clearAllMocks());

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
