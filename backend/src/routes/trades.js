const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Holding = require('../models/Holding');

// ─────────────────────────────────────────
// MARKET STATUS CHECK (IST)
// ─────────────────────────────────────────
function isMarketOpen() {
  const now = new Date();

  // convert to IST
  const istTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );

  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();

  const currentMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;   // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;

  return isWeekday &&
    currentMinutes >= marketOpen &&
    currentMinutes <= marketClose;
}

// ─────────────────────────────────────────
// EXECUTE TRADE
// ─────────────────────────────────────────
router.post('/execute', auth, async (req, res) => {
  const { symbol, side, qty, price } = req.body;
  const userId = req.user.id;

  try {
    // ❌ MARKET CLOSED BLOCK
    if (!isMarketOpen()) {
      return res.status(403).json({
        error: 'Market is closed',
        message: 'Trades are only allowed between 9:15 AM - 3:30 PM IST'
      });
    }

    if (!symbol || !side || !qty || !price) {
      return res.status(400).json({ error: 'Missing trade parameters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalCost = qty * price;

    let holding = await Holding.findOne({ userId, symbol });
    let tradePnl = 0;

    // ───────────────── BUY ─────────────────
    if (side === 'BUY') {

      if (user.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      user.balance -= totalCost;

      if (!holding) {
        // Create new LONG position
        holding = new Holding({
          userId,
          symbol,
          qty,
          avgPrice: price,
          positionType: 'LONG'
        });
      } else if (holding.positionType === 'SHORT') {
        // Cover SHORT position first
        if (qty <= Math.abs(holding.qty)) {
          // Fully or partially cover short
          tradePnl = (holding.avgPrice - price) * qty;
          holding.qty += qty; // Make less negative
          if (holding.qty === 0) {
            await Holding.deleteOne({ _id: holding._id });
            holding = null;
          }
        } else {
          // Cover all short and go long with remaining
          tradePnl = (holding.avgPrice - price) * Math.abs(holding.qty);
          const remainingQty = qty - Math.abs(holding.qty);
          holding.qty = remainingQty;
          holding.avgPrice = price;
          holding.positionType = 'LONG';
        }
      } else {
        // Add to existing LONG position
        const newQty = holding.qty + qty;
        holding.avgPrice =
          (holding.avgPrice * holding.qty + totalCost) / newQty;
        holding.qty = newQty;
      }
    }

    // ───────────────── SELL ─────────────────
    else if (side === 'SELL') {

      if (!holding) {
        // Create new SHORT position
        holding = new Holding({
          userId,
          symbol,
          qty: -qty, // Store as negative for shorts
          avgPrice: price,
          positionType: 'SHORT'
        });
        user.balance += totalCost; // Credit proceeds from short sale
      } else if (holding.positionType === 'LONG') {
        // Sell from LONG position first
        if (qty <= holding.qty) {
          // Fully or partially sell long
          tradePnl = (price - holding.avgPrice) * qty;
          holding.qty -= qty;
          user.balance += totalCost;
          if (holding.qty === 0) {
            await Holding.deleteOne({ _id: holding._id });
            holding = null;
          }
        } else {
          // Sell all long and go short with remaining
          tradePnl = (price - holding.avgPrice) * holding.qty;
          user.balance += (holding.qty * price); // Credit from selling long
          const remainingQty = qty - holding.qty;
          holding.qty = -remainingQty; // Store as negative
          holding.avgPrice = price;
          holding.positionType = 'SHORT';
          user.balance += (remainingQty * price); // Credit from short sale
        }
      } else {
        // Add to existing SHORT position
        const absQty = Math.abs(holding.qty);
        const newAbsQty = absQty + qty;
        holding.avgPrice = (holding.avgPrice * absQty + totalCost) / newAbsQty;
        holding.qty = -newAbsQty; // Keep negative for shorts
        user.balance += totalCost; // Credit proceeds from short sale
      }
    }

    else {
      return res.status(400).json({ error: 'Invalid trade side' });
    }

    // ───────────────── SAVE ─────────────────
    if (holding) await holding.save();
    await user.save();

    const trade = await Trade.create({
      userId,
      symbol,
      type: side,
      qty,
      price,
      total: totalCost,
      pnl: tradePnl,
      timestamp: new Date()
    });

    res.json({
      success: true,
      balance: user.balance,
      trade,
      marketStatus: 'OPEN'
    });

  } catch (err) {
    console.error('Trade error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// HOLDINGS
// ─────────────────────────────────────────
router.get('/holdings', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user.id });
    res.json({ holdings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Trade.find({ userId: req.user.id })
      .sort({ timestamp: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;