const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCurrentPrices } = require('../services/priceSimulator');
const Holding = require('../models/Holding');
const User = require('../models/User');

// Get portfolio summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const prices = getCurrentPrices();
    const priceMap = {};
    prices.forEach(p => { priceMap[p.symbol] = p; });

    const [user, holdings] = await Promise.all([
      User.findById(userId),
      Holding.find({ userId }) // Get all holdings including shorts
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    let totalInvested = 0, currentValue = 0;
    const enriched = holdings.map(h => {
      // ONLY use live price from Upstox, NEVER fallback to avgPrice
      const ltp = priceMap[h.symbol]?.price;
      if (!ltp) {
        console.warn(`⚠️ No live price for ${h.symbol}, skipping calculation`);
        return null;
      }

      // For LONG: positive qty, for SHORT: negative qty
      const absQty = Math.abs(h.qty);
      const isShort = h.positionType === 'SHORT';
      
      // Current value: positive for long, negative for short
      const cv = isShort ? -ltp * absQty : ltp * absQty;
      // Invested: positive for long, negative for short
      const inv = isShort ? -h.avgPrice * absQty : h.avgPrice * absQty;
      // P&L calculation: for long (ltp - entry) * qty, for short (entry - ltp) * qty
      const pnl = isShort ? (h.avgPrice - ltp) * absQty : (ltp - h.avgPrice) * absQty;
      
      totalInvested += inv;
      currentValue += cv;
      
      return { 
        ...h.toObject(), 
        currentPrice: ltp, 
        currentValue: cv, 
        unrealizedPnl: pnl, 
        unrealizedPnlPct: inv !== 0 ? (pnl / Math.abs(inv)) * 100 : 0 
      };
    }).filter(h => h !== null);

    res.json({
      balance: user.balance,
      initialBalance: user.initialBalance,
      totalInvested,
      currentValue,
      totalPnl: currentValue - totalInvested,
      totalPnlPct: totalInvested !== 0 ? ((currentValue - totalInvested) / Math.abs(totalInvested)) * 100 : 0,
      portfolioValue: user.balance + currentValue,
      holdings: enriched,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
