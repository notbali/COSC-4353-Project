const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event runPreDelete helper', () => {
  beforeEach(() => jest.clearAllMocks());

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
