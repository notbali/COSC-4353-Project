require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { UserCredentials, UserProfile } = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

const volunteerRoutes = require('./routes/history');
const matchRoutes = require('./routes/match');
const profileRoutes = require('./routes/profile');
app.use('/api', volunteerRoutes);
app.use('/api', matchRoutes);
app.use('/api', profileRoutes);

const buildProfileDefaults = (payload = {}) => {
  const {
    fullName,
    firstName,
    lastName,
    address1,
    address,
    address2,
    city,
    state,
    zip
  } = payload;

  const resolvedFullName = (fullName || [firstName, lastName].filter(Boolean).join(' ')).trim();
  const resolvedAddress = (address1 || address || '').trim();
  const resolvedCity = (city || '').trim();
  const resolvedState = (state || '').trim().slice(0, 2).toUpperCase();
  const resolvedZip = (zip || '').trim();

  return {
    fullName: resolvedFullName || 'New User',
    address: resolvedAddress || 'Address Pending',
    address2: (address2 || '').trim(),
    city: resolvedCity || 'Unknown City',
    state: resolvedState || 'NA',
    zipcode: resolvedZip || '00000'
  };
};

// Registration route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const missing = [];
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (missing.length) {
      return res.status(400).json({
        message: 'Validation error',
        errors: missing.map((field) => `${field} is required`)
      });
    }

    const existingUser = await UserCredentials.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCredentials = new UserCredentials({
      username,
      email,
      password: hashedPassword
    });

    await userCredentials.save();

    const defaults = buildProfileDefaults(req.body);

    const userProfile = new UserProfile({
      userId: userCredentials._id,
      ...defaults,
      skills: [],
      preferences: '',
      availability: []
    });

    await userProfile.save();

    res.status(201).json({
      message: 'User registered successfully!',
      userId: userCredentials._id
    });
    console.log('Received registration data:', req.body);
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message)
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

// Profile route
app.get('/api/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'invalid token' });
      }
      console.error('Profile fetch error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const userCredentials = await UserCredentials.findOne({ username: decoded.username });
    if (!userCredentials) return res.status(401).json({ message: 'no user found' });

    let userProfile = await UserProfile.findOne({ userId: userCredentials._id });
    if (!userProfile) {
      const defaults = buildProfileDefaults();
      userProfile = new UserProfile({
        userId: userCredentials._id,
        ...defaults,
        skills: [],
        preferences: '',
        availability: []
      });
      await userProfile.save();
    }

    res.json(userProfile);
    console.log('Received profile request for:', userCredentials.username);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit profile route
app.put('/api/profile/edit', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'no token found' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'invalid token' });
      }
      console.error('Profile update error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const userCredentials = await UserCredentials.findOne({ username: decoded.username });
    if (!userCredentials) return res.status(401).json({ message: 'no user found' });

    const userProfile = await UserProfile.findOne({ userId: userCredentials._id });
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    Object.assign(userProfile, req.body);
    await userProfile.save();

    res.json({ message: 'Profile updated successfully!' });
    console.log('Received edit profile data:', req.body);
  } catch (err) {
    console.error('Profile update error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(err.errors).map((error) => error.message)
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

const startServer = async () => {
  await connectDB();
  const port = process.env.PORT || 5001;
  return app.listen(port, () => console.log(`Server running on port ${port}`));
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
