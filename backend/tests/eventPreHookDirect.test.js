const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event preDeleteHook direct invocation', () => {
  beforeEach(() => jest.clearAllMocks());

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
