const request = require("supertest");
const express = require("express");
const eventRoutes = require("../routes/eventRoutes");
const Event = require("../models/Event");

jest.mock("../models/Event", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  save: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use("/events", eventRoutes);

describe("Event Routes - Full Coverage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // POST /create tests
  it("should create a new event", async () => {
    const mockEvent = { eventName: "Test Event", location: "Test Location" };
    Event.prototype.save = jest.fn().mockResolvedValue(mockEvent);

    const response = await request(app).post("/events/create").send(mockEvent);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Event created successfully");
    expect(response.body.data).toMatchObject(mockEvent);
  });

  it("should return 400 if event creation fails", async () => {
    Event.prototype.save = jest
      .fn()
      .mockRejectedValue(new Error("Creation error"));

    const response = await request(app).post("/events/create").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
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
    expect(response.body.message).toBeDefined();
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
      { _id: "1", eventName: "Event 1", location: "Location 1" },
      { _id: "2", eventName: "Event 2", location: "Location 2" },
    ];
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(mockEvents.length);
  });

  it("should return 500 if fetching events with volunteer count fails", async () => {
    Event.find.mockRejectedValue(new Error("Database error"));

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error fetching events");
  });

  it("should handle events with no volunteers", async () => {
    const mockEvents = [
      { _id: "1", eventName: "Event 1", location: "Location 1" },
    ];
    Event.find.mockResolvedValue(mockEvents);

    const response = await request(app).get("/events/all-with-volunteer-count");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
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
    expect(response.body.message).toBeDefined();
  });

  it("should handle invalid event ID format", async () => {
    Event.findById.mockRejectedValue(new Error("Invalid ObjectId"));

    const response = await request(app).get("/events/invalid-id");

    expect(response.status).toBe(500);
    expect(response.body.message).toBeDefined();
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
    expect(response.body.message).toBeDefined();
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
    const mockEvent = { _id: "1", eventName: "Event to Delete" };
    Event.findById.mockResolvedValue(mockEvent);

    const response = await request(app).delete("/events/delete/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Event and associated data deleted successfully"
    );
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
    const completeEvent = {
      eventName: "Complete Event",
      eventDescription: "A complete description",
      location: "Complete Location",
      requiredSkills: "JavaScript, Node.js",
      urgency: "High",
      eventDate: new Date(),
    };
    Event.prototype.save = jest.fn().mockResolvedValue(completeEvent);

    const response = await request(app)
      .post("/events/create")
      .send(completeEvent);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(completeEvent);
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
