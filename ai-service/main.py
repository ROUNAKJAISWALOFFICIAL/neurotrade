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

load_dotenv()

ACCESS_TOKEN = os.getenv("UPSTOX_ACCESS_TOKEN")

app = FastAPI(title="TradeEdge AI Service", version="3.0.0")

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
# Models
# ─────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    instrument_key: str
    priceChange: Optional[float] = 0.0


# ─────────────────────────────────────────
# Fetch Candle Data (Upstox)
# ─────────────────────────────────────────
def fetch_candles(instrument_key: str):
    if not ACCESS_TOKEN:
        raise ValueError("Missing UPSTOX_ACCESS_TOKEN in .env")

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

    response = httpx.get(url, headers=headers)

    if response.status_code != 200:
        raise ValueError(f"Upstox API Error: {response.text}")

    result = response.json()

    candles = result.get("data", {}).get("candles", [])

    if not candles:
        raise ValueError("No candle data received")

    df = pd.DataFrame(
        candles,
        columns=["timestamp", "open", "high", "low", "close", "volume", "oi"]
    )

    # Convert numeric
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df.dropna(inplace=True)

    return df


# ─────────────────────────────────────────
# Indicator Calculation
# ─────────────────────────────────────────
def compute_indicators(df: pd.DataFrame):
    close = df["close"]

    rsi_series = RSIIndicator(close).rsi()
    macd_obj = MACD(close)

    df["rsi"] = rsi_series
    df["macd"] = macd_obj.macd()
    df["macd_signal"] = macd_obj.macd_signal()
    df["ema20"] = EMAIndicator(close, window=20).ema_indicator()
    df["ema50"] = EMAIndicator(close, window=50).ema_indicator()

    df["vol_avg"] = df["volume"].rolling(20).mean()

    latest = df.iloc[-1]

    vol_ratio = latest["volume"] / latest["vol_avg"] if latest["vol_avg"] else 1

    return {
        "price": round(float(latest["close"]), 2),
        "rsi": round(float(latest["rsi"]), 1),
        "macd": round(float(latest["macd"]), 2),
        "macd_signal": round(float(latest["macd_signal"]), 2),
        "ema_signal": 1 if latest["ema20"] > latest["ema50"] else -1,
        "vol_ratio": round(float(vol_ratio), 2)
    }


# ─────────────────────────────────────────
# Signal Logic (Improved)
# ─────────────────────────────────────────
def generate_signal(instrument_key: str):
    df = fetch_candles(instrument_key)
    ind = compute_indicators(df)

    score = 0
    reasons = []

    # RSI
    if ind["rsi"] < 35:
        score += 2
        reasons.append("RSI oversold")
    elif ind["rsi"] > 70:
        score -= 2
        reasons.append("RSI overbought")

    # MACD
    if ind["macd"] > ind["macd_signal"]:
        score += 1
        reasons.append("MACD bullish crossover")
    else:
        score -= 1
        reasons.append("MACD bearish crossover")

    # EMA Trend
    if ind["ema_signal"] > 0:
        score += 1
        reasons.append("EMA 20 above EMA 50 (Uptrend)")
    else:
        score -= 1
        reasons.append("EMA 20 below EMA 50 (Downtrend)")

    # Volume confirmation
    if ind["vol_ratio"] > 1.5:
        score += 1
        reasons.append("High volume confirmation")

    # Final Signal
    if score >= 2:
        signal = "BUY"
    elif score <= -2:
     signal = "SELL"
    else:
     signal = "HOLD"

    price = ind["price"]

    # Better risk management
    target_pct = 2.5 if signal == "BUY" else -2.5
    stop_pct = -1.2 if signal == "BUY" else 1.2

    confidence = min(95, 55 + abs(score) * 10)

    return {
        "instrument_key": instrument_key,
        "signal": signal,
        "confidence": confidence,
        "price": price,
        "target": round(price * (1 + target_pct / 100), 2),
        "stopLoss": round(price * (1 + stop_pct / 100), 2),
        "holdTime": "1-3 Days",
        "reasons": reasons,
        "indicators": ind,
        "timestamp": datetime.utcnow().isoformat()
    }


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "TradeEdge AI",
        "time": datetime.utcnow().isoformat()
    }


@app.get("/signal/{instrument_key}")
def get_signal(instrument_key: str):
    try:
        return {"signal": generate_signal(instrument_key)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        return {"signal": generate_signal(req.instrument_key)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bulk-signals")
def bulk_signals(symbols: List[str]):
    try:
        results = [generate_signal(sym) for sym in symbols[:10]]
        return {
            "signals": results,
            "generatedAt": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────
# Run Server
# ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)