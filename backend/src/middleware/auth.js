const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in DB, fallback for offline mode
    try {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
    } catch {
      // Offline mode - use decoded token data
      req.user = { _id: decoded.id, email: decoded.email, username: decoded.username };
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
