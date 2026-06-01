const express = require('express');
const router = express.Router();
const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Optional Gemini support (install with: npm install @google/generative-ai)
let genai = null;
try {
  if (GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genai = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log("✓ Gemini API enabled for news sentiment analysis");
  }
} catch (e) {
  console.log("ℹ Gemini SDK not installed. Using rule-based sentiment analysis.");
  console.log("  To enable Gemini: npm install @google/generative-ai");
}

// ─────────────────────────────────────────
// ENHANCED SENTIMENT ENGINE
// ─────────────────────────────────────────
function getSentiment(title = "", description = "") {
  const text = (title + " " + (description || "")).toLowerCase();

  let score = 0;
  let weightedScore = 0;

  // Strong bullish signals (weight: 2)
  const strongBullish = [
    "profit surge", "record high", "beats expectations",
    "strong growth", "bullish breakout", "upside potential",
    "rally", "surge", "jump", "strong performance", "outperform"
  ];

  // Moderate bullish signals (weight: 1)
  const bullishWords = [
    "profit", "surge", "rises", "gain", "beats",
    "growth", "strong", "upgrade", "buy", "positive",
    "expansion", "bullish", "outperform", "breakout", "upside",
    "rally", "jump", "recovery", "momentum", "trend strength"
  ];

  // Strong bearish signals (weight: -2)
  const strongBearish = [
    "market crash", "bankruptcy", "fraud scandal",
    "mass layoffs", "severe warning", "plunge",
    "collapse", "downgrade", "sell-off"
  ];

  // Moderate bearish signals (weight: -1)
  const bearishWords = [
    "loss", "falls", "drop", "decline", "crash",
    "downgrade", "lawsuit", "risk", "weak", "slowdown",
    "bearish", "inflation", "cut", "concern", "plunge",
    "bankrupt", "fraud", "warning", "losses", "slump",
    "concern", "uncertainty", "deficit", "miss"
  ];

  // Check strong signals first (higher weight)
  strongBullish.forEach(word => {
    if (text.includes(word)) weightedScore += 2;
  });

  strongBearish.forEach(word => {
    if (text.includes(word)) weightedScore -= 2;
  });

  // Then check moderate signals
  bullishWords.forEach(word => {
    if (text.includes(word) && !strongBullish.some(w => text.includes(w))) {
      weightedScore += 1;
      score += 1;
    }
  });

  bearishWords.forEach(word => {
    if (text.includes(word) && !strongBearish.some(w => text.includes(w))) {
      weightedScore -= 1;
      score -= 1;
    }
  });

  // Determine sentiment based on weighted score
  if (weightedScore >= 3) return "bullish";
  if (weightedScore <= -3) return "bearish";
  if (score >= 2) return "bullish";
  if (score <= -2) return "bearish";
  return "neutral";
}

// ─────────────────────────────────────────
// GEMINI-POWERED SENTIMENT (OPTIONAL)
// ─────────────────────────────────────────
async function getGeminiSentiment(headline, summary) {
  if (!GEMINI_API_KEY) {
    return null; // Fallback to rule-based
  }

  try {
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Analyze the sentiment of this market news in exactly ONE word: BULLISH, BEARISH, or NEUTRAL.

Headline: ${headline}
Summary: ${summary}

Response format: Just the word (BULLISH, BEARISH, or NEUTRAL) with a confidence percentage.
Example: BULLISH (85%)`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    // Parse response
    if (response.includes("BULLISH")) return "bullish";
    if (response.includes("BEARISH")) return "bearish";
    return "neutral";
  } catch (error) {
    console.log("Gemini sentiment error:", error.message);
    return null; // Fallback to rule-based
  }
}

// ─────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    console.log("Fetching market news from NewsAPI...");
    
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=stock market india&language=en&pageSize=20&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );

    const articles = response.data.articles || [];
    console.log(`Retrieved ${articles.length} articles`);

    const formatted = await Promise.all(
      articles.map(async (a, i) => {
        // Try Gemini first, fallback to rule-based
        let sentiment = await getGeminiSentiment(a.title, a.description);
        if (!sentiment) {
          sentiment = getSentiment(a.title, a.description);
        }

        let score = 0;
        if (sentiment === "bullish") score = 1;
        else if (sentiment === "bearish") score = -1;

        return {
          id: i + 1,
          headline: a.title || "No title",
          summary: a.description || "No description available",
          url: a.url || "",
          source: a.source?.name || "Unknown",
          publishedAt: a.publishedAt,
          time: new Date(a.publishedAt).toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          sentiment,
          score,
          symbol: 'NIFTY',
          sector: 'Market',
          image: a.urlToImage || null
        };
      })
    );

    // Sort by bullish score first
    formatted.sort((a, b) => b.score - a.score);

    console.log(`Sentiment breakdown: ${formatted.filter(n => n.sentiment === 'bullish').length} bullish, ${formatted.filter(n => n.sentiment === 'bearish').length} bearish`);

    res.json(formatted);

  } catch (err) {
    console.error("News API error:", err.message);

    res.status(500).json({
      error: 'Failed to fetch news',
      message: err.message
    });
  }
});

module.exports = router;