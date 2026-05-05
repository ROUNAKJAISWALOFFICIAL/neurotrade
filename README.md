# TradeEdge — Premium Paper Trading Platform 🚀

A full-stack paper trading platform for Indian stocks (NSE/BSE) with live price simulation,
TradingView-quality charts, AI-generated buy/sell signals, and a premium dark-mode UI.

---

## 📁 Project Structure

```
tradeedge/
├── frontend/          ← React + Vite + TailwindCSS
├── backend/           ← Node.js + Express + Socket.IO
├── ai-service/        ← Python FastAPI (optional)
├── package.json       ← Root scripts
└── README.md
```

---

## ⚡ Quick Start (Recommended)

### Prerequisites
- **Node.js** v18 or higher → https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- **Python 3.9+** (optional, for AI service) → https://python.org

---

### Step 1 — Install dependencies

Open a terminal in the `tradeedge/` folder and run:

```bash
npm run install:all
```

This installs packages for root, frontend, and backend automatically.

---

### Step 2 — Configure environment (optional)

The app runs **without MongoDB** in offline/demo mode.

To enable MongoDB persistence, edit `backend/.env`:
```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/tradeedge
JWT_SECRET=change_this_to_a_random_secret
```

Get a free MongoDB Atlas cluster at → https://cloud.mongodb.com

---

### Step 3 — Run the app

**Option A: Run frontend + backend together**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

Then open → **http://localhost:5173**

---

### Step 4 — Run AI Service (optional)

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate it
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service (port 8000)
python main.py
```

---

## 🔑 Demo Login

The app **auto-logs you in** as a demo trader with **₹1,00,000** virtual balance.

Or use the login page with:
- Email: `demo@tradeedge.in`
- Password: `demo123`

---

## 🎮 Features

| Feature | Description |
|---------|-------------|
| 📊 Live Charts | TradingView Lightweight Charts with candlestick/line/area |
| 🔄 Real-time Prices | WebSocket-powered price updates every 1.5 seconds |
| 🤖 AI Signals | Buy/sell signals with confidence scores and technical analysis |
| 💼 Paper Trading | Full order execution with P&L tracking |
| 📰 News Feed | Market news with sentiment analysis |
| 📈 Portfolio | Live unrealised P&L across all holdings |
| 🎯 Watchlist | 15 NSE/BSE stocks monitored live |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend → Render
```
Build Command: npm install
Start Command: node src/server.js
Environment: Set MONGODB_URI and JWT_SECRET
```

### AI Service → Render (Python)
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Lightweight Charts, Zustand, Socket.IO
- **Backend**: Node.js, Express, Socket.IO, MongoDB (Mongoose), JWT auth
- **AI Service**: Python, FastAPI, pandas-ta, scikit-learn

---

## 📝 Notes

- Prices are **simulated** using Brownian motion (realistic feel, not real market data)
- For real NSE data, replace `priceSimulator.js` with Yahoo Finance / NSE API calls
- All trades are **paper trades** — no real money involved
- MongoDB is **optional** — app works fully in-memory without it

---

Made with ❤️ for the Indian trading community.
