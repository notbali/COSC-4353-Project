const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Event named preDeleteHook coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the named preDeleteHook body via _namedPreDeleteHook', async () => {
    const id = 'named1';
    Match.deleteMany.mockResolvedValue({ deletedCount: 1 });
    Notifs.deleteMany.mockResolvedValue({ deletedCount: 0 });

    await Event.__testHelpers._namedPreDeleteHook({ _id: id, constructor: Event });

    expect(Match.deleteMany).toHaveBeenCalledWith({ eventId: id });
    expect(Notifs.deleteMany).toHaveBeenCalledWith({ event: id });
  });
});
