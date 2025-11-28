jest.mock("supertest");
const request = require("supertest");

const mockHash = jest.fn((password) => Promise.resolve(`hashed-${password}`));
const mockCompare = jest.fn((plain, hashed) =>
  Promise.resolve(hashed === `hashed-${plain}`)
);
jest.mock("bcryptjs", () => ({
  hash: (...args) => mockHash(...args),
  compare: (...args) => mockCompare(...args),
}));

const mockSign = jest.fn(() => "mock-token");
const mockVerify = jest.fn(() => ({ username: "mockuser" }));
jest.mock("jsonwebtoken", () => ({
  sign: (...args) => mockSign(...args),
  verify: (...args) => mockVerify(...args),
}));

jest.mock("../routes/history", () => (req, res, next) => next());
jest.mock("../routes/match", () => (req, res, next) => next());
jest.mock("../routes/reports", () => (req, res, next) => next());
jest.mock(
  "pdfkit",
  () =>
    function PDF() {
      return { text: () => {}, pipe: () => {}, end: () => {} };
    },
  { virtual: true }
);

const mockConnectDB = jest.fn(async () => {});
jest.mock("../config/database", () => mockConnectDB);

const mockUserCredentialsSave = jest.fn(() => Promise.resolve());
const mockUserProfileSave = jest.fn(() => Promise.resolve());
const mockUserCredentialsFindOne = jest.fn();
const mockUserProfileFindOne = jest.fn();

const MockUserCredentials = jest.fn(function mockUserCredentials(data = {}) {
  Object.assign(this, data);
  this._id = data._id || "new-user-id";
  this.save = mockUserCredentialsSave;
});
MockUserCredentials.findOne = (...args) => mockUserCredentialsFindOne(...args);

const MockUserProfile = jest.fn(function mockUserProfile(data = {}) {
  Object.assign(this, data);
  this.save = mockUserProfileSave;
});
MockUserProfile.findOne = (...args) => mockUserProfileFindOne(...args);

jest.mock("../models/User", () => ({
  UserCredentials: MockUserCredentials,
  UserProfile: MockUserProfile,
}));

process.env.NODE_ENV = "test";
const app = require("../server");
const { buildProfileDefaults } = require("../server");

const authorizedGet = (path) =>
  request(app).get(path).set("Authorization", "Bearer token");
const authorizedPut = (path, body = {}) =>
  request(app).put(path).set("Authorization", "Bearer token").send(body);

describe("server routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHash.mockImplementation((password) =>
      Promise.resolve(`hashed-${password}`)
    );
    mockCompare.mockImplementation((plain, hashed) =>
      Promise.resolve(hashed === `hashed-${plain}`)
    );
    mockSign.mockReturnValue("mock-token");
    mockVerify.mockImplementation(() => ({ username: "mockuser" }));
    mockUserCredentialsSave.mockResolvedValue();
    mockUserProfileSave.mockResolvedValue();
  });

  describe("buildProfileDefaults helper", () => {
    it("builds full defaults when fields missing", () => {
      const result = buildProfileDefaults({});
      expect(result.fullName).toBe("New User");
      expect(result.city).toBe("Unknown City");
      expect(result.state).toBe("NA");
      expect(result.zip).toBe("00000");
    });

    it("uses provided names and trims/uppercases state", () => {
      const result = buildProfileDefaults({
        firstName: "Jane",
        lastName: "Doe",
        address1: " 123 ",
        city: " houston ",
        state: " texas ",
        zip: " 77001 ",
      });
      expect(result.fullName).toBe("Jane Doe");
      expect(result.address1).toBe("123");
      expect(result.city).toBe("houston");
      expect(result.state).toBe("TE");
      expect(result.zip).toBe("77001");
    });
  });

  describe("POST /api/register", () => {
    it("creates user and profile when data is valid", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);

      const res = await request(app).post("/api/register").send({
        username: "user",
        email: "user@example.com",
        password: "secret",
        fullName: "New User",
        address1: "123 Main",
        city: "Houston",
        state: "TX",
        zip: "77001",
      });

      expect(res.status).toBe(201);
      expect(MockUserCredentials).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "user",
          email: "user@example.com",
          password: "hashed-secret",
        })
      );
      expect(MockUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "New User",
          address1: "123 Main",
          city: "Houston",
          state: "TX",
          zip: "77001",
        })
      );
      expect(mockUserCredentialsSave).toHaveBeenCalledTimes(1);
      expect(mockUserProfileSave).toHaveBeenCalledTimes(1);
    });

    it("returns validation error when required fields missing", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({ username: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Missing required fields/i);
      expect(res.body.message).toMatch(/username/);
      expect(res.body.message).toMatch(/email/);
      expect(res.body.message).toMatch(/password/);
      expect(mockUserCredentialsFindOne).not.toHaveBeenCalled();
    });

    it("returns 400 when user already exists", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({ _id: "existing" });

      const res = await request(app).post("/api/register").send({
        username: "user",
        email: "user@example.com",
        password: "secret",
        fullName: "Existing User",
        address1: "123 Main",
        city: "Houston",
        state: "TX",
        zip: "77001",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
      expect(mockUserCredentialsSave).not.toHaveBeenCalled();
    });

    it("returns 400 on validation error from save", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);
      const validationError = new Error("invalid");
      validationError.name = "ValidationError";
      validationError.errors = { username: { message: "bad user" } };
      mockUserCredentialsSave.mockRejectedValueOnce(validationError);

      const res = await request(app).post("/api/register").send({
        username: "user",
        email: "user@example.com",
        password: "secret",
        fullName: "New User",
        address1: "123 Main",
        city: "Houston",
        state: "TX",
        zip: "77001",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.errors).toContain("bad user");
      expect(mockUserProfileSave).not.toHaveBeenCalled();
    });

    it("returns 500 on unexpected register error", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);
      mockUserCredentialsSave.mockRejectedValueOnce(new Error("db down"));

      const res = await request(app).post("/api/register").send({
        username: "user",
        email: "user@example.com",
        password: "secret",
        fullName: "New User",
        address1: "123 Main",
        city: "Houston",
        state: "TX",
        zip: "77001",
      });

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/login", () => {
    it("returns token for valid credentials", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        username: "user",
        password: "hashed-password123",
        _id: "user-id",
      });

      const res = await request(app)
        .post("/api/login")
        .send({ username: "user", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "user-id", token: "mock-token" });
      expect(mockCompare).toHaveBeenCalledWith(
        "password123",
        "hashed-password123"
      );
      expect(mockSign).toHaveBeenCalled();
    });

    it("returns 400 when user not found", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/login")
        .send({ username: "missing", password: "password123" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when password invalid", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        username: "user",
        password: "hashed-password123",
        _id: "user-id",
      });
      mockCompare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post("/api/login")
        .send({ username: "user", password: "wrong" });

      expect(res.status).toBe(400);
    });

    it("returns 500 on unexpected login error", async () => {
      mockUserCredentialsFindOne.mockRejectedValueOnce(new Error("login fail"));

      const res = await request(app)
        .post("/api/login")
        .send({ username: "user", password: "password123" });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/profile", () => {
    it("requires authorization header", async () => {
      const res = await request(app).get("/api/profile");
      expect(res.status).toBe(401);
    });

    it("returns 401 for invalid token", async () => {
      mockVerify.mockImplementationOnce(() => {
        const err = new Error("invalid");
        err.name = "JsonWebTokenError";
        throw err;
      });

      const res = await authorizedGet("/api/profile");
      expect(res.status).toBe(401);
    });

    it("returns 401 when user not found", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);

      const res = await authorizedGet("/api/profile");
      expect(res.status).toBe(401);
    });

    it("creates default profile when none exists", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        _id: "user-id",
        username: "mockuser",
      });
      mockUserProfileFindOne.mockResolvedValueOnce(null);

      const res = await authorizedGet("/api/profile");

      expect(res.status).toBe(404);
    });

    it("returns existing profile", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        _id: "user-id",
        username: "mockuser",
      });
      mockUserProfileFindOne.mockResolvedValueOnce({
        userId: "user-id",
        fullName: "Existing Profile",
      });

      const res = await authorizedGet("/api/profile");
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe("Existing Profile");
    });
  });

  describe("PUT /api/profile/edit", () => {
    it("requires authorization header", async () => {
      const res = await request(app).put("/api/profile/edit");
      expect(res.status).toBe(401);
    });

    it("returns 401 for invalid token", async () => {
      mockVerify.mockImplementationOnce(() => {
        const err = new Error("expired");
        err.name = "TokenExpiredError";
        throw err;
      });

      const res = await authorizedPut("/api/profile/edit", {
        city: "New City",
      });
      expect(res.status).toBe(401);
    });

    it("returns 401 when user not found", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce(null);

      const res = await authorizedPut("/api/profile/edit", {
        city: "New City",
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 when profile missing", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        _id: "user-id",
        username: "mockuser",
      });
      mockUserProfileFindOne.mockResolvedValueOnce(null);

      const res = await authorizedPut("/api/profile/edit", {
        city: "New City",
      });
      expect(res.status).toBe(404);
    });

    it("returns 400 when validation fails", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        _id: "user-id",
        username: "mockuser",
      });
      const validationError = {
        name: "ValidationError",
        errors: { city: { message: "bad city" } },
      };
      mockUserProfileFindOne.mockResolvedValueOnce({
        save: jest.fn().mockRejectedValue(validationError),
      });

      const res = await authorizedPut("/api/profile/edit", {
        city: "New City",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });

    it("updates profile successfully", async () => {
      mockUserCredentialsFindOne.mockResolvedValueOnce({
        _id: "user-id",
        username: "mockuser",
      });
      const save = jest.fn().mockResolvedValue();
      mockUserProfileFindOne.mockResolvedValueOnce({ city: "Old City", save });

      const res = await authorizedPut("/api/profile/edit", {
        city: "New City",
      });

      expect(res.status).toBe(200);
      expect(save).toHaveBeenCalled();
      expect(res.body.message).toBe("Profile updated successfully!");
    });
  });

  describe("server bootstrap", () => {
    it("connects to DB and listens when not in test env", () => {
      jest.resetModules();
      const listenSpy = jest.fn(() => ({ close: jest.fn() }));
      jest.doMock("express", () => {
        const actual = jest.requireActual("express");
        const app = actual();
        app.listen = listenSpy;
        return Object.assign(() => app, actual, { application: app });
      });
      mockConnectDB.mockClear();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      jest.isolateModules(() => {
        require("../server");
      });
      process.env.NODE_ENV = originalEnv;
      jest.dontMock("express");
      expect(mockConnectDB).toHaveBeenCalled();
      expect(listenSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Function)
      );
    });
  });
});
