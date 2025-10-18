const Event = require('../models/Event');
const Match = require('../models/Match');
const Notifs = require('../models/Notifs');

jest.mock('../models/Match');
jest.mock('../models/Notifs');

describe('Invoke actual preDeleteHook function object', () => {
  beforeEach(() => jest.clearAllMocks());

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
