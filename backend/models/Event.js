const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventDesc: String,
  location: String,
  reqSkills: String,
  urgency: String,
  eventDate: String,
});

module.exports = mongoose.model('Event', eventSchema);

module.exports._inMemory = [
  {
    id: 1,
    eventName: 'Grocery Delivery',
    eventDesc: 'Deliver groceries to elderly',
    location: 'Metropolis',
    reqSkills: 'Transportation',
    urgency: 'Medium',
    eventDate: '2025-12-24'
  },
  {
    id: 2,
    eventName: 'Babysitting',
    eventDesc: 'Watching baby',
    location: 'Metropolis',
    reqSkills: 'Child Care',
    urgency: 'Medium',
    eventDate: '2025-12-25'
  },
  {
    id: 3,
    eventName: 'Cooking',
    eventDesc: 'Cook meals for homeless',
    location: 'Metropolis',
    reqSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDate: '2025-12-26'
  },
    {
    id: 4,
    eventName: 'Cooking2',
    eventDesc: 'Cook meals for more homeless',
    location: 'Metropolis',
    reqSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDate: '2025-12-27'
  },
  {
    id: 5,
    eventName: 'Grocery Delivery',
    eventDesc: 'Deliver groceries to elderly',
    location: 'Metropolis',
    reqSkills: 'Transportation',
    urgency: 'Medium',
    eventDate: '2025-08-24'
  },
  {
    id: 6,
    eventName: 'Babysitting',
    eventDesc: 'Watching baby',
    location: 'Metropolis',
    reqSkills: 'Child Care',
    urgency: 'Medium',
    eventDate: '2025-08-25'
  },
  {
    id: 7,
    eventName: 'Cooking',
    eventDesc: 'Cook meals for homeless',
    location: 'Metropolis',
    reqSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDate: '2025-08-26',
    matchedVolunteer: { id: 1, name: 'John Doe' },
    matchedVolunteerName: 'John Doe',
  },
  {
    id: 8,
    eventName: 'Grocery Delivery',
    eventDesc: 'Deliver groceries to elderly',
    location: 'Metropolis',
    reqSkills: 'Transportation',
    urgency: 'Medium',
    eventDate: '2025-05-24',
    matchedVolunteer: { id: 2, name: 'Jane Doe' },
    matchedVolunteerName: 'Jane Doe',
  },
  {
    id: 9,
    eventName: 'Babysitting',
    eventDesc: 'Watching baby',
    location: 'Metropolis',
    reqSkills: 'Child Care',
    urgency: 'Medium',
    eventDate: '2025-05-25'
  },
  {
    id: 10,
    eventName: 'Cooking',
    eventDesc: 'Cook meals for homeless',
    location: 'Metropolis',
    reqSkills: 'Food Preparation & Serving',
    urgency: 'Urgent',
    eventDate: '2025-05-26',
    matchedVolunteer: { id: 1, name: 'John Doe' },
    matchedVolunteerName: 'John Doe',
  },
];
