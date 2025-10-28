const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const EventDetails = require('../models/Event');
const VolunteerHistory = require('../models/VolunteerHistory');

// List Volunteers
router.get('/volunteers', async (req, res) => {
	try {
		const volunteers = await Volunteer.find({});
		res.status(200).json(volunteers);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching volunteers', error });
	}
});

// List Events
router.get('/events', async (req, res) => {
	try {
		const events = await EventDetails.find({});
		const currentDate = new Date().toISOString().split('T')[0];
		const futureEvents = events.filter(e => e.eventDateISO && e.eventDateISO >= currentDate);
		const pastEvents = events.filter(e => e.eventDateISO && e.eventDateISO < currentDate);

		futureEvents.sort((a, b) => (a.eventDateISO).localeCompare(b.eventDateISO));
		pastEvents.sort((a, b) => (b.eventDateISO).localeCompare(a.eventDateISO));

		res.status(200).json({ futureEvents, pastEvents });
	} catch (error) {
		res.status(500).json({ message: 'Error fetching events', error });
	}
});

// Get volunteer history for a specific user
router.get('/volunteer-history/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const history = await VolunteerHistory.find({ userId })
			.populate('eventId', 'eventName eventDescription location eventDate')
			.sort({ participationDate: -1 });
		
		res.status(200).json(history);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching volunteer history', error });
	}
});

// Add volunteer to event (create history record)
router.post('/volunteer-history', async (req, res) => {
	try {
		const { userId, eventId, volunteerName } = req.body;
		
		// Check if already registered
		const existingRecord = await VolunteerHistory.findOne({ userId, eventId });
		if (existingRecord) {
			return res.status(400).json({ message: 'Already registered for this event' });
		}
		
		// Get event details
		const event = await EventDetails.findById(eventId);
		if (!event) {
			return res.status(404).json({ message: 'Event not found' });
		}
		
		// Create history record
		const historyRecord = new VolunteerHistory({
			userId,
			eventId,
			eventName: event.eventName,
			volunteerName,
			status: 'Registered'
		});
		
		await historyRecord.save();
		
		// Update event volunteer count
		event.currentVolunteers = (event.currentVolunteers || 0) + 1;
		await event.save();
		
		res.status(201).json({ message: 'Successfully registered for event', historyRecord });
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ 
				message: 'Validation error', 
				errors: Object.values(error.errors).map(err => err.message) 
			});
		}
		res.status(500).json({ message: 'Error creating volunteer history', error });
	}
});

module.exports = router;

