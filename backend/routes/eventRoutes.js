const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// create a new event
router.post("/create", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res
      .status(201)
      .send({ message: "Event created successfully", data: event });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all events
router.get("/all", async (req, res) => {
  try {
    const events = await Event.find({});
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all events with basic volunteer info (without Match dependency)
router.get("/all-with-volunteer-count", async (req, res) => {
  try {
    const events = await Event.find({});

    // Return events with placeholder volunteer data since Match model is removed
    const eventData = events.map((event) => ({
      ...event.toObject(),
      volunteerCount: 0, // Default to 0 volunteers
      volunteers: [], // Empty volunteers array
    }));

    res.status(200).json(eventData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
});

// Get event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
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
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) {
      return res.status(404).send({ message: "Event not found" });
    }
    res.status(200).send({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).send({ message: "Error updating event", error });
  }
});

// Delete event by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send({ message: "Event not found" });
    }

    await event.deleteOne(); // Trigger the middleware
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
