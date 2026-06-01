from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import Optional, List
import pandas as pd
import httpx
from ta.momentum import RSIIndicator
from ta.trend import MACD, EMAIndicator
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
import re

load_dotenv()

# ─────────────────────────────────────────
# ENV
# ─────────────────────────────────────────
ACCESS_TOKEN = os.getenv("UPSTOX_ACCESS_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI(title="TradeEdge AI Service", version="4.0.0")

# ─────────────────────────────────────────
# CORS
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    instrument_key: str
    priceChange: Optional[float] = 0.0


# ─────────────────────────────────────────
# FETCH CANDLES
# ─────────────────────────────────────────
def fetch_candles(instrument_key: str):
    if not ACCESS_TOKEN:
        raise ValueError("CRITICAL: Missing UPSTOX_ACCESS_TOKEN in environment")

    try:
        today = date.today()
        from_date = today - timedelta(days=60)

        url = (
            f"https://api.upstox.com/v2/historical-candle/"
            f"{instrument_key}/day/{today}/{from_date}"
        )

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {ACCESS_TOKEN}"
        }

        print(f"Fetching candles: {instrument_key} from {from_date} to {today}")
        response = httpx.get(url, headers=headers, timeout=10.0)

        if response.status_code != 200:
            error_msg = f"Upstox API error: {response.status_code} - {response.text[:500]}"
            print(f"ERROR: {error_msg}")
            raise ValueError(error_msg)

        data = response.json()
        
        if data.get("status") != "success":
            error_msg = f"API returned non-success status: {data.get('status')} - {data.get('errors', 'Unknown error')}"
            print(f"ERROR: {error_msg}")
            raise ValueError(error_msg)

        candles = data.get("data", {}).get("candles", [])

        if not candles:
            raise ValueError(f"No candle data available for {instrument_key}")

        print(f"Successfully fetched {len(candles)} candles for {instrument_key}")

        df = pd.DataFrame(
            candles,
            columns=["timestamp", "open", "high", "low", "close", "volume", "oi"]
        )

        # Convert to numeric, handling any conversion errors
        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        initial_count = len(df)
        df.dropna(inplace=True)
        
        if len(df) < 10:
            raise ValueError(f"Not enough valid data points: {len(df)} (dropped {initial_count - len(df)})")

        print(f"DataFrame ready: {len(df)} rows with valid OHLCV data")
        return df
        
    except httpx.TimeoutException:
        raise ValueError(f"Timeout connecting to Upstox API for {instrument_key}")
    except httpx.RequestError as e:
        raise ValueError(f"Network error connecting to Upstox API: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error fetching candles for {instrument_key}: {str(e)}")


# ─────────────────────────────────────────
# INDICATORS
# ─────────────────────────────────────────
def compute_indicators(df):
    close = df["close"]

    rsi = RSIIndicator(close).rsi()
    macd = MACD(close)

    df["rsi"] = rsi
    df["macd"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()
    df["ema20"] = EMAIndicator(close, 20).ema_indicator()
    df["ema50"] = EMAIndicator(close, 50).ema_indicator()

    latest = df.iloc[-1]

    return {
        "price": float(latest["close"]),
        "rsi": float(latest["rsi"]),
        "macd": float(latest["macd"]),
        "macd_signal": float(latest["macd_signal"]),
        "trend": "UP" if latest["ema20"] > latest["ema50"] else "DOWN"
    }


# ─────────────────────────────────────────
# SAFE GEMINI PARSER
# ─────────────────────────────────────────
def clean_json(text: str):
    text = text.strip()

    # remove markdown
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)

    return text.strip()


def gemini_sentiment(indicators):
    """Get AI-powered sentiment analysis from Gemini"""
    if not GEMINI_API_KEY:
        print("WARNING: No Gemini API key configured")
        return {
            "signal": "HOLD",
            "confidence": 50,
            "reason": "No Gemini API key available"
        }

    prompt = f"""You are a professional stock market analyst with expertise in technical analysis.

Based on the following technical indicators, provide a BUY, SELL, or HOLD signal with high confidence.

Technical Indicators:
- Current Price: {indicators['price']:.2f}
- RSI (14): {indicators['rsi']:.2f} (Oversold <30, Overbought >70)
- MACD: {indicators['macd']:.4f}
- MACD Signal Line: {indicators['macd_signal']:.4f}
- Trend: {indicators['trend']} (EMA20 {'>' if indicators['trend'] == 'UP' else '<'} EMA50)

Rules to follow:
1. If RSI < 30 AND Trend is UP: Strong BUY signal (80-95% confidence)
2. If RSI > 70 AND Trend is DOWN: Strong SELL signal (80-95% confidence)
3. If MACD crosses above signal line: BUY (60-75% confidence)
4. If MACD crosses below signal line: SELL (60-75% confidence)
5. Otherwise: HOLD (40-60% confidence)

Return ONLY valid JSON (no markdown, no extra text):
{{
  "signal": "BUY",
  "confidence": 85,
  "reason": "RSI oversold + bullish trend"
}}"""

    try:
        res = model.generate_content(prompt)
        text = clean_json(res.text)
        
        # Parse JSON response
        result = json.loads(text)
        
        # Validate response structure
        if "signal" not in result or "confidence" not in result:
            print(f"Invalid Gemini response structure: {result}")
            return {
                "signal": "HOLD",
                "confidence": 50,
                "reason": "Invalid AI response format"
            }
        
        # Ensure confidence is within bounds
        result["confidence"] = max(0, min(100, result["confidence"]))
        result["reason"] = result.get("reason", "AI analysis complete")
        
        print(f"Gemini decision: {result['signal']} ({result['confidence']}%) - {result['reason']}")
        return result

    except json.JSONDecodeError as e:
        print(f"JSON parse error from Gemini: {e}")
        return {
            "signal": "HOLD",
            "confidence": 50,
            "reason": "AI response parsing error"
        }
    except Exception as e:
        print(f"Gemini API error: {type(e).__name__}: {str(e)}")
        return {
            "signal": "HOLD",
            "confidence": 50,
            "reason": f"AI error: {str(e)[:50]}"
        }


# ─────────────────────────────────────────
# RULE-BASED ENGINE
# ─────────────────────────────────────────
def rule_engine(ind):
    """Basic rule-based signal generation"""
    if ind["rsi"] < 30 and ind["trend"] == "UP":
        return "BUY", 65
    elif ind["rsi"] > 70 and ind["trend"] == "DOWN":
        return "SELL", 65
    elif ind["macd"] > ind["macd_signal"] and ind["trend"] == "UP":
        return "BUY", 55
    elif ind["macd"] < ind["macd_signal"] and ind["trend"] == "DOWN":
        return "SELL", 55
    return "HOLD", 50


# ─────────────────────────────────────────
# MAIN SIGNAL ENGINE
# ─────────────────────────────────────────
def generate_signal(instrument_key: str):
    try:
        # Fetch real data from Upstox
        df = fetch_candles(instrument_key)
        indicators = compute_indicators(df)
        price = indicators["price"]
        
        # Get rule-based signal
        rule_signal, rule_confidence = rule_engine(indicators)
        
        # Get Gemini AI analysis
        gemini_result = gemini_sentiment(indicators)
        gemini_signal = gemini_result.get("signal", "HOLD")
        gemini_confidence = gemini_result.get("confidence", 50)
        gemini_reason = gemini_result.get("reason", "")
        
        # Hybrid approach: Weight both signals
        # If both agree, increase confidence
        if rule_signal == gemini_signal:
            final_signal = rule_signal
            final_confidence = min(95, (rule_confidence + gemini_confidence) // 2 + 15)
            reason = f"Both Rule-based ({rule_confidence}%) and AI ({gemini_confidence}%) agree: {gemini_reason}"
        else:
            # Give more weight to Gemini for final decision
            final_signal = gemini_signal
            final_confidence = gemini_confidence
            reason = f"AI Analysis: {gemini_reason} (Rule suggested: {rule_signal})"
        
        return {
            "instrument_key": instrument_key,
            "signal": final_signal,
            "confidence": final_confidence,
            "reason": reason,
            "price": price,
            "target": round(price * 1.025, 2),
            "stopLoss": round(price * 0.985, 2),
            "indicators": indicators,
            "rule_signal": rule_signal,
            "gemini_signal": gemini_signal,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Signal generation error for {instrument_key}: {str(e)}")
        raise


# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "TradeEdge AI",
        "time": datetime.utcnow().isoformat()
    }


@app.get("/signal/{instrument_key}")
def signal(instrument_key: str):
    """Get trading signal for a specific instrument"""
    print(f"\n{'='*60}")
    print(f"REQUEST: /signal/{instrument_key}")
    try:
        result = generate_signal(instrument_key)
        print(f"SUCCESS: Generated signal for {instrument_key}")
        print(f"{'='*60}\n")
        return {"signal": result}
    except ValueError as e:
        error_msg = str(e)
        print(f"VALIDATION ERROR: {error_msg}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"SERVER ERROR: {error_msg}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Analyze stock with provided instrument key"""
    print(f"\n{'='*60}")
    print(f"REQUEST: POST /analyze - {req.instrument_key}")
    try:
        result = generate_signal(req.instrument_key)
        print(f"SUCCESS: Analysis complete for {req.instrument_key}")
        print(f"{'='*60}\n")
        return {"signal": result}
    except ValueError as e:
        error_msg = str(e)
        print(f"VALIDATION ERROR: {error_msg}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"SERVER ERROR: {error_msg}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/bulk-signals")
def bulk(symbols: List[str]):
    """Get signals for multiple symbols"""
    print(f"\n{'='*60}")
    print(f"REQUEST: POST /bulk-signals - {len(symbols)} symbols")
    try:
        signals = []
        for symbol in symbols[:10]:
            try:
                signal_result = generate_signal(symbol)
                signals.append(signal_result)
            except Exception as e:
                print(f"Warning: Failed to generate signal for {symbol}: {str(e)}")
                signals.append({
                    "instrument_key": symbol,
                    "signal": "ERROR",
                    "confidence": 0,
                    "reason": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        print(f"SUCCESS: Generated {len(signals)} signals")
        print(f"{'='*60}\n")
        return {
            "signals": signals,
            "count": len(signals),
            "time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"SERVER ERROR: {error_msg}")
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=error_msg)


# ─────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)