const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

let Watchlist;
try { Watchlist = require('../models/Watchlist'); } catch {}

const memWatchlists = {};

const DEFAULT_WATCHLIST = [
  { symbol: 'RELIANCE.NS', stockName: 'Reliance Industries', exchange: 'NSE', sector: 'Energy' },
  { symbol: 'TCS.NS', stockName: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT' },
  { symbol: 'INFY.NS', stockName: 'Infosys Ltd', exchange: 'NSE', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', stockName: 'HDFC Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BAJFINANCE.NS', stockName: 'Bajaj Finance', exchange: 'NSE', sector: 'Finance' },
];

// Get watchlist
router.get('/', auth, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    try {
      const items = await Watchlist.find({ userId });
      res.json({ watchlist: items });
    } catch {
      res.json({ watchlist: memWatchlists[userId] || DEFAULT_WATCHLIST });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add to watchlist
router.post('/', auth, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const { symbol, stockName, exchange, sector } = req.body;
    try {
      const item = await Watchlist.create({ userId, symbol, stockName, exchange, sector });
      res.status(201).json({ item });
    } catch {
      if (!memWatchlists[userId]) memWatchlists[userId] = [...DEFAULT_WATCHLIST];
      const exists = memWatchlists[userId].find(i => i.symbol === symbol);
      if (!exists) memWatchlists[userId].push({ symbol, stockName, exchange, sector });
      res.status(201).json({ item: { symbol, stockName, exchange, sector } });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Remove from watchlist
router.delete('/:symbol', auth, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const { symbol } = req.params;
    try {
      await Watchlist.findOneAndDelete({ userId, symbol });
    } catch {
      if (memWatchlists[userId]) {
        memWatchlists[userId] = memWatchlists[userId].filter(i => i.symbol !== symbol);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
