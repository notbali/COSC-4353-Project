jest.mock("supertest");
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock Mongoose model
jest.mock("../models/User", () => {
  const userData = [
    {
      _id: "123",
      username: "testuser",
      email: "test@example.com",
      password: "hashed",
    },
  ];
  const profileData = {
    123: {
      userId: "123",
      userRole: "admin",
      fullName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      skills: [],
      preferences: "",
      availability: [],
    },
  };

  return {
    UserCredentials: {
      findOne: jest.fn(async (query) => {
        if (query.username)
          return userData.find((u) => u.username === query.username) || null;
        if (query._id) return userData.find((u) => u._id === query._id) || null;
        return null;
      }),
    },
    UserProfile: {
      findOne: jest.fn(async (query) => profileData[query.userId] || null),
      save: jest.fn(async () => {}),
      __mockProfiles: profileData,
    },
  };
});

const { UserCredentials, UserProfile } = require("../models/User");
const profileRoutes = require("../routes/profile");

const app = express();
app.use(express.json());
app.use("/api", profileRoutes);

describe("Profile Routes (Mocked DB) - Full Coverage", () => {
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { username: "testuser", userId: "123" },
      "your_jwt_secret"
    );
  });

  beforeEach(() => {
    // reset mock implementations if changed
    jest.clearAllMocks();
  });

  it("should fetch an existing profile", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("fullName", "");
    expect(UserCredentials.findOne).toHaveBeenCalledWith({
      username: "testuser",
    });
  });

  it("should return 404 if profile not found", async () => {
    UserProfile.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/profile not found/i);
  });

  it("should update profile successfully", async () => {
    // Mock UserCredentials and UserProfile
    UserCredentials.findOne.mockResolvedValue({
      _id: "123",
      username: "testuser",
    });
    UserProfile.findOne.mockResolvedValue({
      userId: "123",
      city: "Old City",
      save: jest.fn().mockResolvedValue(true), // ✅ add fake save
    });

    const token = jwt.sign(
      { username: "testuser", userId: "123" },
      "your_jwt_secret"
    );

    const res = await request(app)
      .put("/api/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "New City" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
    expect(UserProfile.findOne).toHaveBeenCalledWith({ userId: "123" });
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it("should return 401 for invalid token", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it("should return 401 if user not found", async () => {
    UserCredentials.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no user found/i);
  });

  it("should handle internal server error gracefully", async () => {
    UserProfile.findOne.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/internal server error/i);
  });

  it("should return 401 for expired token", async () => {
    const expired = jwt.sign({ username: "testuser" }, "your_jwt_secret", {
      expiresIn: -1,
    });
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${expired}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it("should handle internal server error in GET /profile", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    const { UserCredentials, UserProfile } = require("../models/User");
    UserCredentials.findOne.mockResolvedValue({
      _id: "123",
      username: "testuser",
    });

    // Force an error inside findOne
    UserProfile.findOne.mockRejectedValue(new Error("boom"));

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });

  it("should handle validation errors in PUT /profile/edit", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    const mockProfile = {
      save: jest.fn(() => {
        const err = new Error("Invalid");
        err.name = "ValidationError";
        err.errors = { city: { message: "City is required" } };
        throw err;
      }),
    };

    const { UserCredentials, UserProfile } = require("../models/User");
    UserCredentials.findOne.mockResolvedValue({
      _id: "123",
      username: "testuser",
    });
    UserProfile.findOne.mockResolvedValue(mockProfile);

    const res = await request(app)
      .put("/api/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Validation error/i);
    expect(res.body.errors[0]).toMatch(/City is required/i);
  });

  it("should handle generic internal server error in PUT /profile/edit", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    const mockProfile = {
      save: jest.fn(() => {
        throw new Error("Unexpected failure");
      }),
    };

    const { UserCredentials, UserProfile } = require("../models/User");
    UserCredentials.findOne.mockResolvedValue({
      _id: "123",
      username: "testuser",
    });
    UserProfile.findOne.mockResolvedValue(mockProfile);

    const res = await request(app)
      .put("/api/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Houston" });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });

  it("should return 401 when updating profile if user is missing", async () => {
    const token = jwt.sign({ username: "ghost" }, "your_jwt_secret");

    UserCredentials.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put("/api/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Austin" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no user found/i);
  });

  it("should return 404 when updating non-existent profile", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    UserCredentials.findOne.mockResolvedValueOnce({
      _id: "123",
      username: "testuser",
    });
    UserProfile.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put("/api/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Austin" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Profile not found/i);
  });

  it("should get user role successfully", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    UserProfile.findOne.mockResolvedValueOnce({
      userId: "123",
      userRole: "admin",
    });

    const res = await request(app)
      .get("/api/profile/123/role")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.userRole).toBe("admin");
    expect(UserProfile.findOne).toHaveBeenCalledWith({ userId: "123" });
  });

  it("should return 404 when user role profile missing", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    UserProfile.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/profile/999/role")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Profile not found/i);
  });

  it("should handle server error when fetching user role", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    UserProfile.findOne.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const res = await request(app)
      .get("/api/profile/123/role")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });

  it("should handle unexpected errors inside auth middleware", async () => {
    const token = jwt.sign({ username: "testuser" }, "your_jwt_secret");

    // Mock jwt.verify to throw an unexpected error (e.g., runtime crash)
    const verifySpy = jest
      .spyOn(require("jsonwebtoken"), "verify")
      .mockImplementation(() => {
        throw new Error("Auth middleware failure");
      });

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");

    verifySpy.mockRestore();
  });
});
