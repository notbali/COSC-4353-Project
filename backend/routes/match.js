const express = require('express');
const router = express.Router();
const EventDetails = require('../models/Event');
const { UserProfile } = require('../models/User');
const VolunteerHistory = require('../models/VolunteerHistory');

// Get matching events for a volunteer 
router.get('/match/:volunteerId', async (req, res) => {
    try {
        const { volunteerId } = req.params;

        // Get user profile instead of volunteer record
        const userProfile = await UserProfile.findOne({ userId: volunteerId });
        if (!userProfile) return res.status(404).json({ message: 'User profile not found' });

        const events = await EventDetails.find({ status: 'Open' });
     
        const matching = events.filter((ev) => {
            if (!ev.requiredSkills || ev.requiredSkills.length === 0) return false;
            
            // Check skill match
            const skillMatch = userProfile.skills && userProfile.skills.some(skill => 
                ev.requiredSkills.includes(skill)
            );
            if (!skillMatch) return false;
            
            // Check availability
            if (userProfile.availability.length === 0) return true;
            const currentDate = new Date().toISOString().split('T')[0];
            if (ev.eventDateISO < currentDate) return false;
            return userProfile.availability.includes(ev.eventDateISO);
        });

        // Check volunteer history for each matching event
        const eventsWithMatchStatus = await Promise.all(
            matching.map(async (event) => {
                const historyRecord = await VolunteerHistory.findOne({
                    userId: volunteerId,
                    eventId: event._id
                });
                
                return {
                    ...event.toObject(),
                    matchedVolunteer: historyRecord ? volunteerId : null,
                    matchedVolunteerName: historyRecord ? historyRecord.volunteerName : null,
                    matchedAt: historyRecord ? historyRecord.createdAt : null
                };
            })
        );

        return res.status(200).json(eventsWithMatchStatus);
    } catch (error) {
        res.status(500).json({ message: 'Error finding matching events', error });
    }
});

// Match Volunteer to Event
router.post('/match', async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;
    if (!volunteerId || !eventId) return res.status(400).json({ message: 'volunteerId and eventId required' });

    const userProfile = await UserProfile.findOne({ userId: volunteerId });
    if (!userProfile) return res.status(404).json({ message: 'User profile not found' });

    const event = await EventDetails.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'Open') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    if (event.currentVolunteers >= event.maxVolunteers) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const existingHistory = await VolunteerHistory.findOne({
      userId: volunteerId,
      eventId: eventId
    });
    if (existingHistory) {
      return res.status(400).json({ message: 'Volunteer already matched to this event' });
    }

    event.currentVolunteers = (event.currentVolunteers || 0) + 1;
    await event.save();

    const match = { volunteerId, eventId, createdAt: new Date() };

    return res.status(201).json({ match, event });
  } catch (error) {
    res.status(500).json({ message: 'Error creating match', error });
  }
});

module.exports = router;
