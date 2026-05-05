const BULL_REASONS = [
  'RSI reversal from oversold zone (< 35)',
  'Bullish MACD crossover confirmed',
  'EMA 20 crossed above EMA 50',
  'Volume spike 2.8× above average',
  'Breakout above key resistance',
  'Bullish engulfing candle pattern',
  'Strong sector momentum (+3.2%)',
  'Support held at 200-day SMA',
  'Bollinger Band squeeze breakout',
  'Positive news sentiment score (+0.74)',
];

const BEAR_REASONS = [
  'RSI overbought zone (> 72), divergence',
  'MACD bearish crossover confirmed',
  'EMA 20 crossed below EMA 50',
  'Volume declining on price rally',
  'Resistance at 52-week high rejected',
  'Bearish engulfing candle on daily',
  'FII selling pressure detected',
  'Double top formation confirmed',
  'Break below key support level',
  'Negative news sentiment score (−0.61)',
];

export function generateClientSignal(symbol, price, changePct) {
  const rsi = 28 + Math.random() * 48;
  const macd = (Math.random() - 0.5) * 12;
  const ema = (Math.random() - 0.5);
  const vol = 0.5 + Math.random() * 3;
  const sentiment = (Math.random() - 0.5) * 2;

  let score = 0;
  if (rsi < 38) score += 2;
  if (rsi > 68) score -= 2;
  if (macd > 0) score += 1;
  if (ema > 0) score += 1;
  if (vol > 1.6 && score !== 0) score += score > 0 ? 1 : -1;
  if (sentiment > 0.3) score += 1;
  if (changePct > 0) score += 0.5;

  const isBull = score >= 0;
  const alignment = Math.min(Math.abs(score) / 5, 1);
  const confidence = Math.floor(58 + alignment * 38);

  const pool = isBull ? BULL_REASONS : BEAR_REASONS;
  const reasons = [...pool].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));

  const volatility = Math.abs(changePct || 1);
  const holdOptions = ['Intraday', '1 Day', '2–3 Days', '1 Week', 'Short Swing'];
  const holdIdx = volatility > 2 ? 0 : volatility > 1 ? 1 : volatility > 0.5 ? 2 : 3;

  const tgtPct = isBull ? 2 + Math.random() * 4 : -(2 + Math.random() * 4);
  const slPct = isBull ? -(1 + Math.random() * 2) : (1 + Math.random() * 2);

  return {
    symbol,
    signal: isBull ? 'BUY' : 'SELL',
    confidence,
    price: +Number(price).toFixed(2),
    target: +(price * (1 + tgtPct / 100)).toFixed(2),
    stopLoss: +(price * (1 + slPct / 100)).toFixed(2),
    holdTime: holdOptions[holdIdx],
    reasons,
    indicators: {
      rsi: +rsi.toFixed(1),
      macd: +macd.toFixed(2),
      ema: ema > 0 ? 'BULLISH' : 'BEARISH',
      volume: vol > 1.5 ? 'HIGH' : 'NORMAL',
      sentiment: sentiment > 0 ? 'POSITIVE' : 'NEGATIVE',
    },
    timestamp: new Date(),
  };
}
