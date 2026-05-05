const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

let User;
try { User = require('../models/User'); } catch {}

const generateToken = (user) => jwt.sign(
  { id: user._id || user.id, email: user.email, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Demo user for offline mode
const DEMO_USER = {
  _id: 'demo_user_001',
  id: 'demo_user_001',
  username: 'DemoTrader',
  email: 'demo@tradeedge.in',
  balance: 100000,
  initialBalance: 100000,
  createdAt: new Date(),
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    try {
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) return res.status(400).json({ error: 'User already exists' });

      const user = await User.create({ username, email, password });
      const token = generateToken(user);
      res.status(201).json({ token, user });
    } catch {
      // Offline mode
      const token = generateToken({ ...DEMO_USER, username, email });
      res.status(201).json({ token, user: { ...DEMO_USER, username, email } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      user.lastLogin = new Date();
      await user.save();
      const token = generateToken(user);
      res.json({ token, user });
    } catch {
      // Offline mode - accept demo credentials
      if (email === 'demo@tradeedge.in' && password === 'demo123') {
        const token = generateToken(DEMO_USER);
        return res.json({ token, user: DEMO_USER });
      }
      // Create offline token for any credentials
      const token = generateToken({ ...DEMO_USER, email });
      res.json({ token, user: { ...DEMO_USER, email } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

// Demo login (no password needed)
router.post('/demo', (req, res) => {
  const token = generateToken(DEMO_USER);
  res.json({ token, user: DEMO_USER });
});

module.exports = router;
