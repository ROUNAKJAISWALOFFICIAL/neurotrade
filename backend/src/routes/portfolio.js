const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCurrentPrices, getPrice } = require('../services/priceSimulator');

let Holding, User;
try { Holding = require('../models/Holding'); User = require('../models/User'); } catch {}

// Get portfolio summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const prices = getCurrentPrices();
    const priceMap = {};
    prices.forEach(p => { priceMap[p.symbol] = p; });

    try {
      const [user, holdings] = await Promise.all([
        User.findById(userId),
        Holding.find({ userId, quantity: { $gt: 0 } }),
      ]);

      let totalInvested = 0, currentValue = 0;
      const enriched = holdings.map(h => {
        const ltp = priceMap[h.symbol]?.price || h.avgPrice;
        const cv = ltp * h.quantity;
        const inv = h.avgPrice * h.quantity;
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
    } catch {
      // Offline fallback
      res.json({
        balance: req.user.balance || 100000,
        initialBalance: 100000,
        totalInvested: 0,
        currentValue: 0,
        totalPnl: 0,
        totalPnlPct: 0,
        portfolioValue: req.user.balance || 100000,
        holdings: [],
      });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
