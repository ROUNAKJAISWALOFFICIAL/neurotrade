# TradeEdge AI Service - Debugging Guide

## Error: 500 Internal Server Error on /signal/{instrument_key}

### Root Causes Fixed

#### 1. **Indentation Error in Python (CRITICAL - FIXED)**
**Problem:** The `rule_engine()` function had misaligned code causing syntax/runtime errors
```python
# ❌ WRONG - Before
def rule_engine(ind):
 if ind["rsi"] < 30:  # Wrong indentation
    return "BUY"
return "HOLD"  # Wrong level
```

**Solution:** Fixed indentation and moved function outside `generate_signal()`
```python
# ✓ CORRECT - After
def rule_engine(ind):
    """Proper indentation"""
    if ind["rsi"] < 30:
        return "BUY", confidence
    return "HOLD", 50
```

#### 2. **Gemini API Not Being Used (FIXED)**
**Problem:** `gemini_sentiment()` function was defined but never called
**Solution:** Integrated hybrid signal generation:
- Uses both rule-based engine AND Gemini AI
- Combines confidence scores when both agree
- Falls back gracefully if Gemini API fails

#### 3. **API URL Parameter Order (FIXED)**
**Problem:** Upstox URL had wrong parameter order
```python
# ❌ WRONG
url = f".../{today}/{from_date}"  # Wrong order

# ✓ CORRECT
url = f".../{from_date}/{today}"  # from_date first, then today
```

#### 4. **Missing Error Details**
**Problem:** Generic 500 errors without debugging info
**Solution:** Added comprehensive logging:
- Detailed error messages with context
- Request/response logging
- Stack traces in console
- Better exception handling

---

## Setup Requirements

### 1. Environment Variables (.env file)
Create a `.env` file in the `ai-service/` directory:

```env
# CRITICAL: Upstox API Token (required for real data)
UPSTOX_ACCESS_TOKEN=your_upstox_token_here

# OPTIONAL: Gemini API Key (for AI-powered decisions)
GEMINI_API_KEY=your_gemini_api_key_here

# Server settings
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
UVICORN_RELOAD=True
```

**How to get tokens:**
- **Upstox Token:** Login to https://upstox.com → API Console → Generate token
- **Gemini API Key:** Go to https://aistudio.google.com/app/apikeys → Create API key

### 2. Python Dependencies
Ensure all packages are installed:

```bash
cd ai-service
pip install -r requirements.txt
```

Expected packages in `requirements.txt`:
- fastapi
- uvicorn
- pandas
- httpx
- ta (technical analysis)
- google-generativeai
- python-dotenv

---

## Testing

### 1. Start the AI Service
```bash
cd ai-service
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 2. Test Health Endpoint
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "TradeEdge AI",
  "time": "2024-01-15T10:30:00.123456"
}
```

### 3. Test Signal Endpoint (with real data)
```bash
curl "http://localhost:8000/signal/NSE_EQ%7CINE002A01018"
```

The `%7C` is the URL-encoded pipe character `|`

Expected response:
```json
{
  "signal": {
    "instrument_key": "NSE_EQ|INE002A01018",
    "signal": "BUY",
    "confidence": 82,
    "reason": "Both Rule-based (65%) and AI (85%) agree: RSI oversold + bullish trend",
    "price": 3847.50,
    "target": 3942.56,
    "stopLoss": 3789.70,
    "indicators": {
      "price": 3847.50,
      "rsi": 28.45,
      "macd": 0.0234,
      "macd_signal": 0.0201,
      "trend": "UP"
    },
    "rule_signal": "BUY",
    "gemini_signal": "BUY",
    "timestamp": "2024-01-15T10:30:00.123456"
  }
}
```

### 4. Run Automated Tests
```bash
python test_api.py
```

This will test:
- Health endpoint
- Individual signals for multiple stocks
- Analyze endpoint
- Bulk signals endpoint

---

## Common Errors & Solutions

### Error: "Missing UPSTOX_ACCESS_TOKEN"
**Solution:** Add `UPSTOX_ACCESS_TOKEN` to `.env` file
```bash
# Check if .env exists and has the token
cat .env | grep UPSTOX_ACCESS_TOKEN
```

### Error: "No candle data"
**Solution:** Verify instrument key format. Example valid keys:
- `NSE_EQ|INE002A01018` (TCS)
- `NSE_EQ|INE040A01034` (HDFC Bank)
- `NSE_EQ|INE600B01024` (Reliance)

### Error: "Timeout connecting to Upstox API"
**Solution:** 
- Check internet connection
- Verify UPSTOX_ACCESS_TOKEN is valid
- Check if Upstox API is down: https://status.upstox.com

### Error: "Gemini API error"
**Solution:** 
- Verify GEMINI_API_KEY is correct
- Check if key is active: https://aistudio.google.com/app/apikeys
- Signal generation will fallback to rule-based if Gemini fails

---

## Understanding Signal Decisions

### How Signals Are Generated

1. **Fetch Real Data** (60 days of daily candles from Upstox)
2. **Calculate Indicators**
   - RSI: Momentum indicator (oversold <30, overbought >70)
   - MACD: Trend confirmation
   - EMA20/EMA50: Trend direction

3. **Rule-Based Decision**
   - BUY: RSI <30 + Uptrend OR MACD crossover
   - SELL: RSI >70 + Downtrend OR MACD crossover down
   - HOLD: Otherwise

4. **AI Decision** (Gemini)
   - Analyzes same indicators with financial context
   - Returns confidence score 0-100%

5. **Hybrid Decision**
   - If both agree: Increase confidence by 15%
   - If disagree: Use Gemini's decision (trusted more)

---

## News Sentiment Analysis

### Enhanced Sentiment Scoring

News is classified as:
- **BULLISH** (score: +1): Profit surge, growth, upgrades, strong performance
- **BEARISH** (score: -1): Losses, downgrades, risks, weak results
- **NEUTRAL** (score: 0): Balanced/mixed news

### Gemini Optional Enhancement
If `GEMINI_API_KEY` is set, news headlines are also analyzed by Gemini AI for more accurate sentiment.

To enable:
```bash
npm install @google/generative-ai
```

---

## Performance Notes

- **Signal Generation:** 3-8 seconds per stock (depends on network)
- **Bulk Signals:** Up to 10 stocks, ~1-2 minutes total
- **Recommended:** Use signals for portfolio rebalancing, not high-frequency trading

---

## Next Steps

1. ✓ Verify `.env` file has both API tokens
2. ✓ Start AI service: `python -m uvicorn main:app --reload`
3. ✓ Run tests: `python test_api.py`
4. ✓ Check backend can call `/signal/{instrument_key}`
5. ✓ Frontend displays real signals with Gemini decisions

