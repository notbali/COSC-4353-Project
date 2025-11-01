// tests/database.test.js
const mongoose = require('mongoose');
const connectDB = require('../config/database');

describe('connectDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect successfully and log connection host', async () => {
    const mockConnection = { connection: { host: 'localhost' } };

    jest.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb://localhost:27017/volunteer-app'),
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
    );
    expect(logSpy).toHaveBeenCalledWith('MongoDB Connected: localhost');
  });

  it('should log an error and exit if connection fails', async () => {
    const mockError = new Error('Connection failed');

    jest.spyOn(mongoose, 'connect').mockRejectedValue(mockError);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await connectDB();

    expect(errorSpy).toHaveBeenCalledWith('Database connection error:', mockError);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
