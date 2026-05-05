const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPrice } = require('../services/priceSimulator');

// In-memory fallback store
const memStore = { holdings: {}, orders: [], balance: {} };

let Trade, Holding, User;
try {
  Trade = require('../models/Trade');
  Holding = require('../models/Holding');
  User = require('../models/User');
} catch {}

// Place order
router.post('/order', auth, async (req, res) => {
  try {
    const { symbol, type, quantity, price, orderType = 'MARKET', stopLoss, target } = req.body;
    const userId = req.user._id || req.user.id;

    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'Symbol, type and quantity required' });
    }

    const execPrice = price || getPrice(symbol) || 0;
    if (!execPrice) return res.status(400).json({ error: 'Invalid symbol or price' });

    const totalValue = execPrice * quantity;

    try {
      // DB mode
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      if (type === 'BUY') {
        if (user.balance < totalValue) return res.status(400).json({ error: 'Insufficient balance' });
        user.balance -= totalValue;
        
        let holding = await Holding.findOne({ userId, symbol });
        if (holding) {
          const newAvg = (holding.avgPrice * holding.quantity + execPrice * quantity) / (holding.quantity + quantity);
          holding.avgPrice = newAvg;
          holding.quantity += quantity;
          holding.totalInvested += totalValue;
        } else {
          holding = new Holding({ userId, symbol, quantity, avgPrice: execPrice, totalInvested: totalValue });
        }
        await holding.save();
      } else {
        let holding = await Holding.findOne({ userId, symbol });
        if (!holding || holding.quantity < quantity) return res.status(400).json({ error: 'Insufficient holdings' });
        
        const pnl = (execPrice - holding.avgPrice) * quantity;
        user.balance += totalValue;
        holding.quantity -= quantity;
        holding.totalInvested -= holding.avgPrice * quantity;
        if (holding.quantity === 0) await holding.deleteOne();
        else await holding.save();
      }

      await user.save();

      const trade = await Trade.create({ userId, symbol, type, quantity, price: execPrice, totalValue, orderType, stopLoss, target, status: 'EXECUTED' });
      
      const io = req.app.get('io');
      io.to(`portfolio:${userId}`).emit('portfolio:update', { type: 'order', trade });

      return res.status(201).json({ trade, newBalance: user.balance });
    } catch (dbErr) {
      // Offline/memory fallback
      const uid = userId.toString();
      if (!memStore.balance[uid]) memStore.balance[uid] = 100000;
      if (!memStore.holdings[uid]) memStore.holdings[uid] = {};

      const balance = memStore.balance[uid];

      if (type === 'BUY') {
        if (balance < totalValue) return res.status(400).json({ error: 'Insufficient balance' });
        memStore.balance[uid] -= totalValue;
        const h = memStore.holdings[uid][symbol];
        if (h) {
          h.avgPrice = (h.avgPrice * h.quantity + execPrice * quantity) / (h.quantity + quantity);
          h.quantity += quantity;
        } else {
          memStore.holdings[uid][symbol] = { symbol, quantity, avgPrice: execPrice };
        }
      } else {
        const h = memStore.holdings[uid]?.[symbol];
        if (!h || h.quantity < quantity) return res.status(400).json({ error: 'Insufficient holdings' });
        memStore.balance[uid] += totalValue;
        h.quantity -= quantity;
        if (h.quantity === 0) delete memStore.holdings[uid][symbol];
      }

      const trade = { _id: Date.now(), userId, symbol, type, quantity, price: execPrice, totalValue, status: 'EXECUTED', executedAt: new Date() };
      memStore.orders.unshift(trade);

      return res.status(201).json({ trade, newBalance: memStore.balance[uid] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 50 } = req.query;
    try {
      const trades = await Trade.find({ userId }).sort({ executedAt: -1 }).limit(parseInt(limit)).skip((page - 1) * limit);
      res.json({ trades });
    } catch {
      const uid = userId.toString();
      res.json({ trades: memStore.orders.filter(o => o.userId === uid) });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
