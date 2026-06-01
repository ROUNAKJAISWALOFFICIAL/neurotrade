/**
 * routes/stocks.js
 * Real-time stock prices and historical candles via Upstox v2 REST API
 */

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const {
  getCurrentPrices,
  getPrice,
  getStockList,
  getStockBySymbol,
} = require('../services/priceSimulator');

const ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;

const upstox = axios.create({
  baseURL : 'https://api.upstox.com/v2',
  headers : {
    Authorization : `Bearer ${ACCESS_TOKEN}`,
    Accept        : 'application/json',
  },
});

router.get('/prices', async (req, res) => {
  try {
    const stocks = getStockList();

    const results = [];

    for (const [symbol, stock] of Object.entries(stocks)) {
      try {
        const response = await upstox.get('/market-quote/ltp', {
          params: {
            instrument_key: stock.instrumentKey,
          },
        });

        const dataKey = Object.keys(response.data.data)[0];

        const ltp =
          response.data.data[dataKey]?.last_price || stock.basePrice;

        results.push({
          symbol,
          price: ltp,
          open: stock.basePrice,
          high: ltp,
          low: ltp,
          prevClose: stock.basePrice,
          change: ltp - stock.basePrice,
          changePct:
            ((ltp - stock.basePrice) / stock.basePrice) * 100,
          volume: 0,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.log(`Failed ${symbol}`);

        results.push({
          symbol,
          price: stock.basePrice,
          open: stock.basePrice,
          high: stock.basePrice,
          low: stock.basePrice,
          prevClose: stock.basePrice,
          change: 0,
          changePct: 0,
          volume: 0,
          timestamp: Date.now(),
        });
      }
    }

    res.json({
      prices: results,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message,
    });
  }
});
// ─── GET /stocks/price/:symbol  ───────────────────────────────────────────────
router.get('/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  const price = getPrice(symbol);
  const stock = getStockBySymbol(symbol);
  if (!stock) return res.status(404).json({ error: 'Symbol not found' });
  res.json({ symbol, price: price || stock.basePrice, timestamp: Date.now() });
});

// ─── GET /stocks/list  ────────────────────────────────────────────────────────
router.get('/list', (req, res) => {
  const stocks = getStockList();
  res.json({ stocks });
});

// ─── GET /stocks/history/:symbol  ─────────────────────────────────────────────
// Fetches real OHLCV candles from Upstox historical candle API
router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { interval = '1D' } = req.query;

  const stock = getStockBySymbol(symbol);
  const instrumentKey = stock?.instrumentKey;
  if (!instrumentKey) return res.status(404).json({ error: 'Symbol or Instrument Key not found' });

  // Map frontend interval codes → Upstox interval strings
  const intervalMap = {
    '1m'  : '1minute',
    '5m'  : '5minute',
    '15m' : '15minute',
    '30m' : '30minute',
    '1h'  : '60minute',
    '1D'  : 'day',
    '1W'  : 'week',
  };

  const upstoxInterval = intervalMap[interval] || 'day';
  const isIntraday     = ['1minute','5minute','15minute','30minute','60minute'].includes(upstoxInterval);

  try {
    const today    = new Date();
    const toDate   = formatDate(today);
    const fromDate = formatDate(new Date(today - (isIntraday ? 7 : 365) * 86400000));

    const url = isIntraday
      ? `/historical-candle/intraday/${instrumentKey}/${upstoxInterval}`
      : `/historical-candle/${instrumentKey}/${upstoxInterval}/${fromDate}/${toDate}`;

    const { data } = await upstox.get(url);
    const rawCandles = data?.data?.candles || [];

    // Upstox format: [timestamp, open, high, low, close, volume, oi]
    const candles = rawCandles
      .map(c => ({
        time   : Math.floor(new Date(c[0]).getTime() / 1000),
        open   : +c[1],
        high   : +c[2],
        low    : +c[3],
        close  : +c[4],
        volume : +c[5],
      }))
      .sort((a, b) => a.time - b.time);

    res.json({ symbol, interval, candles });
  } catch (err) {
    console.error('[stocks/history] Upstox error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch historical data from Upstox', detail: err.message });
  }
});

// ─── GET /stocks/gainers  ─────────────────────────────────────────────────────
router.get('/gainers', (req, res) => {
  const sorted = getCurrentPrices()
    .filter(p => p.price > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 5);
  res.json({ gainers: sorted });
});

// ─── GET /stocks/losers  ──────────────────────────────────────────────────────
router.get('/losers', (req, res) => {
  const sorted = getCurrentPrices()
    .filter(p => p.price > 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 5);
  res.json({ losers: sorted });
});

// ─── GET /stocks/search  ──────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: [] });

  const stocks  = getStockList();
  const results = Object.entries(stocks)
    .filter(([sym]) =>
      sym.toLowerCase().includes(q.toLowerCase())
    )
    .map(([sym, info]) => ({ symbol: sym, ...info, price: getPrice(sym) }))
    .slice(0, 10);

  res.json({ results });
});

// ─── GET /stocks/quote/:symbol  ───────────────────────────────────────────────
// Live quote from Upstox REST (backup when WebSocket isn't connected)
router.get('/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const stock = getStockBySymbol(symbol);
  const instrumentKey = stock?.instrumentKey;
  if (!instrumentKey) return res.status(404).json({ error: 'Symbol or Instrument Key not found' });

  try {
    const { data } = await upstox.get('/market-quote/ltp', {
      params: { instrument_key: instrumentKey },
    });
    const ltp = data?.data?.[Object.keys(data.data)[0]]?.last_price || 0;
    res.json({ symbol, price: ltp, timestamp: Date.now() });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch live quote', detail: err.message });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatDate(d) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

module.exports = router;
