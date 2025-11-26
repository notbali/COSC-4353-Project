require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { UserCredentials, UserProfile } = require('./models/User');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.listen(5001, () => console.log('Server running on port 5001'));

const volunteerRoutes = require('./routes/history');
const matchRoutes = require('./routes/match');
const profileRoutes = require('./routes/profile');
const eventRoutes = require('./routes/eventRoutes');
const notifsRoutes = require('./routes/notifsRoutes');
const reportRoutes = require('./routes/reports');
app.use('/api', volunteerRoutes);
app.use('/api', matchRoutes);
app.use('/api', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);

const buildProfileDefaults = (payload = {}) => {
  const {
    fullName,
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip
  } = payload;

  const resolvedFullName = (fullName || [firstName, lastName].filter(Boolean).join(' ')).trim();
  const resolvedAddress = (address1 || address2 || '').trim();
  const resolvedCity = (city || '').trim();
  const resolvedState = (state || '').trim().slice(0, 2).toUpperCase();
  const resolvedZip = (zip || '').trim();

  return {
    fullName: resolvedFullName || 'New User',
    address1: (address1 || '').trim(),
    address2: (address2 || '').trim(),
    city: resolvedCity || 'Unknown City',
    state: resolvedState || 'NA',
    zip: resolvedZip || '00000'
  };
};

// Registration route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, fullName, address1, city, state, zip } = req.body;

    // Validation for required fields
    const missing = [];
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!fullName) missing.push('fullName');
    if (!address1) missing.push('address1');
    if (!city) missing.push('city');
    if (!state) missing.push('state');
    if (!zip) missing.push('zip');
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    
    // Check if user exists
    const existingUser = await UserCredentials.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user credentials
    const userCredentials = new UserCredentials({
      username,
      email,
      password: hashedPassword
    });
    
    await userCredentials.save();
    
    // Create user profile using provided values
    const userProfile = new UserProfile({
      userId: userCredentials._id,
      fullName,
      address1,
      address2: '',
      city,
      state,
      zip,
      skills: [],
      preferences: '',
      availability: []
    });
    
    await userProfile.save();
    
    res.status(201).json({ 
      message: 'User registered successfully!', 
      userId: userCredentials._id 
    });
    console.log("Received registration data:", req.body);
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserCredentials.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username: user.username, userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret');
    res.json({ id: user._id, token });
    console.log("Received login data:", req.body);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});