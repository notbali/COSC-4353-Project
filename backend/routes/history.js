const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const Event = require('../models/Event');

// List Volunteers
router.get('/volunteers', async (req, res) => {
	res.status(200).json(Volunteer._inMemory);
});

// List Events
router.get('/events', async (req, res) => {
	const events = Event._inMemory;
	const currentDate = new Date().toISOString().split('T')[0];
	const futureEvents = events.filter(e => e.eventDateISO && e.eventDateISO >= currentDate);
	const pastEvents = events.filter(e => e.eventDateISO && e.eventDateISO < currentDate);

	futureEvents.sort((a, b) => (a.eventDateISO).localeCompare(b.eventDateISO));
	pastEvents.sort((a, b) => (b.eventDateISO).localeCompare(a.eventDateISO));

	res.status(200).json({ futureEvents, pastEvents });
});

module.exports = router;

