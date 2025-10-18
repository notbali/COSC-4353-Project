const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json());
app.listen(5001, () => console.log('Server running on port 5001'));
// In-memory users array
const users = [];
const userProfiles = {};

// Registration route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const id = users.length;
  // Check if user exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id, username, email, password: hashedPassword });
  res.status(201).json({ message: 'User registered!' });
  console.log("Received registration data:", req.body);
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  const id = user.id;
  // Create a fake token for demonstration
  const token = jwt.sign({ username: user.username }, 'your_jwt_secret');
  res.json({ id, token });
  console.log("Received login data:", req.body);
});


// Profile route
app.get('/api/profile', (req, res) => {
  try {
    // Grab authentication header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });
    
    // Grab token and decode
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, 'your_jwt_secret');
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'invalid token' });
      }
      console.error('Profile fetch error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
   
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
    console.log("Received profile request for: ", user.username);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit profile route
app.put('/api/profile/edit', (req, res) => {
  try {
    // Grab authentication header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });
    
    // Grab token and decode
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, 'your_jwt_secret');
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'invalid token' });
      }
      console.error('Profile update error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
   
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
    console.log("Received edit profile data:", req.body);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});