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
      Holding.find({ userId, qty: { $gt: 0 } }), // Changed 'quantity' to 'qty'
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    let totalInvested = 0, currentValue = 0;
    const enriched = holdings.map(h => {
      const ltp = priceMap[h.symbol]?.price || h.avgPrice;
      const cv = ltp * h.qty; // Changed 'quantity' to 'qty'
      const inv = h.avgPrice * h.qty; // Changed 'quantity' to 'qty'
      const pnl = cv - inv;
      totalInvested += inv;
      currentValue += cv;
      return { ...h.toObject(), currentPrice: ltp, currentValue: cv, unrealizedPnl: pnl, unrealizedPnlPct: (pnl / inv) * 100 };
    });

    res.json({
      balance: user.balance,
      initialBalance: user.initialBalance,
      totalInvested,
      currentValue,
      totalPnl: currentValue - totalInvested,
      totalPnlPct: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
      portfolioValue: user.balance + currentValue,
      holdings: enriched,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
