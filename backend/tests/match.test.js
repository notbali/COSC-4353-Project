jest.mock("supertest");
const request = require("supertest");
const express = require("express");

// Mock data stores
const mockUserProfiles = {};
const mockEvents = {};
const mockVolunteerHistory = {};

// Mock EventDetails model
jest.mock("../models/Event", () => {
  const MockEventDetails = {
    async find(query = {}) {
      let results = Object.values(mockEvents);
      if (query.status) {
        results = results.filter((event) => event.status === query.status);
      }
      return results;
    },

    async findById(id) {
      return mockEvents[id] || null;
    },
  };

  return MockEventDetails;
});

// Mock User model
jest.mock("../models/User", () => {
  const MockUserProfile = {
    async findOne(query) {
      return (
        Object.values(mockUserProfiles).find((profile) =>
          Object.entries(query).every(([key, value]) => profile[key] === value)
        ) || null
      );
    },
  };

  return {
    UserProfile: MockUserProfile,
  };
});

// Mock VolunteerHistory model
jest.mock("../models/VolunteerHistory", () => {
  const MockVolunteerHistory = {
    async findOne(query) {
      return (
        Object.values(mockVolunteerHistory).find((history) =>
          Object.entries(query).every(([key, value]) => history[key] === value)
        ) || null
      );
    },
  };

  return MockVolunteerHistory;
});

const matchRoutes = require("../routes/match");

const app = express();
app.use(express.json());
app.use("/api", matchRoutes);

describe("Match Routes - Full Coverage", () => {
  beforeEach(() => {
    // Clear mock data before each test
    Object.keys(mockUserProfiles).forEach(
      (key) => delete mockUserProfiles[key]
    );
    Object.keys(mockEvents).forEach((key) => delete mockEvents[key]);
    Object.keys(mockVolunteerHistory).forEach(
      (key) => delete mockVolunteerHistory[key]
    );
  });

  describe("GET /match/:volunteerId", () => {
    it("should return 404 if user profile not found", async () => {
      const res = await request(app).get("/api/match/nonexistent_user");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User profile not found");
    });

    it("should return empty array when no matching events exist", async () => {
      // Create user profile with no matching skills
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
        skills: ["Programming"],
        availability: ["2025-12-01"],
      };

      // Create event with different required skills
      mockEvents["event_1"] = {
        _id: "event_1",
        eventName: "Cooking Event",
        status: "Open",
        requiredSkills: ["Cooking"],
        eventDateISO: "2025-12-01",
      };

      const res = await request(app).get(`/api/match/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return matching events based on skills and availability", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
        skills: ["Programming", "Teaching"],
        availability: ["2025-12-01", "2025-12-02"],
      };

      // Create matching event
      mockEvents["event_1"] = {
        _id: "event_1",
        eventName: "Code Teaching Workshop",
        status: "Open",
        requiredSkills: ["Programming"],
        eventDateISO: "2025-12-01",
        toObject: function () {
          return { ...this };
        },
      };

      // Create non-matching event (past date)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockEvents["event_2"] = {
        _id: "event_2",
        eventName: "Past Event",
        status: "Open",
        requiredSkills: ["Programming"],
        eventDateISO: pastDate.toISOString().split("T")[0],
      };

      const res = await request(app).get(`/api/match/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].eventName).toBe("Code Teaching Workshop");
      expect(res.body[0].matchedVolunteer).toBeNull();
    });

    it("should return events with volunteer assignment status", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
        skills: ["Programming"],
        availability: ["2025-12-01"],
      };

      // Create matching event
      mockEvents["event_1"] = {
        _id: "event_1",
        eventName: "Programming Workshop",
        status: "Open",
        requiredSkills: ["Programming"],
        eventDateISO: "2025-12-01",
        toObject: function () {
          return { ...this };
        },
      };

      // Create volunteer history (already assigned)
      mockVolunteerHistory["history_1"] = {
        _id: "history_1",
        userId: userId,
        eventId: "event_1",
        volunteerName: "John Doe",
        createdAt: new Date(),
      };

      const res = await request(app).get(`/api/match/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].matchedVolunteer).toBe(userId);
      expect(res.body[0].matchedVolunteerName).toBe("John Doe");
    });

    it("should handle events with no required skills", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
        skills: ["Programming"],
        availability: ["2025-12-01"],
      };

      // Create event with no required skills
      mockEvents["event_1"] = {
        _id: "event_1",
        eventName: "General Volunteer Work",
        status: "Open",
        requiredSkills: [],
        eventDateISO: "2025-12-01",
      };

      const res = await request(app).get(`/api/match/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should match events when volunteer has no availability restrictions", async () => {
      // Create user profile with no availability (should match all future events)
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
        skills: ["Programming"],
        availability: [],
      };

      // Create future event
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      mockEvents["event_1"] = {
        _id: "event_1",
        eventName: "Programming Workshop",
        status: "Open",
        requiredSkills: ["Programming"],
        eventDateISO: futureDate.toISOString().split("T")[0],
        toObject: function () {
          return { ...this };
        },
      };

      const res = await request(app).get(`/api/match/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should handle database errors gracefully", async () => {
      const { UserProfile } = require("../models/User");
      const originalFindOne = UserProfile.findOne;
      UserProfile.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/api/match/user_1");
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Error finding matching events");

      // Restore original method
      UserProfile.findOne = originalFindOne;
    });
  });

  describe("POST /match", () => {
    it("should return 400 if volunteerId or eventId is missing", async () => {
      let res = await request(app).post("/api/match").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("volunteerId and eventId required");

      res = await request(app)
        .post("/api/match")
        .send({ volunteerId: "user_1" });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("volunteerId and eventId required");

      res = await request(app).post("/api/match").send({ eventId: "event_1" });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("volunteerId and eventId required");
    });

    it("should return 404 if user profile not found", async () => {
      const res = await request(app).post("/api/match").send({
        volunteerId: "nonexistent_user",
        eventId: "event_1",
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User profile not found");
    });

    it("should return 404 if event not found", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: "nonexistent_event",
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Event not found");
    });

    it("should return 400 if event is not open", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Create closed event
      const eventId = "event_1";
      mockEvents[eventId] = {
        _id: eventId,
        eventName: "Closed Event",
        status: "Closed",
        save: async function () {
          return this;
        },
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: eventId,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Event is not open for registration");
    });

    it("should return 400 if event is full", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Create full event
      const eventId = "event_1";
      mockEvents[eventId] = {
        _id: eventId,
        eventName: "Full Event",
        status: "Open",
        currentVolunteers: 5,
        maxVolunteers: 5,
        save: async function () {
          return this;
        },
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: eventId,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Event is full");
    });

    it("should return 400 if volunteer already matched to event", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Create event
      const eventId = "event_1";
      mockEvents[eventId] = {
        _id: eventId,
        eventName: "Test Event",
        status: "Open",
        currentVolunteers: 0,
        maxVolunteers: 10,
        save: async function () {
          return this;
        },
      };

      // Create existing volunteer history
      mockVolunteerHistory["history_1"] = {
        _id: "history_1",
        userId: userId,
        eventId: eventId,
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: eventId,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Volunteer already matched to this event");
    });

    it("should successfully create match and increment volunteer count", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Create event
      const eventId = "event_1";
      mockEvents[eventId] = {
        _id: eventId,
        eventName: "Test Event",
        status: "Open",
        currentVolunteers: 2,
        maxVolunteers: 10,
        save: async function () {
          mockEvents[eventId] = this;
          return this;
        },
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: eventId,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.match).toBeDefined();
      expect(res.body.match.volunteerId).toBe(userId);
      expect(res.body.match.eventId).toBe(eventId);
      expect(res.body.event.currentVolunteers).toBe(3);
    });

    it("should handle undefined currentVolunteers", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Create event with undefined currentVolunteers
      const eventId = "event_1";
      mockEvents[eventId] = {
        _id: eventId,
        eventName: "Test Event",
        status: "Open",
        maxVolunteers: 10,
        save: async function () {
          mockEvents[eventId] = this;
          return this;
        },
      };

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: eventId,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.event.currentVolunteers).toBe(1);
    });

    it("should handle database errors gracefully", async () => {
      // Create user profile
      const userId = "user_1";
      mockUserProfiles["profile_1"] = {
        userId: userId,
        fullName: "John Doe",
      };

      // Mock database error
      const { UserProfile } = require("../models/User");
      const originalFindOne = UserProfile.findOne;
      UserProfile.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const res = await request(app).post("/api/match").send({
        volunteerId: userId,
        eventId: "event_1",
      });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Error creating match");

      // Restore original method
      UserProfile.findOne = originalFindOne;
    });
  });
});
