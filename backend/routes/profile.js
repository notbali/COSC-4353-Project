const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory users and profiles (exported for tests)
const users = [{ username: 'testuser', email: 'test@example.com', password: 'hashedpassword' }];
const userProfiles = {};

// Simulate user authentication (duplicate user won't break tests but ensure single entry)
if (!users.find(u => u.username === 'testuser')) {
  users.push({ username: 'testuser', password: 'hashedpassword' });
}

// Profile route
router.get('/profile', (req, res) => {
  try {
    // Grab authentication header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });
    
    // Grab token and decode
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
   
    // Find user
    const user = users.find(u => u.username === decoded.username);
    if (!user) return res.status(401).json({ message: 'no user found' });

    // Set profile if it doesn't exist
    if (!userProfiles[user.username]) {
      userProfiles[user.username] = {
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
    
    // Return profile
    res.json(userProfiles[user.username]);
    console.log('Received profile request for:', user.username);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit profile route
router.put('/profile/edit', (req, res) => {
  try {
    // Grab authentication header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });
    
    // Grab token and decode
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
   
    // Find user
    const user = users.find(u => u.username === decoded.username);
    if (!user) return res.status(401).json({ message: 'no user found' });

    // Set profile if it doesn't exist
    if (!userProfiles[user.username]) {
      userProfiles[user.username] = {
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
    
    // Update profile
    const profile = userProfiles[user.username];
    Object.assign(profile, req.body);
    res.json({ message: 'Profile updated!' });
    console.log('Received edit profile data:', req.body);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export for tests (router + in-memory stores)
module.exports = {
  router,
  users,
  userProfiles,
};