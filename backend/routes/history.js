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
	const futureEvents = events.filter(e => e.eventDate && e.eventDate >= currentDate);
	const pastEvents = events.filter(e => e.eventDate && e.eventDate < currentDate);

	futureEvents.sort((a, b) => (a.eventDate).localeCompare(b.eventDate));
	pastEvents.sort((a, b) => (b.eventDate).localeCompare(a.eventDate));

	res.status(200).json({ futureEvents, pastEvents });
});

module.exports = router;

