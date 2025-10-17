const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const volunteerRoutes = require('./routes/history');
const matchRoutes = require('./routes/match');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', volunteerRoutes);
app.use('/api', matchRoutes);
app.listen(5001, () => console.log('Server running on port 5001'));
// In-memory users array
const users = [];

// Registration route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  // Check if user exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });
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
  // Create a fake token for demonstration
  const token = jwt.sign({ username: user.username }, 'your_jwt_secret');
  res.json({ token });
  console.log("Received login data:", req.body);
});

