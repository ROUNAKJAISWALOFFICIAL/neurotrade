const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');

const generateToken = (user) => jwt.sign(
  { id: user._id || user.id, email: user.email, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ username, email, password });
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo login (now creates/finds a real DB record for persistence)
router.post('/demo', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'demo@tradeedge.in' });
    
    if (!user) {
      user = await User.create({
        username: 'DemoTrader',
        email: 'demo@tradeedge.in',
        password: 'demo_no_password_needed', // This is just a placeholder
        balance: 100000,
        initialBalance: 100000
      });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize demo user' });
  }
});

module.exports = router;
