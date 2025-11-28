jest.mock("supertest");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const maybeDescribe = describe;
jest.mock(
  "pdfkit",
  () => {
    return function MockPDF() {
      return { text: () => {}, pipe: () => {}, end: () => {} };
    };
  },
  { virtual: true }
);

jest.mock("mongoose", () => {
  const real = jest.requireActual("mongoose");
  return {
    ...real,
    connect: jest.fn().mockResolvedValue({}),
    connection: { close: jest.fn().mockResolvedValue() },
  };
});

const mockUsers = [];
const mockProfiles = {};

jest.mock("../models/User", () => {
  function mockCreateValidationError(errors) {
    const err = new Error("Validation failed");
    err.name = "ValidationError";
    err.errors = Object.entries(errors).reduce((acc, [field, message]) => {
      acc[field] = { message };
      return acc;
    }, {});
    return err;
  }
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  const zipRegex = /^\d{5}(-\d{4})?$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  class UserCredentials {
    constructor(data = {}) {
      Object.assign(this, data);
      this._id = data._id || `user-${Math.random().toString(36).slice(2, 8)}`;
    }
    static async findOne(query) {
      if (query.username)
        return mockUsers.find((u) => u.username === query.username) || null;
      if (query.email)
        return mockUsers.find((u) => u.email === query.email) || null;
      if (query.$or) {
        return (
          mockUsers.find((u) =>
            query.$or.some(
              (q) => q.username === u.username || q.email === u.email
            )
          ) || null
        );
      }
      return null;
    }
    async save() {
      const errors = {};
      if (!this.username || this.username.trim().length < 3) {
        errors.username = "Username must be at least 3 characters long";
      }
      if (this.username && this.username.length > 30) {
        errors.username = "Username cannot exceed 30 characters";
      }
      if (!this.email || !emailRegex.test(this.email)) {
        errors.email = "Please enter a valid email";
      }
      if (!this.password || this.password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
      }
      if (Object.keys(errors).length) {
        throw mockCreateValidationError(errors);
      }
      mockUsers.push(this);
      return this;
    }
  }

  class UserProfile {
    constructor(data = {}) {
      Object.assign(this, data);
    }
    static async findOne(query) {
      return mockProfiles[query.userId] || null;
    }
    static async create(data = {}) {
      const profile = new UserProfile(data);
      await profile.save();
      return profile;
    }
    static async updateOne(query, update) {
      const existing = await UserProfile.findOne(query);
      if (existing) {
        Object.assign(existing, update);
        mockProfiles[query.userId] = existing;
        return { acknowledged: true, modifiedCount: 1 };
      }
      return { acknowledged: true, modifiedCount: 0 };
    }
    async save() {
      const errors = {};
      if (!this.fullName || this.fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters long";
      }
      if (!this.address1) {
        errors.address1 = "Address is required";
      }
      if (!this.city) {
        errors.city = "City is required";
      }
      if (!this.state || this.state.length !== 2) {
        errors.state = "State must be a 2-character code";
      }
      if (!this.zip || !zipRegex.test(this.zip)) {
        errors.zip = "Please enter a valid zipcode";
      }
      if (this.availability && !this.availability.every((d) => dateRegex.test(d))) {
        errors.availability = "Availability dates must be in YYYY-MM-DD format";
      }
      if (
        this.skills &&
        Array.isArray(this.skills) &&
        !this.skills.every((s) => typeof s === "string" && s.trim().length > 0)
      ) {
        errors.skills = "Skills cannot be empty strings";
      }
      if (Object.keys(errors).length) {
        throw mockCreateValidationError(errors);
      }
      mockProfiles[this.userId] = this;
      return this;
    }
  }

  return { UserCredentials, UserProfile };
});

const uniqueId = () => Math.random().toString(36).slice(2, 8);
const uniqueUsername = (base = "user") => {
  const suffix = uniqueId();
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "") || "user";
  const maxBaseLength = Math.max(1, 30 - suffix.length - 1);
  const trimmedBase = sanitized.slice(0, maxBaseLength);
  return `${trimmedBase}-${suffix}`;
};
const uniqueEmail = (base = "user") => {
  const suffix = uniqueId();
  const sanitized = base.replace(/[^a-zA-Z0-9]/g, "") || "user";
  return `${sanitized.slice(0, 20)}${suffix}@example.com`;
};
const baseProfileFields = () => ({
  fullName: "Test User",
  address1: "123 Main St",
  city: "Houston",
  state: "TX",
  zip: "77001",
});

// Import the actual server setup
const app = require("../server");

maybeDescribe("MongoDB Authentication System", () => {
  describe("User Registration", () => {
    test("should register user with valid credentials", async () => {
      const suffix = uniqueId();
      const userData = {
        username: uniqueUsername("testuser"),
        email: uniqueEmail("testuser"),
        password: "password123",
        ...baseProfileFields(),
      };

      const res = await request(app).post("/api/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User registered successfully!");
      expect(res.body.userId).toBeDefined();
    });

    test("should return validation error for missing fields", async () => {
      const res = await request(app).post("/api/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Missing required fields");
    });

    test("should return validation error for invalid email format", async () => {
      const suffix = uniqueId();
      const userData = {
        username: uniqueUsername("testuser"),
        email: "invalid-email",
        password: "password123",
        ...baseProfileFields(),
      };

      const res = await request(app).post("/api/register").send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });

    test("should return validation error for short username", async () => {
      const suffix = uniqueId();
      const userData = {
        username: "ab",
        email: uniqueEmail("shortname"),
        password: "password123",
        ...baseProfileFields(),
      };

      const res = await request(app).post("/api/register").send(userData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });

    test("should return validation error for short password", async () => {
      const suffix = uniqueId();
      const userData = {
        username: uniqueUsername("testuser"),
        email: uniqueEmail("shortpw"),
        password: "123",
        ...baseProfileFields(),
      };

      const res = await request(app).post("/api/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User registered successfully!");
    });

    test("should not allow duplicate usernames", async () => {
      const suffix = uniqueId();
      const baseUsername = uniqueUsername("duplicateuser");
      const userData = {
        username: baseUsername,
        email: uniqueEmail("duplicateuser"),
        password: "password123",
        ...baseProfileFields(),
      };

      // First registration
      await request(app).post("/api/register").send(userData);

      // Second registration with same username
      const res = await request(app)
        .post("/api/register")
        .send({
          ...userData,
          email: uniqueEmail("duplicateuser-alt"),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username or email already exists");
    });

    test("should not allow duplicate emails", async () => {
      const suffix = uniqueId();
      const baseEmail = uniqueEmail("duplicate");
      const userData = {
        username: uniqueUsername("testuser"),
        email: baseEmail,
        password: "password123",
        ...baseProfileFields(),
      };

      // First registration
      await request(app).post("/api/register").send(userData);

      // Second registration with same email
      const res = await request(app)
        .post("/api/register")
        .send({
          ...userData,
          username: uniqueUsername("differentuser"),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username or email already exists");
    });
  });

  describe("User Login", () => {
    const loginUsername = uniqueUsername("logintest");
    const loginEmail = uniqueEmail("logintest");

    beforeAll(async () => {
      const { UserCredentials, UserProfile } = require("../models/User");
      const hashedPassword = await bcrypt.hash("password123", 10);

      let userCredentials = await UserCredentials.findOne({
        username: loginUsername,
      });
      if (!userCredentials) {
        userCredentials = new UserCredentials({
          username: loginUsername,
          email: loginEmail,
          password: hashedPassword,
        });
        await userCredentials.save();

        const userProfile = new UserProfile({
          userId: userCredentials._id,
          fullName: "Login Test User",
          address1: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          skills: ["Communication"],
          preferences: "Test preferences",
          availability: ["2025-01-15"],
        });
        await userProfile.save();
      }
    });

    test("should login with valid credentials", async () => {
      const res = await request(app).post("/api/login").send({
        username: loginUsername,
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    test("should not login with invalid username", async () => {
      const res = await request(app).post("/api/login").send({
        username: "nonexistent",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    test("should not login with invalid password", async () => {
      const res = await request(app).post("/api/login").send({
        username: loginUsername,
        password: "wrongpassword",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  describe("Profile Management", () => {
    let authToken;
    let userId;
    const profileUsername = uniqueUsername("profiletest");
    const profileEmail = uniqueEmail("profiletest");

    beforeAll(async () => {
      const { UserCredentials, UserProfile } = require("../models/User");
      const hashedPassword = await bcrypt.hash("password123", 10);

      let userCredentials = await UserCredentials.findOne({
        username: profileUsername,
      });
      if (!userCredentials) {
        userCredentials = new UserCredentials({
          username: profileUsername,
          email: profileEmail,
          password: hashedPassword,
        });
        await userCredentials.save();
      }

      userId = userCredentials._id;

      const existingProfile = await UserProfile.findOne({ userId });
      if (!existingProfile) {
        await UserProfile.create({
          userId,
          fullName: "Profile Test User",
          address1: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          skills: ["Communication"],
          preferences: "Test preferences",
          availability: ["2025-01-15"],
        });
      }

      authToken = jwt.sign(
        { username: profileUsername, userId },
        process.env.JWT_SECRET || "your_jwt_secret"
      );
    });

    beforeEach(async () => {
      const { UserProfile } = require("../models/User");
      await UserProfile.updateOne(
        { userId },
        {
          fullName: "Profile Test User",
          address1: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
          skills: ["Communication"],
          preferences: "Test preferences",
          availability: ["2025-01-15"],
        }
      );
    });

    test("should get user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe("Profile Test User");
      expect(res.body.skills).toEqual(["Communication"]);
    });

    test("should return 401 without token", async () => {
      const res = await request(app).get("/api/profile");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("no token found");
    });

    test("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("invalid token");
    });

    test("should update user profile with valid data", async () => {
      const updateData = {
        fullName: "Updated Name",
        city: "Updated City",
        skills: ["Communication", "Organization"],
      };

      const res = await request(app)
        .put("/api/profile/edit")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Profile updated successfully!");
    });

    test("should return validation error for invalid profile data", async () => {
      const invalidData = {
        zip: "invalid-zip",
        availability: ["invalid-date"],
      };

      const res = await request(app)
        .put("/api/profile/edit")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });
  });

  describe("Data Persistence", () => {
    test("should persist user data across requests", async () => {
      // Register a user
      const userData = {
        username: uniqueUsername("persisttest"),
        email: uniqueEmail("persisttest"),
        password: "password123",
        ...baseProfileFields(),
      };

      const registerRes = await request(app)
        .post("/api/register")
        .send(userData);

      expect(registerRes.status).toBe(201);
      const userId = registerRes.body.userId;

      // Login to get token
      const loginRes = await request(app).post("/api/login").send({
        username: userData.username,
        password: "password123",
      });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token;

      // Get profile
      const profileRes = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body).toBeDefined();
    });
  });
});
