const mongoose = require("mongoose");
//const Match = require("./Match");
const Notifs = require("./Notifs");

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    eventDescription: { type: String, required: true },
    location: { type: String, required: true },
    requiredSkills: [{ type: String, required: true }],
    urgency: { type: String, required: true },
    eventDate: { type: Date, required: false },
    eventDateISO: String,
  },
  {
    timestamps: true,
  }
);

// Middleware to delete related data when an event is deleted
eventSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const eventId = this._id;
      /*
      // Delete all matches associated with this event
      const deletedMatches = await Match.deleteMany({ eventId });
      console.log(
        `Deleted ${deletedMatches.deletedCount} matches for event ${eventId}`
      );
      */
      // Delete all notifications associated with this event
      const deletedNotifs = await Notifs.deleteMany({ event: eventId });
      console.log(
        `Deleted ${deletedNotifs.deletedCount} notifications for event ${eventId}`
      );

      next();
    } catch (error) {
      console.error("Error in event delete middleware:", error);
      next(error);
    }
  }
);

module.exports = mongoose.model("Event", eventSchema);

module.exports._inMemory = [
  {
    id: 1,
    eventName: 'Grocery Delivery',
    eventDescription: 'Deliver groceries to elderly',
    location: 'Metropolis',
    requiredSkills: 'Transportation',
    urgency: 'Medium',
    eventDateISO: '2025-12-24'
  },
  {
    id: 2,
    eventName: 'Babysitting',
    eventDescription: 'Watching baby',
    location: 'Metropolis',
    requiredSkills: 'Child Care',
    urgency: 'Medium',
    eventDateISO: '2025-12-25'
  },
  {
    id: 3,
    eventName: 'Cooking',
    eventDescription: 'Cook meals for homeless',
    location: 'Metropolis',
    requiredSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDateISO: '2025-12-26'
  },
    {
    id: 4,
    eventName: 'Cooking2',
    eventDescription: 'Cook meals for more homeless',
    location: 'Metropolis',
    requiredSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDateISO: '2025-12-27'
  },
  {
    id: 5,
    eventName: 'Grocery Delivery',
    eventDescription: 'Deliver groceries to elderly',
    location: 'Metropolis',
    requiredSkills: 'Transportation',
    urgency: 'Medium',
    eventDateISO: '2025-08-24'
  },
  {
    id: 6,
    eventName: 'Babysitting',
    eventDescription: 'Watching baby',
    location: 'Metropolis',
    requiredSkills: 'Child Care',
    urgency: 'Medium',
    eventDateISO: '2025-08-25'
  },
  {
    id: 7,
    eventName: 'Cooking',
    eventDescription: 'Cook meals for homeless',
    location: 'Metropolis',
    requiredSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDateISO: '2025-08-26',
    matchedVolunteer: { id: 1, name: 'John Doe' },
    matchedVolunteerName: 'John Doe',
  },
  {
    id: 8,
    eventName: 'Grocery Delivery',
    eventDescription: 'Deliver groceries to elderly',
    location: 'Metropolis',
    requiredSkills: 'Transportation',
    urgency: 'Medium',
    eventDateISO: '2025-05-24',
    matchedVolunteer: { id: 2, name: 'Jane Doe' },
    matchedVolunteerName: 'Jane Doe',
  },
  {
    id: 9,
    eventName: 'Babysitting',
    eventDescription: 'Watching baby',
    location: 'Metropolis',
    requiredSkills: 'Child Care',
    urgency: 'Medium',
    eventDateISO: '2025-05-25'
  },
  {
    id: 10,
    eventName: 'Cooking',
    eventDescription: 'Cook meals for homeless',
    location: 'Metropolis',
    requiredSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDateISO: '2025-05-26',
    matchedVolunteer: { id: 1, name: 'John Doe' },
    matchedVolunteerName: 'John Doe',
  },
];


//module.exports = Event;
