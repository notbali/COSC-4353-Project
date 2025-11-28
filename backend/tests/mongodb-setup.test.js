const { Types } = require("mongoose");
const { UserCredentials, UserProfile } = require("../models/User");
const EventDetails = require("../models/Event");
const VolunteerHistory = require("../models/VolunteerHistory");
const States = require("../models/States");
const bcrypt = require("bcryptjs");

const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

const uniqueId = () => Math.random().toString(36).slice(2, 10);
const uniqueUsername = (base = "user") => `${base}-${uniqueId()}`;
const uniqueEmail = (base = "user") => `${base}${uniqueId()}@example.com`;
const uniqueEventName = (base = "Test Event") => `${base} ${uniqueId()}`;
const uniqueStateCode = () => uniqueId().slice(0, 2).toUpperCase();
const uniqueStateName = () => `State-${uniqueId()}`;

describe("Schema validation without DB connection", () => {
  describe("UserCredentials", () => {
    test("accepts valid credentials", () => {
      const hashedPassword = bcrypt.hashSync("password123", 10);
      const doc = new UserCredentials({
        username: uniqueUsername("testuser"),
        email: uniqueEmail("testuser"),
        password: hashedPassword,
      });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.password).toBe(hashedPassword);
    });

    test("rejects missing required fields", () => {
      const doc = new UserCredentials({});
      const error = doc.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test("rejects bad email and short username", () => {
      const doc = new UserCredentials({
        username: "ab",
        email: "invalid-email",
        password: bcrypt.hashSync("password123", 10),
      });
      const error = doc.validateSync();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });
  });

  describe("UserProfile", () => {
    test("accepts valid profile", () => {
      const userId = new Types.ObjectId();
      const doc = new UserProfile({
        userId,
        fullName: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        zip: "12345",
        skills: ["Communication", "Organization"],
        preferences: "Prefers outdoor activities",
        availability: ["2025-01-15", "2025-01-20"],
      });
      expect(doc.validateSync()).toBeUndefined();
    });

    test("rejects bad zip and availability", () => {
      const userId = new Types.ObjectId();
      const doc = new UserProfile({
        userId,
        fullName: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        zip: "invalid",
        skills: ["Communication"],
        preferences: "Prefs",
        availability: ["bad-date"],
      });
      const error = doc.validateSync();
      expect(error.errors.zip).toBeDefined();
      expect(error.errors.availability).toBeDefined();
    });
  });

  describe("EventDetails", () => {
    test("accepts valid event", () => {
      const date = futureDate();
      const doc = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription:
          "This is a test event description that meets the minimum length requirement",
        location: "123 Test Location",
        requiredSkills: ["Communication", "Organization"],
        urgency: "Medium",
        eventDate: date,
        eventDateISO: date.toISOString().split("T")[0],
      });
      expect(doc.validateSync()).toBeUndefined();
    });

    test("rejects bad urgency/date/skills", () => {
      const doc = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription: "Short desc but still valid length I hope",
        location: "123 Test Location",
        requiredSkills: [],
        urgency: "InvalidUrgency",
        eventDate: new Date("2020-01-01"),
        eventDateISO: "2020-01-01",
      });
      const error = doc.validateSync();
      expect(error.errors.urgency).toBeDefined();
      expect(error.errors.requiredSkills).toBeDefined();
      expect(error.errors.eventDate).toBeDefined();
    });
  });

  describe("VolunteerHistory", () => {
    test("accepts valid history record", () => {
      const eventDate = futureDate();
      const doc = new VolunteerHistory({
        userId: new Types.ObjectId(),
        eventId: new Types.ObjectId(),
        eventName: "Volunteer Event",
        volunteerName: "Test Volunteer",
        status: "Registered",
        hoursVolunteered: 4,
        eventDate,
      });
      expect(doc.validateSync()).toBeUndefined();
    });

    test("rejects bad status and rating", () => {
      const doc = new VolunteerHistory({
        userId: new Types.ObjectId(),
        eventId: new Types.ObjectId(),
        eventName: "Volunteer Event",
        volunteerName: "Test Volunteer",
        status: "InvalidStatus",
        rating: 6,
      });
      const error = doc.validateSync();
      expect(error.errors.status).toBeDefined();
      expect(error.errors.rating).toBeDefined();
    });
  });

  describe("States", () => {
    test("accepts valid state", () => {
      const doc = new States({
        stateCode: uniqueStateCode(),
        stateName: uniqueStateName(),
        region: "West",
      });
      expect(doc.validateSync()).toBeUndefined();
    });

    test("rejects bad state code and region", () => {
      const doc = new States({
        stateCode: null,
        stateName: "California",
        region: "Invalid",
      });
      const error = doc.validateSync();
      expect(error.errors.stateCode).toBeDefined();
      expect(error.errors.region).toBeDefined();
    });
  });

  describe("Referential checks", () => {
    test("profile references credentials id", () => {
      const userId = new Types.ObjectId();
      const user = new UserCredentials({
        username: uniqueUsername("integrityuser"),
        email: uniqueEmail("integrityuser"),
        password: bcrypt.hashSync("password123", 10),
      });
      const profile = new UserProfile({
        userId,
        fullName: "Integrity Test",
        address1: "123 Test St",
        city: "Test City",
        state: "TS",
        zip: "12345",
      });
      expect(user.validateSync()).toBeUndefined();
      expect(profile.validateSync()).toBeUndefined();
      expect(profile.userId.toString()).toBe(userId.toString());
    });

    test("volunteer history references event id", () => {
      const event = new EventDetails({
        eventName: uniqueEventName(),
        eventDescription: "A valid description for integrity test",
        location: "Location",
        requiredSkills: ["Skill1"],
        urgency: "Low",
        eventDate: futureDate(),
        eventDateISO: futureDate().toISOString().split("T")[0],
      });
      const history = new VolunteerHistory({
        userId: new Types.ObjectId(),
        eventId: event._id,
        eventName: event.eventName,
        volunteerName: "Integrity Volunteer",
        status: "Registered",
      });
      expect(event.validateSync()).toBeUndefined();
      expect(history.validateSync()).toBeUndefined();
      expect(history.eventId.toString()).toBe(event._id.toString());
    });
  });
});
