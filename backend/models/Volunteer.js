const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address1: String,
  address2: String,
  city: String,
  state: String,
  zipCode: String,
  skills: [String],
  availability: String,
  events: [Object]
});

module.exports = mongoose.model('Volunteer', volunteerSchema);

module.exports._inMemory = [
  {
    id: 1,
    name: 'John Doe',
    address1: '1530 Pembledon Drive',
    address2: 'n/a',
    city: 'Metropolis',
    state: 'DC',
    zipCode: '77777',
    skills: ['Child Care','Food Preparation & Serving'],
    availability: ['2025-12-25','2025-12-26']
  },
  {
    id: 2,
    name: 'Jane Doe',
    address1: '1530 Pembledon Drive',
    address2: 'n/a',
    city: 'Metropolis',
    state: 'DC',
    zipCode: '77777',
    skills: ['Transportation'],
    availability: ['2025-12-24']
  }
];
