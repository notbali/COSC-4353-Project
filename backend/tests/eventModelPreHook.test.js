const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event pre deleteOne middleware', () => {
  beforeEach(() => jest.clearAllMocks());

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
