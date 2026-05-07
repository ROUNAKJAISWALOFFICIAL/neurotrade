const express = require('express');
const router = express.Router();
const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// ─────────────────────────────────────────
// SIMPLE SENTIMENT ENGINE (FIX)
// ─────────────────────────────────────────
function getSentiment(title = "", description = "") {
  const text = (title + " " + (description || "")).toLowerCase();

  let score = 0;

  const bullishWords = [
    "profit", "surge", "rises", "gain", "record high",
    "beats", "growth", "strong", "upgrade", "buy",
    "rally", "jump", "positive", "expansion", "bullish",
    "outperform", "breakout", "upside"
  ];

  const bearishWords = [
    "loss", "falls", "drop", "decline", "crash",
    "downgrade", "lawsuit", "risk", "weak", "slowdown",
    "bearish", "inflation", "cut", "concern", "plunge",
    "bankrupt", "fraud", "warning"
  ];

  bullishWords.forEach(word => {
    if (text.includes(word)) score += 1;
  });

  bearishWords.forEach(word => {
    if (text.includes(word)) score -= 1;
  });

  if (score >= 2) return "bullish";
  if (score <= -2) return "bearish";
  return "neutral";
}

// ─────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=stock market india&language=en&pageSize=15&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );

    const articles = response.data.articles || [];

    const formatted = articles.map((a, i) => {
      const sentiment = getSentiment(a.title, a.description);

      let score = 0;
      if (sentiment === "bullish") score = 1;
      else if (sentiment === "bearish") score = -1;

      return {
        id: i + 1,
        headline: a.title || "No title",
        summary: a.description || "No description available",
        source: a.source?.name || "Unknown",
        time: new Date(a.publishedAt).toLocaleTimeString(),
        sentiment,
        score,
        symbol: 'NIFTY',
        sector: 'Market'
      };
    });

    res.json(formatted);

  } catch (err) {
    console.log("News API error:", err.message);

    res.status(500).json({
      error: 'Failed to fetch news'
    });
  }
});

module.exports = router;