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

model = genai.GenerativeModel("gemini-1.5-flash")

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
        raise ValueError("Missing UPSTOX_ACCESS_TOKEN")

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
        raise ValueError(response.text)

    candles = response.json().get("data", {}).get("candles", [])

    if not candles:
        raise ValueError("No candle data")

    df = pd.DataFrame(
        candles,
        columns=["timestamp", "open", "high", "low", "close", "volume", "oi"]
    )

    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df.dropna(inplace=True)
    return df


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
    if not GEMINI_API_KEY:
        return {
            "signal": "HOLD",
            "confidence": 50,
            "reason": "No Gemini API key"
        }

    prompt = f"""
You are a professional stock market analyst.

Return ONLY valid JSON.

Data:
Price: {indicators['price']}
RSI: {indicators['rsi']}
MACD: {indicators['macd']}
MACD Signal: {indicators['macd_signal']}
Trend: {indicators['trend']}

Format:
{{
  "signal": "BUY | SELL | HOLD",
  "confidence": 0-100,
  "reason": "short explanation"
}}
"""

    try:
        res = model.generate_content(prompt)
        text = clean_json(res.text)

        return json.loads(text)

    except Exception as e:
        print("Gemini error:", e)

        return {
            "signal": "HOLD",
            "confidence": 50,
            "reason": "Fallback (AI error)"
        }


# ─────────────────────────────────────────
# MAIN SIGNAL ENGINE
# ─────────────────────────────────────────
def generate_signal(instrument_key: str):
    df = fetch_candles(instrument_key)
    indicators = compute_indicators(df)
    def rule_engine(ind):
     if ind["rsi"] < 30 and ind["trend"] == "UP":
        return "BUY"
     elif ind["rsi"] > 70 and ind["trend"] == "DOWN":
        return "SELL"
    return "HOLD"

    price = indicators["price"]

    return {
        "instrument_key": instrument_key,
        "signal": rule_engine(indicators),
        "confidence": 50,
        "reason": "Rule-based signal",
        "price": price,
        "target": round(price * 1.025, 2),
        "stopLoss": round(price * 0.985, 2),
        "indicators": indicators,
        "timestamp": datetime.utcnow().isoformat()
    }


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
    try:
        return {"signal": generate_signal(instrument_key)}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        return {"signal": generate_signal(req.instrument_key)}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/bulk-signals")
def bulk(symbols: List[str]):
    try:
        return {
            "signals": [generate_signal(s) for s in symbols[:10]],
            "time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ─────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)