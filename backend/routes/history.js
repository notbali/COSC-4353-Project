const express = require("express");
const router = express.Router();
const User = require("../models/User");
const EventDetails = require("../models/Event");
const VolunteerHistory = require("../models/VolunteerHistory");
const Notifs = require("../models/Notifs");

// List Volunteers
router.get("/volunteers", async (req, res) => {
  try {
    const userProfiles = await User.UserProfile.find({}).populate(
      "userId",
      "username"
    );

    // Transform UserProfile data to match expected volunteer format
    const volunteers = userProfiles.map((profile) => ({
      id: profile.userId._id, // Use the UserCredentials _id as the volunteer ID
      name: profile.fullName,
      address1: profile.address1,
      address2: profile.address2 || "",
      city: profile.city,
      state: profile.state,
      zipCode: profile.zip,
      skills: profile.skills || [],
      availability: profile.availability || [],
      preferences: profile.preferences || [],
    }));

    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching volunteers", error });
  }
});

// Get volunteer history for a specific user
router.get("/volunteer-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await VolunteerHistory.find({ userId })
      .populate(
        "eventId",
        "eventName eventDescription location eventDate requiredSkills urgency"
      )
      .sort({ createdAt: -1 });

    console.log(
      `Found ${history.length} volunteer history records for user ${userId}`
    );
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching volunteer history:", error);
    res
      .status(500)
      .json({ message: "Error fetching volunteer history", error });
  }
});

// List Events with assigned volunteers
router.get("/events", async (req, res) => {
  try {
    const events = await EventDetails.find({});
    const currentDate = new Date().toISOString().split("T")[0];

    // Get volunteer assignments for each event
    const eventsWithVolunteers = await Promise.all(
      events.map(async (event) => {
        const volunteerHistories = await VolunteerHistory.find({
          eventId: event._id,
        });

        // Get full names for each volunteer
        const assignedVolunteers = await Promise.all(
          volunteerHistories.map(async (history) => {
            // Get the user profile to fetch full name
            const userProfile = await User.UserProfile.findOne({
              userId: history.userId,
            });

            return {
              volunteerId: history.userId,
              volunteerName: userProfile
                ? userProfile.fullName
                : history.volunteerName,
              status: history.status,
              assignedAt: history.createdAt,
            };
          })
        );

        return {
          ...event.toObject(),
          assignedVolunteers,
          assignedVolunteerNames:
            assignedVolunteers.map((v) => v.volunteerName).join(", ") ||
            "Unassigned",
        };
      })
    );

    const futureEvents = eventsWithVolunteers.filter(
      (e) => e.eventDateISO && e.eventDateISO >= currentDate
    );
    const pastEvents = eventsWithVolunteers.filter(
      (e) => e.eventDateISO && e.eventDateISO < currentDate
    );

    futureEvents.sort((a, b) => a.eventDateISO.localeCompare(b.eventDateISO));
    pastEvents.sort((a, b) => b.eventDateISO.localeCompare(a.eventDateISO));

    res.status(200).json({ futureEvents, pastEvents });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
});

// Add volunteer to event (create history record)
router.post("/volunteer-history", async (req, res) => {
  try {
    const { userId, eventId, volunteerName } = req.body;

    // Check if already registered
    const existingRecord = await VolunteerHistory.findOne({ userId, eventId });
    if (existingRecord) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    // Get event details
    const event = await EventDetails.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get user's full name from profile
    const userProfile = await User.UserProfile.findOne({ userId });
    const fullName = userProfile ? userProfile.fullName : volunteerName; // Fallback to provided name

    // Create history record
    const historyRecord = new VolunteerHistory({
      userId,
      eventId,
      eventName: event.eventName,
      volunteerName: fullName,
      status: "Registered",
    });

    await historyRecord.save();

    // Update event volunteer count
    event.currentVolunteers = (event.currentVolunteers || 0) + 1;
    await event.save();

    // Create notification for the user about registration (include event details so it persists)
    try {
      await Notifs.create({
        event: event._id,
        user: userId,
        title: "You have registered for an event",
        message: `You have been registered for the event: ${event.eventName}`,
        eventName: event.eventName,
        eventDescription: event.eventDescription,
        location: event.location,
        eventDate: event.eventDate,
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.error("Failed to create registration notification:", notifErr);
    }

    res
      .status(201)
      .json({ message: "Successfully registered for event", historyRecord });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res
      .status(500)
      .json({ message: "Error creating volunteer history", error });
  }
});

// Remove volunteer from event (delete history record)
router.delete("/volunteer-history/:userId/:eventId", async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    // Find and delete the volunteer history record
    const deletedRecord = await VolunteerHistory.findOneAndDelete({
      userId,
      eventId,
    });
    if (!deletedRecord) {
      return res
        .status(404)
        .json({ message: "Volunteer registration not found" });
    }

    // Update event volunteer count
    const event = await EventDetails.findById(eventId);
    if (event) {
      event.currentVolunteers = Math.max((event.currentVolunteers || 1) - 1, 0);
      await event.save();
    }

    // Notify the user that they've been unregistered
    try {
      await Notifs.create({
        event: eventId,
        user: userId,
        title: "You have been removed from an event",
        message: `You have been removed from the event: ${
          event ? event.eventName : eventId
        }`,
        eventName: event ? event.eventName : null,
        eventDescription: event ? event.eventDescription : null,
        location: event ? event.location : null,
        eventDate: event ? event.eventDate : null,
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.error("Failed to create deregistration notification:", notifErr);
    }

    res.status(200).json({ message: "Successfully unregistered from event" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing volunteer from event", error });
  }
});

module.exports = router;
