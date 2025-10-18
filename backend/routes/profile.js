const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory users and profiles (exported for tests)
const users = [{ username: 'testuser', email: 'test@example.com', password: 'hashedpassword' }];
const userProfiles = {};

// authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'no token found' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = users.find(u => u.username === decoded.username);
    if (!user) return res.status(401).json({ message: 'no user found' });
    req.user = user;
    return next();
  } catch (err) {
    // JWT errors should return 401
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Profile route
router.get('/profile', authenticate, (req, res) => {
  try {
    const username = req.user.username;
    if (!userProfiles[username]) {
      userProfiles[username] = {
        name: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        skills: [],
        preferences: "",
        availability: [],
      };
    }
    res.json(userProfiles[username]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit profile route
router.put('/profile/edit', authenticate, (req, res) => {
  try {
    const username = req.user.username;
    if (!userProfiles[username]) {
      userProfiles[username] = {
        name: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        skills: [],
        preferences: "",
        availability: [],
      };
    }

    const profile = userProfiles[username];
    Object.assign(profile, req.body);
    res.json({ message: 'Profile updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export for tests (router + in-memory stores)
module.exports = {
  router,
  users,
  userProfiles,
};