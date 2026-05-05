// AI Signal Generation Service
// Generates technical analysis signals based on simulated indicator data
// In production, this calls the Python FastAPI microservice

const axios = require('axios');

const SIGNAL_REASONS_BULL = [
  'RSI reversal from oversold zone (< 35)',
  'Bullish MACD crossover confirmed',
  'EMA 20 crossed above EMA 50',
  'Volume spike 2.8x above average',
  'Breakout above key resistance level',
  'Bullish engulfing candle on daily chart',
  'Strong sector momentum (+3.2%)',
  'Positive institutional buying detected',
  'Support held at 200-day SMA',
  'Bollinger Band squeeze breakout upward',
];

const SIGNAL_REASONS_BEAR = [
  'RSI overbought zone (> 70), divergence forming',
  'MACD bearish crossover confirmed',
  'Death cross: EMA 20 below EMA 50',
  'Volume declining on price rally',
  'Resistance at 52-week high rejected',
  'Bearish engulfing candle pattern',
  'Sector weakness, FII selling pressure',
  'Double top pattern forming',
  'Break below key support level',
  'Negative news sentiment score (-0.62)',
];

const HOLD_TIMES = [
  { label: 'Intraday', maxHours: 8 },
  { label: '1 Day', maxHours: 24 },
  { label: '2–3 Days', maxHours: 72 },
  { label: '1 Week', maxHours: 168 },
  { label: 'Short Swing (2W)', maxHours: 336 },
];

function generateSignal(symbol, price, priceChange) {
  try {
    // Simulate technical indicators
    const rsi = 30 + Math.random() * 50;
    const macdSignal = (Math.random() - 0.5) * 10;
    const emaSignal = (Math.random() - 0.5);
    const volumeRatio = 0.5 + Math.random() * 3;
    const sentimentScore = (Math.random() - 0.5) * 2;

    // Determine signal direction
    let bullScore = 0;
    if (rsi < 40) bullScore += 2;
    if (rsi > 65) bullScore -= 2;
    if (macdSignal > 0) bullScore += 1;
    if (emaSignal > 0) bullScore += 1;
    if (volumeRatio > 1.5) bullScore += Math.abs(bullScore) > 0 ? 1 : -1;
    if (sentimentScore > 0.3) bullScore += 1;
    if (priceChange > 0) bullScore += 0.5;

    const isBullish = bullScore > 0;

    // Confidence score based on alignment
    const alignment = Math.min(Math.abs(bullScore) / 5, 1);
    const confidence = Math.floor(55 + alignment * 40);

    // Select reasons
    const pool = isBullish ? SIGNAL_REASONS_BULL : SIGNAL_REASONS_BEAR;
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const reasons = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

    // Hold time based on volatility
    const volatility = Math.abs(priceChange);
    let holdIndex = 0;
    if (volatility < 0.5) holdIndex = 3;
    else if (volatility < 1) holdIndex = 2;
    else if (volatility < 2) holdIndex = 1;
    else holdIndex = 0;

    // Target and stop loss
    const targetPct = isBullish ? 2 + Math.random() * 4 : -(2 + Math.random() * 4);
    const stopPct = isBullish ? -(1 + Math.random() * 2) : (1 + Math.random() * 2);

    return {
      symbol,
      signal: isBullish ? 'BUY' : 'SELL',
      confidence,
      price: +price.toFixed(2),
      target: +(price * (1 + targetPct / 100)).toFixed(2),
      stopLoss: +(price * (1 + stopPct / 100)).toFixed(2),
      holdTime: HOLD_TIMES[holdIndex].label,
      reasons,
      indicators: {
        rsi: +rsi.toFixed(1),
        macd: +macdSignal.toFixed(2),
        ema: emaSignal > 0 ? 'BULLISH' : 'BEARISH',
        volume: volumeRatio > 1.5 ? 'HIGH' : 'NORMAL',
        sentiment: sentimentScore > 0 ? 'POSITIVE' : 'NEGATIVE',
        sentimentScore: +sentimentScore.toFixed(2),
      },
      timestamp: new Date(),
    };
  } catch (err) {
    console.error('Signal generation error:', err);
    return null;
  }
}

async function generateSignalFromAI(symbol, price, priceChange) {
  // Try Python AI service first
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/analyze`, {
      symbol, price, priceChange,
    }, { timeout: 3000 });
    return response.data;
  } catch {
    // Fallback to local JS generation
    return generateSignal(symbol, price, priceChange);
  }
}

module.exports = { generateSignal, generateSignalFromAI };
