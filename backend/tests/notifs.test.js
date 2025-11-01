// notifs.test.js
const request = require("supertest");
const express = require("express");
const Notifs = require("../models/Notifs");
const Event = require("../models/Event");
const router = require("../routes/notifsRoutes");

jest.mock("../models/Notifs");
jest.mock("../models/Event");

const app = express();
app.use(express.json());
app.use("/notifs", router);

// helper to mock the Mongoose chain: find().populate().sort()
function mockFindChain({ result, reject = false }) {
  const sort = jest.fn();
  if (reject) {
    sort.mockRejectedValue(
      result instanceof Error ? result : new Error("DB error")
    );
  } else {
    sort.mockResolvedValue(result);
  }
  const populate = jest.fn().mockReturnValue({ sort });
  Notifs.find.mockReturnValue({ populate, sort });
  return { populate, sort };
}

describe("Notifications Routes - Full Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /create
  it("creates a 'new event' notification (201)", async () => {
    const mockEvent = {
      _id: "1",
      eventName: "Test Event",
      eventDescription: "Desc",
    };
    const mockNotification = {
      _id: "n1",
      event: "1",
      title: "A New Event Has Been Posted!",
    };

    Event.findById.mockResolvedValue(mockEvent);
    Notifs.create.mockResolvedValue(mockNotification);

    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "1", notifType: "new event", userId: "u123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Notification created successfully.");
    expect(Event.findById).toHaveBeenCalledWith("1");
    expect(Notifs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "1",
        user: "u123",
        title: "A New Event Has Been Posted!",
        message: expect.stringContaining("Test Event"),
      })
    );
  });

  it("creates an 'event update' notification and uses correct title", async () => {
    const mockEvent = { _id: "1", eventName: "Updated Event" };
    Event.findById.mockResolvedValue(mockEvent);
    Notifs.create.mockResolvedValue({ _id: "n2" });

    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "1", notifType: "event update", userId: "u1" });

    expect(res.statusCode).toBe(201);
    expect(Notifs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "An Event Has Been Updated!",
        message: expect.stringContaining("Updated Event"),
      })
    );
  });

  it("creates a 'reminder' notification and uses correct title", async () => {
    const mockEvent = { _id: "1", eventName: "Reminder Event" };
    Event.findById.mockResolvedValue(mockEvent);
    Notifs.create.mockResolvedValue({ _id: "n3" });

    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "1", notifType: "reminder", userId: "u1" });

    expect(res.statusCode).toBe(201);
    expect(Notifs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Event Reminder",
        message: expect.stringContaining("Reminder Event"),
      })
    );
  });

  it("returns 404 if event not found (create)", async () => {
    Event.findById.mockResolvedValue(null);

    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "999", notifType: "new event", userId: "u1" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Event not found.");
  });

  it("returns 400 for invalid notification type", async () => {
    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "1", notifType: "not-a-type", userId: "u1" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid notification type.");
  });

  it("returns 400 when required fields missing (create)", async () => {
    const res = await request(app).post("/notifs/create").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Event ID, notification type, and user ID are required."
    );
  });

  it("returns 500 on server error (create)", async () => {
    Event.findById.mockRejectedValue(new Error("Database error"));
    const res = await request(app)
      .post("/notifs/create")
      .send({ eventId: "1", notifType: "new event", userId: "u1" });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe(
      "An error occurred while creating the notification."
    );
  });

  // POST /delete
  it("creates a cancellation notification (201)", async () => {
    Notifs.create.mockResolvedValue({
      _id: "c1",
      title: "An Event Has Been Canceled",
    });

    const res = await request(app).post("/notifs/delete").send({
      eventName: "Test Event",
      eventDescription: "Test Description",
      eventLocation: "Test Location",
      eventDate: "2024-10-25",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Notification created successfully.");
    expect(Notifs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "An Event Has Been Canceled",
        message: expect.stringContaining(`"Test Event"`),
      })
    );
  });

  it("accepts optional fields (delete) and fills nulls", async () => {
    Notifs.create.mockResolvedValue({ _id: "c2" });

    const res = await request(app).post("/notifs/delete").send({
      eventName: "Only Name Given",
    });

    expect(res.statusCode).toBe(201);
    const call = Notifs.create.mock.calls[0][0];
    expect(call.eventDetails).toEqual({
      name: "Only Name Given",
      description: null,
      location: null,
      date: null,
    });
  });

  it("returns 400 when eventName missing (delete)", async () => {
    const res = await request(app).post("/notifs/delete").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Event name is required.");
  });

  it("returns 500 on server error (delete)", async () => {
    Notifs.create.mockRejectedValue(new Error("Database error"));
    const res = await request(app).post("/notifs/delete").send({
      eventName: "Err Event",
      eventDescription: "x",
      eventLocation: "y",
      eventDate: "2025-10-17",
    });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe(
      "An error occurred while creating the notification."
    );
  });

  // POST /matched
  it("creates notifications for matched users (201)", async () => {
    Event.findById.mockResolvedValue({ _id: "1", eventName: "Test Event" });
    Notifs.create
      .mockResolvedValueOnce({ _id: "m1" })
      .mockResolvedValueOnce({ _id: "m2" });

    const res = await request(app)
      .post("/notifs/matched")
      .send({ eventId: "1", userIds: ["u1", "u2"] });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe(
      "Notifications created successfully for matched users."
    );
    expect(Notifs.create).toHaveBeenCalledTimes(2);
  });

  it("returns 400 if userIds is missing/empty (matched)", async () => {
    let res = await request(app).post("/notifs/matched").send({ eventId: "1" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Event ID and user IDs are required.");

    res = await request(app)
      .post("/notifs/matched")
      .send({ eventId: "1", userIds: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User IDs are required.");
  });

  it("returns 404 if event not found (matched)", async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app)
      .post("/notifs/matched")
      .send({ eventId: "nope", userIds: ["u1"] });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Event not found.");
  });

  it("returns 500 on server error (matched)", async () => {
    Event.findById.mockRejectedValue(new Error("Database error"));
    const res = await request(app)
      .post("/notifs/matched")
      .send({ eventId: "1", userIds: ["u1"] });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe(
      "An error occurred while creating the notifications."
    );
  });

  it("handles large number of matched users", async () => {
    Event.findById.mockResolvedValue({ _id: "1", eventName: "Big Event" });
    Notifs.create.mockResolvedValue({ _id: "x" });
    const users = Array.from({ length: 50 }, (_, i) => `u${i}`);

    const res = await request(app)
      .post("/notifs/matched")
      .send({ eventId: "1", userIds: users });

    expect(res.statusCode).toBe(201);
    expect(Notifs.create).toHaveBeenCalledTimes(50);
  });

  // GET /all 
  it("gets notifications for a specific user (200) and passes query to find", async () => {
    const mockNotifications = [
      { _id: "1", title: "Matched Event", user: "u123" },
    ];
    const { populate, sort } = mockFindChain({ result: mockNotifications });

    const res = await request(app).get("/notifs/all").query({ userId: "u123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockNotifications);
    expect(Notifs.find).toHaveBeenCalledWith({ user: "u123" });
    expect(populate).toHaveBeenCalledWith(
      "event",
      "eventName eventDate location eventDescription"
    );
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("gets all notifications if no userId is provided", async () => {
    const mockNotifications = [{ _id: "1", title: "General Notification" }];
    mockFindChain({ result: mockNotifications });

    const res = await request(app).get("/notifs/all");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockNotifications);
    expect(Notifs.find).toHaveBeenCalledWith({});
  });

  it("returns empty array when none found", async () => {
    mockFindChain({ result: [] });

    const res = await request(app).get("/notifs/all").query({ userId: "none" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 500 when find chain errors (get all)", async () => {
    mockFindChain({ result: new Error("Database error"), reject: true });

    const res = await request(app).get("/notifs/all");
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe(
      "An error occurred while fetching notifications."
    );
  });
});
