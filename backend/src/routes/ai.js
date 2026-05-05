const express = require('express');
const router = express.Router();
const axios = require('axios');

const {
  getPrice,
  getCurrentPrices,
  getStockBySymbol
} = require('../services/priceSimulator');


// ✅ Get signal for a single symbol (FROM PYTHON AI)
router.get('/signal/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = getStockBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const instrumentKey = stock.instrumentKey;
    const livePrice = getPrice(symbol) || stock.basePrice;

    // 🔥 Call Python AI
    const response = await axios.get(
      `http://localhost:8000/signal/${instrumentKey}`
    );

    const aiSignal = response.data.signal;

    // ✅ Final formatted response
    res.json({
      signal: {
        ...aiSignal,
        symbol: symbol,           // RELIANCE.NS
        name: stock.name,         // Reliance Industries
        price: livePrice          // Live price from simulator
      }
    });

  } catch (err) {
    console.error("AI ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch AI signal" });
  }
});


// ✅ Get signals for multiple stocks
router.get('/signals', async (req, res) => {
  try {
    const prices = getCurrentPrices().slice(0, 6);

    const results = [];

    for (const p of prices) {
      const stock = getStockBySymbol(p.symbol);
      if (!stock) continue;

      try {
        const response = await axios.get(
          `http://localhost:8000/signal/${stock.instrumentKey}`
        );

        results.push({
          ...response.data.signal,
          symbol: p.symbol,
          name: stock.name,
          price: p.price
        });

      } catch (err) {
        console.error(`Error fetching AI for ${p.symbol}`);
      }
    }

    res.json({
      signals: results,
      generatedAt: new Date()
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});


// ✅ Analyze custom input (manual trigger)
router.post('/analyze', async (req, res) => {
  try {
    const { symbol } = req.body;

    const stock = getStockBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const instrumentKey = stock.instrumentKey;

    const response = await axios.get(
      `http://localhost:8000/signal/${instrumentKey}`
    );

    res.json({
      signal: {
        ...response.data.signal,
        symbol: symbol,
        name: stock.name
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

module.exports = router;