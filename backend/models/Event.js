const mongoose = require("mongoose");
const Notifs = require("./Notifs");

// EventDetails Schema - stores event information
const eventDetailsSchema = new mongoose.Schema(
  {
    eventName: { 
      type: String, 
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters long'],
      maxlength: [100, 'Event name cannot exceed 100 characters']
    },
    eventDescription: { 
      type: String, 
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Event description must be at least 10 characters long'],
      maxlength: [1000, 'Event description cannot exceed 1000 characters']
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    requiredSkills: { 
      type: [String], 
      required: [true, 'At least one skill is required'],
      validate: {
        validator: function(skills) {
          return skills.length > 0 && skills.every(skill => skill.trim().length > 0);
        },
        message: 'At least one skill is required and skills cannot be empty'
      }
    },
    urgency: { 
      type: String, 
      required: [true, 'Urgency level is required'],
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: 'Urgency must be one of: Low, Medium, High, Urgent'
      }
    },
    eventDate: { 
      type: Date, 
      required: [true, 'Event date is required'],
      validate: {
        validator: function(date) {
          // New events must be in the future
          if (this.isNew) {
            return date > new Date();
          }
          return true;
        },
        message: 'Event date must be in the future for new events'
      }
    },
    eventDateISO: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format']
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Cancelled'],
      default: 'Open'
    },
    maxVolunteers: {
      type: Number,
      min: [1, 'Maximum volunteers must be at least 1'],
      default: 10
    },
    currentVolunteers: {
      type: Number,
      default: 0,
      min: [0, 'Current volunteers cannot be negative']
    }
  },
  {
    timestamps: true,
  }
);

// Middleware to delete related data when an event is deleted
eventDetailsSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
        const eventId = this._id;

        // Delete all volunteer history records for this event
        const VolunteerHistory = require('./VolunteerHistory');
        const deletedHistory = await VolunteerHistory.deleteMany({ eventId });
        console.log(
          `Deleted ${deletedHistory.deletedCount} volunteer history records for event ${eventId}`
        );

      next();
    } catch (error) {
      console.error("Error in event delete middleware:", error);
      next(error);
    }
  }
);

// Create the model
const EventDetails = mongoose.model("EventDetails", eventDetailsSchema);

module.exports = EventDetails;
