const mongoose = require('mongoose');

// Minimal Match model so tests and code can require it without error.
// Keep schema minimal because tests mock behavior where needed.
const matchSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('Match', matchSchema);
