// routes/profile.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { UserCredentials, UserProfile } = require('../models/User');

const router = express.Router();

// Middleware for authentication
async function authenticate(req, res, next) {
  // Grab authentication header
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'no token found' });

  // Grab token and decode
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'invalid token' });
    }
    console.error('Authentication error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { username } = req.user;

    // Find user credentials
    const userCredentials = await UserCredentials.findOne({ username });
    if (!userCredentials) return res.status(401).json({ message: 'no user found' });

    // Find user profile
    const userProfile = await UserProfile.findOne({ userId: userCredentials._id });
    if (!userProfile) return res.status(404).json({ message: 'Profile not found' });

    // Return profile
    res.json(userProfile);
    console.log("Received profile request for: ", userCredentials.username);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/profile/edit
router.put('/profile/edit', authenticate, async (req, res) => {
  try {
    const { username } = req.user;

    // Find user credentials
    const userCredentials = await UserCredentials.findOne({ username });
    if (!userCredentials) return res.status(401).json({ message: 'no user found' });

    // Find and update user profile
    const userProfile = await UserProfile.findOne({ userId: userCredentials._id });
    if (!userProfile) return res.status(404).json({ message: 'Profile not found' });

    // Update profile fields with validation
    Object.assign(userProfile, req.body);
    await userProfile.save();

    res.json({ message: 'Profile updated successfully!' });
    console.log("Received edit profile data:", req.body);
  } catch (err) {
    console.error('Profile update error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(error => error.message) 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
