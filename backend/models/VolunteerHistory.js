const mongoose = require('mongoose');

// VolunteerHistory Schema - tracks volunteer participation in events
const volunteerHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCredentials',
    required: [true, 'User ID is required']
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventDetails',
    required: [true, 'Event ID is required']
  },
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  volunteerName: {
    type: String,
    required: [true, 'Volunteer name is required'],
    trim: true,
    maxlength: [100, 'Volunteer name cannot exceed 100 characters']
  },
  participationDate: {
    type: Date,
    required: [true, 'Participation date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['Registered', 'Attended', 'No-Show', 'Cancelled'],
      message: 'Status must be one of: Registered, Attended, No-Show, Cancelled'
    },
    default: 'Registered'
  },
  hoursVolunteered: {
    type: Number,
    min: [0, 'Hours volunteered cannot be negative'],
    default: 0
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters'],
    default: ''
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: null
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate registrations
volunteerHistorySchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Create the model
const VolunteerHistory = mongoose.model('VolunteerHistory', volunteerHistorySchema);

module.exports = VolunteerHistory;
