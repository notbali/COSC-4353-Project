const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const Event = require('../models/Event');

// Get matching events for a volunteer 
router.get('/match/:volunteerId', async (req, res) => {
    const { volunteerId } = req.params;

    const idNum = Number(volunteerId);
    const volunteer = Volunteer._inMemory.find((v) => v.id === idNum) || Volunteer._inMemory.find((v) => String(v._id) === String(volunteerId));

    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });

    const events = Event._inMemory;
 
  const matching = events.filter((ev) => {
    if (!ev.requiredSkills) return false;
    const skillMatch = volunteer.skills && volunteer.skills.includes(ev.requiredSkills);
        if (!skillMatch) return false;
        if (volunteer.availability.length === 0) return true;
        currentDate = new Date().toISOString().split('T')[0];
        if (ev.eventDateISO < currentDate) return false;
        return volunteer.availability.includes(ev.eventDateISO);
  });

  return res.status(200).json(matching);
});

// Match Volunteer to Event
const matches = [];
router.post('/match', (req, res) => {
  const { volunteerId, eventId } = req.body;
  if (!volunteerId || !eventId) return res.status(400).json({ message: 'volunteerId and eventId required' });

  const idNum = Number(volunteerId);
  const volunteer = Volunteer._inMemory && (Volunteer._inMemory.find((v) => v.id === idNum) || Volunteer._inMemory.find((v) => String(v._id) === String(volunteerId)));
  if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });

  const idEvent = Number(eventId);
  const event = Event._inMemory && Event._inMemory.find((e) => Number(e.id) === idEvent);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  // set matched info on the in-memory event
  event.matchedVolunteer = volunteer.id || volunteer;
  event.matchedVolunteerName = volunteer.name || null;
  event.matchedAt = new Date().toISOString();

  const match = { id: matches.length + 1, volunteerId, eventId, createdAt: new Date() };
  matches.push(match);

  return res.status(201).json({ match, event });
});

module.exports = router;
