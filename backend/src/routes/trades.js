const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Holding = require('../models/Holding');

// Execute a trade
router.post('/execute', auth, async (req, res) => {
  const { symbol, side, qty, price } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalCost = qty * price;
    let holding = await Holding.findOne({ userId, symbol });
    let tradePnl = 0;

    if (side === 'BUY') {
      if (user.balance < totalCost) return res.status(400).json({ error: 'Insufficient balance' });
      
      user.balance -= totalCost;
      
      if (!holding) {
        holding = new Holding({ userId, symbol, qty, avgPrice: price });
      } else {
        const newTotalQty = holding.qty + qty;
        holding.avgPrice = (holding.avgPrice * holding.qty + totalCost) / newTotalQty;
        holding.qty = newTotalQty;
      }
    } else {
      if (!holding || holding.qty < qty) return res.status(400).json({ error: 'Insufficient holdings' });
      
      tradePnl = (price - holding.avgPrice) * qty;
      user.balance += totalCost;
      holding.qty -= qty;
      
      if (holding.qty === 0) {
        await Holding.deleteOne({ _id: holding._id });
        holding = null;
      }
    }

    if (holding) await holding.save();
    await user.save();

    const trade = await Trade.create({
      userId,
      symbol,
      type: side,
      qty,
      price,
      total: totalCost,
      pnl: tradePnl
    });

    res.json({ success: true, balance: user.balance, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user holdings
router.get('/holdings', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user.id });
    res.json({ holdings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trade history
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Trade.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;