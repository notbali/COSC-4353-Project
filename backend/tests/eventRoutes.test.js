jest.mock("supertest");
const request = require("supertest");
const express = require("express");
const eventRoutes = require("../routes/eventRoutes");

jest.mock("../models/VolunteerHistory", () => ({
  find: jest.fn(),
}));

jest.mock("../models/Notifs", () => ({
  create: jest.fn(),
}));

// Mock the Event model properly
jest.mock("../models/Event", () => {
  const mockEvent = function (data) {
    Object.assign(this, data);
    this._id = data._id || "mock-id";

    // Add toObject method for Mongoose document compatibility
    this.toObject = function () {
      const { toObject, save, deleteOne, ...rest } = this;
      return rest;
    };

    // Add deleteOne method
    this.deleteOne = jest.fn().mockResolvedValue(this);
  };

  // Add prototype methods
  mockEvent.prototype.save = jest.fn();
  mockEvent.prototype.toObject = function () {
    const { toObject, save, deleteOne, ...rest } = this;
    return rest;
  };
  mockEvent.prototype.deleteOne = jest.fn();

  // Add static methods
  mockEvent.find = jest.fn();
  mockEvent.findById = jest.fn();
  mockEvent.findByIdAndUpdate = jest.fn();
  mockEvent.findByIdAndDelete = jest.fn();

  return mockEvent;
});

const Event = require("../models/Event");
const VolunteerHistory = require("../models/VolunteerHistory");
const Notifs = require("../models/Notifs");

const app = express();
app.use(express.json());
app.use("/events", eventRoutes);

describe("Event Routes - Full Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /create tests
  it("should create a new event", async () => {
    const mockEventData = {
      eventName: "Test Event",
      location: "Test Location",
      _id: "mock-event-id",
    };

    // Mock the save method to return the event data
    Event.prototype.save = jest.fn().mockResolvedValue(mockEventData);

    const response = await request(app)
      .post("/events/create")
      .send(mockEventData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Event created successfully");
    expect(response.body.data).toMatchObject(mockEventData);
  });

  it("should return 400 if event creation fails with validation error", async () => {
    const validationError = {
      name: "ValidationError",
      errors: {
        eventName: { message: "Event name is required" },
      },
    };

    Event.prototype.save = jest.fn().mockRejectedValue(validationError);

    const response = await request(app).post("/events/create").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(response.body.errors).toBeDefined();
  });

  it("should return 400 if event creation fails with other error", async () => {
    Event.prototype.save = jest
      .fn()
      .mockRejectedValue(new Error("Creation error"));

    const response = await request(app).post("/events/create").send({});

    expect(response.status).toBe(400);
  });

  // GET /all tests
  it("should retrieve all events", async () => {
    const mockEvents = [
      { eventName: "Event 1", location: "Location 1" },
      { eventName: "Event 2", location: "Location 2" },
    ];
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockEvents);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return 500 if fetching events fails", async () => {
    Event.find.mockRejectedValue(new Error("Database error"));

    const response = await request(app).get("/events/all");

    expect(response.status).toBe(500);
  });

  it("should return empty array when no events exist", async () => {
    Event.find.mockResolvedValue([]);

    const response = await request(app).get("/events/all");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // GET /all-with-volunteer-count tests
  it("should retrieve events with volunteer counts", async () => {
    const mockEvents = [
      {
        _id: "1",
        eventName: "Event 1",
        location: "Location 1",
        currentVolunteers: 5,
        toObject: function () {
          const { toObject, ...rest } = this;
          return rest;
        },
      },
      {
        _id: "2",
        eventName: "Event 2",
        location: "Location 2",
        currentVolunteers: 3,
        toObject: function () {
          const { toObject, ...rest } = this;
          return rest;
        },
      },
    ];
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(mockEvents.length);
    expect(response.body[0].volunteerCount).toBe(5);
    expect(response.body[1].volunteerCount).toBe(3);
  });

  it("should return 500 if fetching events with volunteer count fails", async () => {
    Event.find.mockRejectedValue(new Error("Database error"));

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error fetching events");
  });

  it("should handle events with no volunteers", async () => {
    const mockEvents = [
      {
        _id: "1",
        eventName: "Event 1",
        location: "Location 1",
        toObject: function () {
          const { toObject, ...rest } = this;
          return rest;
        },
      },
    ];
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].volunteerCount).toBe(0);
  });

  // GET /:id tests
  it("should retrieve an event by ID", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event 1",
      location: "Location 1",
    };
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app).get("/events/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockEvent);
  });

  it("should return 404 if event is not found by ID", async () => {
    Event.findById.mockResolvedValue(null);

    const response = await request(app).get("/events/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found");
  });

  it("should return 500 if fetching event by ID fails", async () => {
    Event.findById.mockRejectedValue(new Error("Error fetching event"));

    const response = await request(app).get("/events/1");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error fetching event");
  });

  it("should handle invalid event ID format", async () => {
    Event.findById.mockRejectedValue(new Error("Invalid ObjectId"));

    const response = await request(app).get("/events/invalid-id");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error fetching event");
  });

  // PUT /update/:id tests
  it("should update an event by ID", async () => {
    const updatedEvent = {
      _id: "1",
      eventName: "Updated Event",
      location: "Updated Location",
    };
    Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);

    const response = await request(app)
      .put("/events/update/1")
      .send(updatedEvent);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Event updated successfully");
    expect(response.body.event).toEqual(updatedEvent);
  });

  it("should return 404 if event is not found for update", async () => {
    Event.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app).put("/events/update/999").send({
      eventName: "Updated Event",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found");
  });

  it("should return 500 if updating event fails", async () => {
    Event.findByIdAndUpdate.mockRejectedValue(
      new Error("Error updating event")
    );

    const response = await request(app).put("/events/update/1").send({
      eventName: "Updated Event",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error updating event");
  });

  it("notifies volunteers on update", async () => {
    const updatedEvent = {
      _id: "1",
      eventName: "Updated Event",
      eventDescription: "Desc",
      location: "Loc",
      eventDate: "2025-01-01",
    };
    Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);
    VolunteerHistory.find.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);
    Notifs.create.mockResolvedValue({ _id: "notif" });

    const response = await request(app)
      .put("/events/update/1")
      .send(updatedEvent);

    expect(response.status).toBe(200);
    expect(Notifs.create).toHaveBeenCalledTimes(2);
    expect(Notifs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "u1",
        title: expect.stringContaining("updated"),
      })
    );
  });

  it("handles history fetch errors during update notifications", async () => {
    const updatedEvent = { _id: "1", eventName: "Updated Event" };
    Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);
    VolunteerHistory.find.mockRejectedValue(new Error("history error"));

    const response = await request(app)
      .put("/events/update/1")
      .send(updatedEvent);

    expect(response.status).toBe(200);
    expect(Notifs.create).not.toHaveBeenCalled();
  });

  it("should return 400 if updating event fails with validation error", async () => {
    const validationError = {
      name: "ValidationError",
      errors: {
        eventName: { message: "Event name is required" },
      },
    };

    Event.findByIdAndUpdate.mockRejectedValue(validationError);

    const response = await request(app).put("/events/update/1").send({
      eventName: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(response.body.errors).toBeDefined();
  });

  it("should handle partial event updates", async () => {
    const partialUpdate = { eventName: "Partially Updated Event" };
    const updatedEvent = {
      _id: "1",
      eventName: "Partially Updated Event",
      location: "Original Location",
    };
    Event.findByIdAndUpdate.mockResolvedValue(updatedEvent);

    const response = await request(app)
      .put("/events/update/1")
      .send(partialUpdate);

    expect(response.status).toBe(200);
    expect(response.body.event.eventName).toBe("Partially Updated Event");
  });

  // DELETE /delete/:id tests
  it("should delete an event by ID", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event to Delete",
      deleteOne: jest.fn().mockResolvedValue(),
    };
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Event and associated data deleted successfully"
    );
    expect(mockEvent.deleteOne).toHaveBeenCalled();
  });

  it("should return 404 if event is not found for deletion", async () => {
    Event.findById.mockResolvedValue(null);

    const response = await request(app).delete("/events/delete/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found");
  });

  it("should return 500 if deleting event fails", async () => {
    Event.findById.mockRejectedValue(new Error("Error deleting event"));

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "Error deleting event and associated data"
    );
  });

  it("creates notifications for volunteers and global on delete", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event with Data",
      eventDescription: "Desc",
      location: "Loc",
      eventDate: "2025-01-01",
      deleteOne: jest.fn().mockResolvedValue(),
    };
    Event.findById.mockResolvedValue(mockEvent);
    VolunteerHistory.find.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);
    Notifs.create.mockResolvedValue({ _id: "notif" });

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(200);
    // two per-user + one global
    expect(Notifs.create).toHaveBeenCalledTimes(3);
    expect(mockEvent.deleteOne).toHaveBeenCalled();
  });

  it("handles history fetch errors on delete but still deletes event", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event to delete",
      deleteOne: jest.fn().mockResolvedValue(),
    };
    Event.findById.mockResolvedValue(mockEvent);
    VolunteerHistory.find.mockRejectedValue(new Error("history error"));

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(200);
    expect(mockEvent.deleteOne).toHaveBeenCalled();
    expect(Notifs.create).not.toHaveBeenCalled();
  });

  it("should handle deletion of event with associated data", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event with Data",
      deleteOne: jest.fn().mockResolvedValue(),
    };
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Event and associated data deleted successfully"
    );
    expect(mockEvent.deleteOne).toHaveBeenCalled();
  });

  it("should return 500 if deleteOne method fails", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Event with Data",
      deleteOne: jest
        .fn()
        .mockRejectedValue(new Error("Delete middleware error")),
    };
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "Error deleting event and associated data"
    );
  });

  // Edge cases and additional tests
  it("should handle multiple events retrieval", async () => {
    const mockEvents = Array.from({ length: 10 }, (_, i) => ({
      _id: i + 1,
      eventName: `Event ${i + 1}`,
      location: `Location ${i + 1}`,
    }));
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should handle event creation with all required fields", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future

    const completeEventInput = {
      eventName: "Complete Event",
      eventDescription: "A complete description",
      location: "Complete Location",
      requiredSkills: ["JavaScript", "Node.js"],
      urgency: "High",
      eventDate: futureDate,
      eventDateISO: futureDate.toISOString().split("T")[0],
    };

    const completeEventResponse = {
      _id: "complete-event-id",
      eventName: "Complete Event",
      eventDescription: "A complete description",
      location: "Complete Location",
      requiredSkills: ["JavaScript", "Node.js"],
      urgency: "High",
      eventDate: futureDate.toISOString(), // Date will be serialized as string in HTTP response
      eventDateISO: futureDate.toISOString().split("T")[0],
    };

    Event.prototype.save = jest.fn().mockResolvedValue(completeEventResponse);

    const response = await request(app)
      .post("/events/create")
      .send(completeEventInput);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      eventName: "Complete Event",
      eventDescription: "A complete description",
      location: "Complete Location",
      requiredSkills: ["JavaScript", "Node.js"],
      urgency: "High",
      eventDateISO: futureDate.toISOString().split("T")[0],
    });
    // Test that eventDate exists but don't match exact format since it could be string or Date
    expect(response.body.data.eventDate).toBeDefined();
  });

  it("should handle concurrent event requests", async () => {
    const mockEvent = { _id: "1", eventName: "Concurrent Event" };
    Event.findById.mockResolvedValue(mockEvent);

    const requests = Array(5)
      .fill()
      .map(() => request(app).get("/events/1"));

    const responses = await Promise.all(requests);
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvent);
    });
  });
});
