const axios = require('axios');

/**
 * Calls Python AI service (REAL logic lives there)
 */
async function generateSignalFromAI(symbol, priceChange = 0) {
  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze`,
      {
        instrument_key: symbol,
        priceChange: priceChange
      },
      {
        timeout: 8000
      }
    );

    return response.data.signal;

  } catch (err) {
    console.error("AI service error:", err.message);

    return {
      instrument_key: symbol,
      signal: "HOLD",
      confidence: 50,
      reason: "AI service unavailable",
      price: 0,
      target: 0,
      stopLoss: 0,
      holdTime: "N/A",
      indicators: {},
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { generateSignalFromAI };