# Gemini API Integration Guide

## Overview

The TradeEdge AI service now uses Google's Gemini API for intelligent trading signal generation. It combines rule-based technical analysis with AI-powered decision making for better accuracy.

---

## How Gemini API Works in TradeEdge

### 1. **Signal Generation Process**

```
Real Market Data (Upstox API)
        ↓
Calculate Technical Indicators (RSI, MACD, EMA)
        ↓
    ┌───────────────────────┐
    │  SPLIT INTO TWO PATHS │
    └───────────────────────┘
         ↙                    ↘
    Rule-Based              Gemini AI
    Analysis               Analysis
         ↓                    ↓
   Generate Signal       Generate Signal
   + Confidence          + Confidence
         ↓                    ↓
    ┌───────────────────────┐
    │  COMBINE DECISIONS   │
    └───────────────────────┘
         ↓
    Final Signal
    (BUY/SELL/HOLD)
    + Confidence Score
```

### 2. **Rule-Based Analysis** (Always Works)
```python
if RSI < 30 AND Trend is UP:
    Signal = BUY (65% confidence)
elif RSI > 70 AND Trend is DOWN:
    Signal = SELL (65% confidence)
elif MACD crosses above signal:
    Signal = BUY (55% confidence)
else:
    Signal = HOLD (50% confidence)
```

### 3. **Gemini AI Analysis** (More Sophisticated)

Gemini receives:
- Current price
- RSI value (momentum)
- MACD and signal line (trend confirmation)
- Current trend (bullish/bearish)

Gemini decides:
- BUY: When indicators suggest buying opportunity
- SELL: When indicators suggest selling opportunity
- HOLD: When unclear or balanced

Gemini provides:
- Signal (BUY/SELL/HOLD)
- Confidence (0-100%)
- Detailed reason

---

## Example: How Gemini Analyzes a Signal

### Input Data to Gemini:
```
Price: $3847.50
RSI (14): 28.45 (Oversold - strong buy signal)
MACD: 0.0234
MACD Signal: 0.0201
Trend: UP (EMA20 > EMA50 - bullish)
```

### Gemini Analyzes:
```
"RSI is 28.45, which is OVERSOLD (<30), indicating:
  - Strong buying pressure
  - Likely bounce back or reversal
  - NOT overvalued

MACD is above signal line (0.0234 > 0.0201):
  - Bullish crossover confirmed
  - Momentum favors buyers

Trend is UP (EMA20 > EMA50):
  - Price above moving averages
  - Established uptrend

FINAL DECISION: BUY
  - RSI oversold + Uptrend = Strong buy signal
  - Confidence: 85%"
```

### Final TradeEdge Response:
```json
{
  "signal": "BUY",
  "confidence": 85,
  "reason": "Both Rule-based (65%) and AI (85%) agree: RSI oversold + bullish trend",
  "rule_signal": "BUY",
  "gemini_signal": "BUY"
}
```

When both agree → Confidence boosted to 85% (instead of average 75%)

---

## Confidence Score Calculation

### When Both Signals Agree:
```
Final Confidence = Average(rule_confidence, gemini_confidence) + 15
Maximum = 95%

Example:
  Rule: 65% + Gemini: 85% = (65+85)/2 + 15 = 75 + 15 = 90%
```

### When Signals Disagree:
```
Final Signal = Gemini Signal (AI given priority)
Final Confidence = Gemini Confidence

Reason: Gemini has more context and reasoning capability
```

---

## Gemini Prompt Used

```python
You are a professional stock market analyst.

Based on technical indicators, provide a BUY, SELL, or HOLD signal.

Indicators:
- Price: {price}
- RSI (14): {rsi}
- MACD: {macd}
- MACD Signal: {macd_signal}
- Trend: {trend}

Rules:
1. RSI < 30 AND UP Trend → BUY (80-95% confidence)
2. RSI > 70 AND DOWN Trend → SELL (80-95% confidence)
3. MACD crosses above signal → BUY (60-75% confidence)
4. MACD crosses below signal → SELL (60-75% confidence)
5. Otherwise → HOLD (40-60% confidence)

Return ONLY valid JSON:
{
  "signal": "BUY",
  "confidence": 85,
  "reason": "brief explanation"
}
```

---

## Error Handling

### If Gemini API Fails:
1. **Fallback Strategy**: Uses rule-based signal only
2. **Message**: "AI error: {error description}"
3. **Confidence**: Reduced appropriately
4. **Service**: Continues working without Gemini

```python
try:
    gemini_result = gemini_sentiment(indicators)
except Exception as e:
    # Fallback to rule-based only
    gemini_result = {
        "signal": "HOLD",
        "confidence": 50,
        "reason": f"AI error: {str(e)[:50]}"
    }
```

### Common Gemini Failures & Handling:
- **Invalid API Key** → Uses rule-based signal
- **Network Timeout** → Logs warning, continues
- **Rate Limit** → Waits and retries
- **Invalid Response** → Parses and validates JSON

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| API Call Time | 2-5 seconds |
| Indicator Calculation | <1 second |
| Gemini Response | 1-3 seconds |
| Total Signal Time | 3-8 seconds |
| Fallback (no Gemini) | 1-2 seconds |

---

## Advantages of Hybrid Approach

### Rule-Based Only (Old):
- ✅ Fast (1-2 seconds)
- ❌ Limited decision-making
- ❌ No context understanding
- ❌ No explanations

### Gemini Only (Not Used):
- ✅ Intelligent
- ✅ Context-aware
- ❌ Slower
- ❌ Can fail if API down

### Hybrid (Current):
- ✅ Fast (3-8 seconds)
- ✅ Intelligent (Gemini analysis)
- ✅ Reliable (fallback to rules)
- ✅ Explained (reasoning from both)
- ✅ Increased confidence (when both agree)

---

## Testing Gemini Integration

### Test 1: Verify Gemini Response
```bash
curl "http://localhost:8000/signal/NSE_EQ%7CINE002A01018"
```

Look for in response:
- `"gemini_signal"`: Should be BUY/SELL/HOLD
- `"rule_signal"`: Should match or differ
- `"confidence"`: Should be 0-100

### Test 2: Check Agreement
```bash
# If both are same → Confidence boosted
# If different → Gemini takes priority, confidence = Gemini confidence
```

### Test 3: Monitor Logs
```bash
# Watch for these lines in console:
"✓ Both Rule-based (65%) and AI (85%) agree"
"Gemini decision: BUY (85%)"
```

### Test 4: Run Test Suite
```bash
python test_api.py
```

---

## Disabling Gemini (If Needed)

If you want to use only rule-based signals:

1. **Don't set GEMINI_API_KEY** in `.env`
2. Gemini will be skipped automatically
3. Signals will use rule-based engine only
4. Speed: 1-2 seconds (faster)

```python
if not GEMINI_API_KEY:
    # Gemini not available
    return {
        "signal": "HOLD",
        "confidence": 50,
        "reason": "No Gemini API key - using rule-based"
    }
```

---

## Future Enhancements

1. **Machine Learning**: Train model on historical signals
2. **Sentiment Analysis**: Include news sentiment in decisions
3. **Risk Assessment**: Calculate risk-adjusted confidence
4. **Backtesting**: Test strategies on historical data
5. **Multi-timeframe**: Combine different timeframe signals

---

## Troubleshooting

### Issue: Gemini API always returns HOLD
**Solution**: Check prompt clarity, verify API key validity

### Issue: Confidence too low
**Solution**: Adjust confidence calculation weights

### Issue: Signals not matching market reality
**Solution**: Check indicator parameters, backtest on historical data

### Issue: API timeout
**Solution**: Increase timeout (currently 15s), check network

---

## Resources

- **Upstox API Docs**: https://upstox.com/developer
- **Gemini API Docs**: https://ai.google.dev
- **Technical Analysis**: https://en.wikipedia.org/wiki/Technical_analysis
- **RSI Indicator**: https://en.wikipedia.org/wiki/Relative_strength_index
- **MACD Indicator**: https://en.wikipedia.org/wiki/MACD
