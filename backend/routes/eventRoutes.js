const express = require("express");
const router = express.Router();
const EventDetails = require("../models/Event");
const VolunteerHistory = require("../models/VolunteerHistory");
const Notifs = require("../models/Notifs");

// create a new event
router.post("/create", async (req, res) => {
  try {
    const event = new EventDetails(req.body);
    await event.save();
    res
      .status(201)
      .send({ message: "Event created successfully", data: event });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(400).send(error);
  }
});

// Get all events
router.get("/all", async (req, res) => {
  try {
    const events = await EventDetails.find({});
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all events with basic volunteer info
router.get("/all-with-volunteer-count", async (req, res) => {
  try {
    const events = await EventDetails.find({});

    // Return events with volunteer count
    const eventData = events.map((event) => ({
      ...event.toObject(),
      volunteerCount: event.currentVolunteers || 0,
      volunteers: [], // Could be populated with actual volunteer data
    }));

    res.status(200).json(eventData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
});

// Get event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await EventDetails.findById(req.params.id);
    if (!event) {
      return res.status(404).send({ message: "Event not found" });
    }
    res.status(200).send(event);
  } catch (error) {
    res.status(500).send({ message: "Error fetching event", error });
  }
});

// Update event by ID
router.put("/update/:id", async (req, res) => {
  try {
    console.log('Update event called with id:', req.params.id, 'body:', req.body);
    const event = await EventDetails.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      console.warn('Event not found for update:', req.params.id);
      return res.status(404).send({ message: "Event not found" });
    }

    console.log('Event updated in DB:', event._id);

    // Notify assigned volunteers about the update
    try {
      const histories = await VolunteerHistory.find({ eventId: event._id });
      const userIds = histories.map(h => h.userId).filter(Boolean);
      console.log('Notifying users about event update:', userIds);
      for (const uid of userIds) {
        try {
          const notifPayload = {
            event: event._id,
            user: uid,
            title: 'Event updated',
            message: `The event "${event.eventName}" has been updated.`,
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
            createdAt: new Date(),
          };
          const created = await Notifs.create(notifPayload);
          console.log('Created update notification for user', uid, 'notifId:', created._id);
        } catch (nerr) {
          console.error('Failed to create update notification for user', uid, nerr);
        }
      }
    } catch (notifErr) {
      console.error('Failed to fetch histories for update notifications:', notifErr);
    }

    res.status(200).send({ message: "Event updated successfully", event });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).send({ message: "Error updating event", error });
  }
});

// Delete event by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const event = await EventDetails.findById(req.params.id);
    if (!event) {
      return res.status(404).send({ message: "Event not found" });
    }

    // Gather volunteers assigned to this event so we can notify them
    try {
      const histories = await VolunteerHistory.find({ eventId: event._id });
      console.log(`Found ${histories.length} volunteer histories for event ${event._id}`);
      const userIds = histories.map(h => h.userId).filter(Boolean);
      console.log('User IDs to notify for cancellation:', userIds);

      // Create a notification for each assigned volunteer and log result
      // Use a different message/title for per-user notifications so
      // registered users get a 'removed' notice instead of a duplicate
      // global cancellation message.
      for (const uid of userIds) {
        try {
          const notifPayload = {
            event: event._id,
            user: uid,
            title: 'You have been removed from an event',
            message: `You have been removed from the event: ${event.eventName}`,
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            location: event.location,
            eventDate: event.eventDate,
            createdAt: new Date(),
          };
          const created = await Notifs.create(notifPayload);
          console.log('Created per-user removal notification for user', uid, 'notifId:', created._id);
        } catch (nerr) {
          console.error('Failed to create removal notification for user', uid, nerr);
        }
      }

      // Also create a global cancellation notification so every user sees it
      try {
        const globalPayload = {
          event: event._id,
          title: 'Event canceled',
          message: `The event "${event.eventName}" has been canceled.`,
          eventName: event.eventName,
          eventDescription: event.eventDescription,
          location: event.location,
          eventDate: event.eventDate,
          createdAt: new Date(),
        };
        const globalNotif = await Notifs.create(globalPayload);
        console.log('Created global cancel notification notifId:', globalNotif._id);
      } catch (gerr) {
        console.error('Failed to create global cancel notification:', gerr);
      }
    } catch (histErr) {
      console.error('Failed to fetch volunteer histories for notifications:', histErr);
    }

    await event.deleteOne(); // Trigger the middleware (which may also delete histories)
    res
      .status(200)
      .send({ message: "Event and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res
      .status(500)
      .send({ message: "Error deleting event and associated data", error });
  }
});

module.exports = router;
