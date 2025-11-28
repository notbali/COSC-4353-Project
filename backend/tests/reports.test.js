const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const reportsRouter = require("../routes/reports");
const { UserCredentials, UserProfile } = require("../models/User");
const EventDetails = require("../models/Event");
const VolunteerHistory = require("../models/VolunteerHistory");

// Mock the models
jest.mock("../models/User");
jest.mock("../models/Event");
jest.mock("../models/VolunteerHistory");
jest.mock("jsonwebtoken");
jest.mock("pdfkit", () => {
  return jest.fn().mockImplementation(() => {
    let internalY = global.__pdfStartY || 0;
    const doc = {
      get y() {
        return global.__forceHighY ? 800 : internalY;
      },
      set y(val) {
        internalY = val;
      },
      fontSize: jest.fn(() => doc),
      text: jest.fn(() => {
        internalY += global.__pdfTextInc ?? 200;
        return doc;
      }),
      moveDown: jest.fn(() => {
        internalY += global.__pdfMoveInc ?? 50;
        return doc;
      }),
      addPage: jest.fn(() => {
        internalY = 0;
        return doc;
      }),
      pipe: jest.fn(),
      end: jest.fn(),
    };
    global.__lastPdfDoc = doc;
    global.__pdfDocs = [...(global.__pdfDocs || []), doc];
    return doc;
  });
});

const app = express();
app.use(express.json());
app.use("/reports", reportsRouter);

describe("Reports Routes", () => {
  let validToken;
  const mockUserId = "507f1f77bcf86cd799439011";
  const mockEventId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    validToken = "valid.jwt.token";
    global.__lastPdfDoc = undefined;
    global.__pdfDocs = [];
    global.__forceHighY = false;

    // Mock JWT verification
    jwt.verify.mockImplementation((token, secret) => {
      if (token === validToken) {
        return { userId: mockUserId, username: "testuser" };
      }
      throw new Error("JsonWebTokenError");
    });
  });

  describe("Authentication Middleware", () => {
    it("should return 401 if no authorization header is provided", async () => {
      const response = await request(app).get("/reports/volunteers");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("no token found");
    });

    it("should return 401 if token is invalid", async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", "Bearer invalid.token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("invalid token");
    });

    it("should return 401 if token is expired", async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error("Token expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", "Bearer expired.token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("invalid token");
    });

    it("should return 500 for other authentication errors", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("Some other error");
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", "Bearer error.token");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("GET /reports/volunteers", () => {
    it("should return volunteers with participation history", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: ["First Aid", "Event Planning"],
        },
      ];

      const mockHistory = [
        {
          userId: mockUserId,
          eventId: {
            _id: mockEventId,
            eventName: "Food Drive",
            eventDate: new Date("2024-01-15"),
            location: "Community Center",
          },
          eventName: "Food Drive",
          participationDate: new Date("2024-01-15"),
          status: "completed",
          hoursVolunteered: 4,
          feedback: "Great event",
          rating: 5,
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockUserId,
        username: "testuser",
        email: "test@example.com",
        fullName: "Test User",
        address1: "123 Main St",
        city: "Houston",
        state: "TX",
        zip: "77001",
        skills: ["First Aid", "Event Planning"],
        totalEvents: 1,
        totalHours: 4,
      });
      expect(response.body[0].participationHistory).toHaveLength(1);
    });

    it("should fallback to empty strings and defaults when profile fields are missing", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "nofields",
            email: "nofields@example.com",
          },
          fullName: "No Fields",
        },
      ];

      const mockHistory = [
        {
          eventName: "Sparse Event",
          participationDate: new Date("2024-04-01"),
          status: "pending",
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject({
        address1: "",
        city: "",
        state: "",
        zip: "",
        skills: [],
        totalHours: 0,
      });
      expect(response.body[0].participationHistory[0]).toMatchObject({
        hoursVolunteered: 0,
        feedback: "",
        rating: null,
      });
    });

    it("should handle volunteers with legacy address fields", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address: "456 Old St",
          zipcode: "77002",
          skills: [],
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].address1).toBe("456 Old St");
      expect(response.body[0].zip).toBe("77002");
    });

    it("should return 500 on database error", async () => {
      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/volunteers")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error fetching volunteers report");
    });
  });

  describe("GET /reports/events", () => {
    it("should return events with volunteer assignments", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          eventDescription: "Help distribute food",
          location: "Community Center",
          eventDate: new Date("2024-01-15"),
          eventDateISO: "2024-01-15",
          requiredSkills: ["First Aid"],
          urgency: "high",
          status: "upcoming",
          maxVolunteers: 10,
          currentVolunteers: 1,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          volunteerName: "Test User",
          status: "confirmed",
          hoursVolunteered: 4,
          createdAt: new Date("2024-01-10"),
          feedback: "Looking forward to it",
          rating: null,
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      UserProfile.findOne.mockResolvedValue({
        fullName: "Test User Full",
      });

      const response = await request(app)
        .get("/reports/events")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        eventId: mockEventId,
        eventName: "Food Drive",
        location: "Community Center",
        status: "upcoming",
        volunteerCount: 1,
      });
      expect(response.body[0].assignedVolunteers).toHaveLength(1);
      expect(response.body[0].assignedVolunteers[0].volunteerName).toBe(
        "Test User Full"
      );
    });

    it("should handle deleted users in volunteer history", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          eventDescription: "Help distribute food",
          location: "Community Center",
          eventDate: new Date("2024-01-15"),
          eventDateISO: "2024-01-15",
          requiredSkills: [],
          urgency: "medium",
          status: "upcoming",
          maxVolunteers: 10,
          currentVolunteers: 0,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: null,
          volunteerName: "Deleted User",
          status: "confirmed",
          hoursVolunteered: 4,
          createdAt: new Date("2024-01-10"),
          feedback: "",
          rating: null,
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      const response = await request(app)
        .get("/reports/events")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].assignedVolunteers[0].volunteerName).toBe(
        "Deleted User"
      );
      expect(response.body[0].assignedVolunteers[0].volunteerId).toBeNull();
    });

    it("should keep blank volunteer names when no profile name is available", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Nameless Event",
          eventDescription: "",
          location: "",
          eventDate: new Date("2024-01-20"),
          eventDateISO: "2024-01-20",
          requiredSkills: [],
          urgency: "",
          status: "",
          maxVolunteers: null,
          currentVolunteers: null,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: {
            _id: mockUserId,
            username: "anon",
            email: "anon@example.com",
          },
          status: "pending",
          createdAt: new Date("2024-01-10"),
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      UserProfile.findOne.mockResolvedValue({ fullName: "" });

      const response = await request(app)
        .get("/reports/events")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].assignedVolunteers[0]).toMatchObject({
        volunteerName: "",
        hoursVolunteered: 0,
        feedback: "",
        rating: null,
      });
    });

    it("should return 500 on database error", async () => {
      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/events")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error fetching events report");
    });

    it("should handle volunteer histories where user is not populated but id exists", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          eventDescription: "Help distribute food",
          location: "Community Center",
          eventDate: new Date("2024-01-15"),
          eventDateISO: "2024-01-15",
          requiredSkills: [],
          urgency: "medium",
          status: "upcoming",
          maxVolunteers: 10,
          currentVolunteers: 0,
        },
      ];

      let firstAccess = true;
      const mockVolunteerHistories = [
        {
          volunteerName: "Backup Name",
          status: "confirmed",
          hoursVolunteered: 2,
          createdAt: new Date("2024-01-10"),
          feedback: "",
          rating: null,
          get userId() {
            if (firstAccess) {
              firstAccess = false;
              return null;
            }
            return mockUserId;
          },
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      const response = await request(app)
        .get("/reports/events")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].assignedVolunteers[0]).toMatchObject({
        volunteerId: mockUserId,
        volunteerName: "Backup Name",
        username: null,
        email: null,
      });
    });
  });

  describe("GET /reports/volunteers/csv", () => {
    it("should generate CSV report for volunteers", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: ["First Aid", "Event Planning"],
        },
      ];

      const mockHistory = [
        {
          hoursVolunteered: 4,
        },
        {
          hoursVolunteered: 3,
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get("/reports/volunteers/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("text/csv");
      expect(response.headers["content-disposition"]).toContain(
        "volunteers-report.csv"
      );
      expect(response.text).toContain("ID,Username,Email,Full Name");
      expect(response.text).toContain("testuser");
      expect(response.text).toContain("7"); // Total hours
    });

    it("should use default CSV values when profile fields are missing", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "csvuser",
            email: "csv@example.com",
          },
          fullName: "CSV User",
        },
      ];

      const mockHistory = [
        {
          hoursVolunteered: undefined,
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get("/reports/volunteers/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain('"CSV User","","",,,""');
      expect(response.text).toContain(",0"); // Total hours should be zero
    });

    it("should handle legacy address fields in CSV", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address: "456 Old St",
          zipcode: "77002",
          skills: [],
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockResolvedValue([]);

      const response = await request(app)
        .get("/reports/volunteers/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("456 Old St");
      expect(response.text).toContain("77002");
    });

    it("should return 500 on error", async () => {
      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/volunteers/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error generating CSV report");
    });
  });

  describe("GET /reports/events/csv", () => {
    it("should generate CSV report for events", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          location: "Community Center",
          eventDateISO: "2024-01-15",
          requiredSkills: ["First Aid", "Cooking"],
          urgency: "high",
          status: "upcoming",
          maxVolunteers: 10,
          currentVolunteers: 2,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      let historyCallCount = 0;
      VolunteerHistory.find.mockImplementation(() => {
        const docInstance = global.__lastPdfDoc;
        if (docInstance) {
          docInstance.y = 800;
        }
        historyCallCount += 1;
        return {
          populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
        };
      });

      UserProfile.findOne.mockResolvedValue({
        fullName: "Test User",
      });

      const response = await request(app)
        .get("/reports/events/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("text/csv");
      expect(response.headers["content-disposition"]).toContain(
        "events-report.csv"
      );
      expect(response.text).toContain("Event ID,Event Name,Location");
      expect(response.text).toContain("Food Drive");
      expect(response.text).toContain("Test User");
    });

    it("should use volunteerName fallback when no profile found", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          location: "Community Center",
          eventDateISO: "2024-01-15",
          requiredSkills: [],
          urgency: "medium",
          status: "upcoming",
          maxVolunteers: 10,
          currentVolunteers: 1,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
          volunteerName: "Fallback Name",
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      UserProfile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/reports/events/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Fallback Name");
    });

    it("should fill empty event fields with defaults in CSV", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "CSV Event",
          location: "",
          eventDateISO: "",
          requiredSkills: undefined,
          urgency: "",
          status: "",
          maxVolunteers: undefined,
          currentVolunteers: undefined,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
          volunteerName: "",
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      UserProfile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/reports/events/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain('"CSV Event","",,"",,,0,0,""');
    });

    it("should return 500 on error", async () => {
      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/events/csv")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error generating CSV report");
    });
  });

  describe("GET /reports/volunteers/pdf", () => {
    it("should generate PDF report for volunteers", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: ["First Aid"],
        },
      ];

      const mockHistory = [];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "volunteers-report.pdf"
      );
    });

    it("should handle volunteers with no participation history", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: [],
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should render participation history when space is available without adding pages", async () => {
      const previousTextInc = global.__pdfTextInc;
      const previousMoveInc = global.__pdfMoveInc;
      const previousStartY = global.__pdfStartY;

      global.__pdfTextInc = 1;
      global.__pdfMoveInc = 1;
      global.__pdfStartY = 0;

      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "historyuser",
            email: "history@example.com",
          },
          fullName: "History User",
          address1: "100 Test St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: ["Testing"],
        },
      ];

      const mockHistory = [
        {
          eventName: "History Event",
          participationDate: new Date("2024-04-01"),
          status: "completed",
          hoursVolunteered: 3,
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      try {
        const response = await request(app)
          .get("/reports/volunteers/pdf")
          .set("Authorization", `Bearer ${validToken}`);

        const docInstance = global.__lastPdfDoc;
        expect(response.status).toBe(200);
        expect(docInstance.addPage).not.toHaveBeenCalled();
      } finally {
        global.__pdfTextInc = previousTextInc;
        global.__pdfMoveInc = previousMoveInc;
        global.__pdfStartY = previousStartY;
      }
    });

    it("should return 500 on error before headers sent", async () => {
      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/volunteers/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error generating PDF report");
    });

    it("should handle volunteers with legacy address fields in PDF", async () => {
      const mockUserProfiles = [
        {
          userId: {
            _id: mockUserId,
            username: "testuser",
            email: "test@example.com",
          },
          fullName: "Test User",
          address: "456 Old St",
          zipcode: "77002",
          skills: [],
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app)
        .get("/reports/volunteers/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should paginate participation history entries when they overflow a page", async () => {
      const previousTextInc = global.__pdfTextInc;
      const previousMoveInc = global.__pdfMoveInc;
      const previousStartY = global.__pdfStartY;
      const previousForceHighY = global.__forceHighY;

      global.__pdfTextInc = 0;
      global.__pdfMoveInc = 0;
      global.__pdfStartY = 800;
      global.__forceHighY = true;

      const mockUserProfiles = [
        {
          userId: {
            _id: `${mockUserId}-history`,
            username: "historyuser",
            email: "history@example.com",
          },
          fullName: "History Heavy",
          address1: "999 Overflow Rd",
          city: "Dallas",
          state: "TX",
          zip: "75001",
          skills: [],
        },
      ];

      const mockHistory = [
        {
          eventName: "History Event One",
          participationDate: new Date("2024-05-01"),
          status: "completed",
          hoursVolunteered: 1,
        },
        {
          eventName: "History Event Two",
          participationDate: new Date("2024-06-01"),
          status: "completed",
          hoursVolunteered: 2,
        },
      ];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      try {
        const response = await request(app)
          .get("/reports/volunteers/pdf")
          .set("Authorization", `Bearer ${validToken}`);

        const docInstance = global.__lastPdfDoc;
        expect(response.status).toBe(200);
        expect(docInstance.addPage).toHaveBeenCalled();
      } finally {
        global.__pdfTextInc = previousTextInc;
        global.__pdfMoveInc = previousMoveInc;
        global.__pdfStartY = previousStartY;
        global.__forceHighY = previousForceHighY;
      }
    });

    it("should add a new PDF page when volunteer data overflows", async () => {
      const PDFDocument = require("pdfkit");
      const previousTextInc = global.__pdfTextInc;
      const previousMoveInc = global.__pdfMoveInc;
      const previousStartY = global.__pdfStartY;
      const previousForceHighY = global.__forceHighY;

      global.__pdfTextInc = 0;
      global.__pdfMoveInc = 0;
      global.__pdfStartY = 800;
      global.__forceHighY = true;

      const mockUserProfiles = [
        {
          userId: {
            _id: `${mockUserId}-1`,
            username: "testuser1",
            email: "test1@example.com",
          },
          fullName: "Test User One",
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zip: "77001",
          skills: ["First Aid"],
        },
        {
          userId: {
            _id: `${mockUserId}-2`,
            username: "testuser2",
            email: "test2@example.com",
          },
          fullName: "Test User Two",
          address1: "456 Main St",
          city: "Austin",
          state: "TX",
          zip: "73301",
          skills: ["Cooking"],
        },
      ];

      const mockHistory = [];

      UserProfile.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUserProfiles),
      });

      let historyCallCount = 0;
      VolunteerHistory.find.mockImplementation(() => {
        const docInstance = global.__lastPdfDoc;
        if (docInstance) {
          docInstance.y = 800;
        }
        historyCallCount += 1;
        return {
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockHistory),
          }),
        };
      });

      try {
        const response = await request(app)
          .get("/reports/volunteers/pdf")
          .set("Authorization", `Bearer ${validToken}`);

        const docInstance = global.__lastPdfDoc;

        expect(response.status).toBe(200);
        expect(VolunteerHistory.find).toHaveBeenCalledTimes(2);
        expect(docInstance).toBeDefined();
        expect(docInstance.addPage).toHaveBeenCalled();
      } finally {
        global.__pdfTextInc = previousTextInc;
        global.__pdfMoveInc = previousMoveInc;
        global.__pdfStartY = previousStartY;
        global.__forceHighY = previousForceHighY;
      }
    });
  });

  describe("GET /reports/events/pdf", () => {
    it("should generate PDF report for events", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          eventDateISO: "2024-01-15",
          location: "Community Center",
          urgency: "high",
          status: "upcoming",
          requiredSkills: ["First Aid"],
          maxVolunteers: 10,
          currentVolunteers: 1,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      UserProfile.findOne.mockResolvedValue({
        fullName: "Test User",
      });

      const response = await request(app)
        .get("/reports/events/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "events-report.pdf"
      );
    });

    it("should handle events with no volunteers assigned", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Food Drive",
          eventDateISO: "2024-01-15",
          location: "Community Center",
          urgency: "low",
          status: "upcoming",
          requiredSkills: [],
          maxVolunteers: 10,
          currentVolunteers: 0,
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get("/reports/events/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should return 500 on error before headers sent", async () => {
      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app)
        .get("/reports/events/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error generating PDF report");
    });

    it("should correctly handle event skills and missing volunteer profile in PDF", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          eventName: "Small Event",
          eventDateISO: "2024-02-01",
          location: "Park",
          urgency: "low",
          status: "upcoming",
          requiredSkills: [],
          maxVolunteers: 5,
          currentVolunteers: 1,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      // mock UserProfile to return null
      UserProfile.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/reports/events/pdf")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should add a new PDF page when event list overflows", async () => {
      const PDFDocument = require("pdfkit");
      const previousTextInc = global.__pdfTextInc;
      const previousMoveInc = global.__pdfMoveInc;
      const previousStartY = global.__pdfStartY;
      const previousForceHighY = global.__forceHighY;

      global.__pdfTextInc = 0;
      global.__pdfMoveInc = 0;
      global.__pdfStartY = 800;
      global.__forceHighY = true;

      const mockEvents = [
        {
          _id: `${mockEventId}-1`,
          eventName: "Large Event One",
          eventDateISO: "2024-03-01",
          location: "Park",
          urgency: "high",
          status: "upcoming",
          requiredSkills: [],
          maxVolunteers: 10,
          currentVolunteers: 5,
        },
        {
          _id: `${mockEventId}-2`,
          eventName: "Large Event Two",
          eventDateISO: "2024-03-02",
          location: "Hall",
          urgency: "medium",
          status: "upcoming",
          requiredSkills: [],
          maxVolunteers: 5,
          currentVolunteers: 2,
        },
      ];

      const mockVolunteerHistories = [
        {
          userId: { _id: mockUserId },
        },
      ];

      EventDetails.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents),
      });

      VolunteerHistory.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVolunteerHistories),
      });

      try {
        const response = await request(app)
          .get("/reports/events/pdf")
          .set("Authorization", `Bearer ${validToken}`);

        const docInstance = global.__lastPdfDoc;

        expect(response.status).toBe(200);
        expect(VolunteerHistory.find).toHaveBeenCalledTimes(2);
        expect(docInstance).toBeDefined();
        expect(docInstance.addPage).toHaveBeenCalled();
      } finally {
        global.__pdfTextInc = previousTextInc;
        global.__pdfMoveInc = previousMoveInc;
        global.__pdfStartY = previousStartY;
        global.__forceHighY = previousForceHighY;
      }
    });
  });
});
