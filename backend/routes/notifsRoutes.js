const express = require("express");
const router = express.Router();
const Notifs = require("../models/Notifs");
const Event = require("../models/Event");

// POST /create route
// POST /create route
// Allow creating either user-specific notifications (pass userId) or global notifications (omit userId)
router.post("/create", async (req, res) => {
  try {
    const { eventId, notifType, userId } = req.body;

    // Validate required fields for event-based notifications
    if (!eventId || !notifType) {
      return res.status(400).json({
        message: "Event ID and notification type are required.",
      });
    }

    // Validate notification type
    const validTypes = ["new event", "event update", "reminder"];
    if (!validTypes.includes(notifType)) {
      return res.status(400).json({
        message: "Invalid notification type.",
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found.",
      });
    }

    // Create notification based on type
    let title;
    switch (notifType) {
      case "new event":
        title = "A New Event Has Been Posted!";
        break;
      case "event update":
        title = "An Event Has Been Updated!";
        break;
      case "reminder":
        title = "Event Reminder";
        break;
      default:
        title = "Notification";
    }

    const createPayload = {
      event: eventId,
      title: title,
      message: `${title} - ${event.eventName}`,
      createdAt: new Date(),
    };

    // Attach user if provided (user-specific notification)
    if (userId) createPayload.user = userId;

    const notification = await Notifs.create(createPayload);

    res.status(201).json({
      message: "Notification created successfully.",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      message: "An error occurred while creating the notification.",
    });
  }
});

// POST /delete route
router.post("/delete", async (req, res) => {
  try {
    const { eventName, eventDescription, eventLocation, eventDate } = req.body;

    // Add validation that your tests expect
    if (!eventName) {
      return res.status(400).json({
        message: "Event name is required.",
      });
    }

    const notification = await Notifs.create({
      title: "An Event Has Been Canceled",
      message: `The event "${eventName}" has been canceled.`,
      eventDetails: {
        name: eventName,
        description: eventDescription || null,
        location: eventLocation || null,
        date: eventDate || null,
      },
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Notification created successfully.",
      notification,
    });
  } catch (error) {
    console.error("Error creating cancellation notification:", error);
    res.status(500).json({
      message: "An error occurred while creating the notification.",
    });
  }
});

// POST /matched route
router.post("/matched", async (req, res) => {
  try {
    const { eventId, userIds } = req.body;

    // Add validation that your tests expect
    if (!eventId || !userIds) {
      return res.status(400).json({
        message: "Event ID and user IDs are required.",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "User IDs are required.",
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found.",
      });
    }

    // Create notifications for all matched users
    const notifications = [];
    for (const userId of userIds) {
      const notification = await Notifs.create({
        event: eventId,
        user: userId,
        title: "You Have Been Matched To An Event!",
        message: `You have been matched to the event: ${event.eventName}`,
        createdAt: new Date(),
      });
      notifications.push(notification);
    }

    res.status(201).json({
      message: "Notifications created successfully for matched users.",
      notifications,
    });
  } catch (error) {
    console.error("Error creating matched notifications:", error);
    res.status(500).json({
      message: "An error occurred while creating the notifications.",
    });
  }
});

// GET /all route
router.get("/all", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("Fetching notifications for userId:", userId);
    // If userId provided, return notifications targeted to that user OR global notifications
    let query = {};
    if (userId) {
      // return notifications targeted to that user OR global notifications,
      // and exclude notifications the user has dismissed (dismissedBy contains userId)
      query = {
        $and: [
          { $or: [{ user: userId }, { user: { $exists: false } }, { user: null }] },
          { $or: [ { dismissedBy: { $exists: false } }, { dismissedBy: { $ne: userId } } ] }
        ]
      };
    }

    const notifications = await Notifs.find(query)
      .populate("event", "eventName eventDate location eventDescription")
      .sort({ createdAt: -1 });
    console.log("Database returned:", notifications);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      message: "An error occurred while fetching notifications.",
    });
  }
});

module.exports = router;

// POST /dismiss route - mark a notification dismissed for a user
router.post('/dismiss', async (req, res) => {
  try {
    const { notifId, userId } = req.body;
    if (!notifId || !userId) {
      return res.status(400).json({ message: 'notifId and userId are required' });
    }

    await Notifs.findByIdAndUpdate(notifId, { $addToSet: { dismissedBy: userId } });
    res.status(200).json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ message: 'Error dismissing notification' });
  }
});
