const mongoose = require('mongoose');

// States Schema - stores state codes and names
const statesSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: [true, 'State code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    length: [2, 'State code must be exactly 2 characters']
  },
  stateName: {
    type: String,
    required: [true, 'State name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  region: {
    type: String,
    enum: {
      values: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Pacific'],
      message: 'Region must be one of: Northeast, Southeast, Midwest, Southwest, West, Pacific'
    },
    required: [true, 'Region is required']
  }
}, {
  timestamps: true
});

// Create the model
const States = mongoose.model('States', statesSchema);

module.exports = States;
