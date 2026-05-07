// priceSimulator.js -> Live Price Feed Service using Upstox
const axios = require("axios");

const STOCKS = {
  "RELIANCE.NS": {
    name: "Reliance Industries",
    basePrice: 2847,
    sector: "Energy",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE002A01018"
  },
  "TCS.NS": {
    name: "Tata Consultancy Services",
    basePrice: 3920,
    sector: "IT",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE467B01029"
  },
  "INFY.NS": {
    name: "Infosys Ltd",
    basePrice: 1643,
    sector: "IT",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE009A01021"
  },
  "HDFCBANK.NS": {
    name: "HDFC Bank",
    basePrice: 1720,
    sector: "Banking",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE040A01034"
  },
  "WIPRO.NS": {
    name: "Wipro Ltd",
    basePrice: 498,
    sector: "IT",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE075A01022"
  },
  "TITAN.NS": {
    name: "Titan Company",
    basePrice: 3350,
    sector: "Consumer",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE280A01028"
  },
  "ONGC.NS": {
    name: "ONGC",
    basePrice: 265,
    sector: "Energy",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE213A01029"
  },
  "BAJFINANCE.NS": {
    name: "Bajaj Finance",
    basePrice: 7240,
    sector: "Finance",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE296A01024"
  },
  "MARUTI.NS": {
    name: "Maruti Suzuki",
    basePrice: 10800,
    sector: "Auto",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE585B01010"
  },
  "TATASTEEL.NS": {
    name: "Tata Steel",
    basePrice: 148,
    sector: "Metals",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE081A01020"
  },
  "ICICIBANK.NS": {
    name: "ICICI Bank",
    basePrice: 1024,
    sector: "Banking",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE090A01021"
  },
  "SBIN.NS": {
    name: "State Bank of India",
    basePrice: 812,
    sector: "Banking",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE062A01020"
  },
  "SUNPHARMA.NS": {
    name: "Sun Pharma",
    basePrice: 1580,
    sector: "Pharma",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE044A01036"
  },
  "HINDUNILVR.NS": {
    name: "Hindustan Unilever",
    basePrice: 2480,
    sector: "FMCG",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE030A01027"
  },
  "AXISBANK.NS": {
    name: "Axis Bank",
    basePrice: 1105,
    sector: "Banking",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE238A01034"
  }
};

const prices = {};
const prevPrices = {};
const dayOpen = {};

Object.keys(STOCKS).forEach((sym) => {
  const base = STOCKS[sym].basePrice;
  prices[sym] = base;
  prevPrices[sym] = base;
  dayOpen[sym] = null; // will be set from first live tick
});

let simulatorInterval = null;

function isMarketOpen() {
  const now = new Date();

  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const currentTime = hour * 60 + minute;

  const openTime = 9 * 60 + 15;
  const closeTime = 15 * 60 + 30;

  return (
    day >= 1 &&
    day <= 5 &&
    currentTime >= openTime &&
    currentTime <= closeTime
  );
}

async function fetchLivePrice(symbol) {
  try {
    const stock = STOCKS[symbol];

    const response = await axios.get(
      "https://api.upstox.com/v2/market-quote/quotes",
      {
        params: {
          instrument_key: stock.instrumentKey
        },
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
        },
        timeout: 5000
      }
    );

    const data = response.data?.data;
    const firstKey = Object.keys(data)[0];
    const quote = data[firstKey];

    return {
      price: Number(quote.last_price),
      prevClose: Number(quote.ohlc.close),
      high: Number(quote.ohlc.high),
      low: Number(quote.ohlc.low),
      volume: Number(quote.volume)
    };
  } catch (error) {
    console.error(
      `❌ Failed to fetch ${symbol}:`,
      error.response?.data || error.message
    );

    return {
      price: prices[symbol],
      prevClose: dayOpen[symbol] || prices[symbol],
      high: prices[symbol],
      low: prices[symbol],
      volume: 0
    };
  }
}

function startPriceSimulator(io) {
  if (simulatorInterval) clearInterval(simulatorInterval);

  simulatorInterval = setInterval(async () => {
    // We continue fetching even if market is closed to show the last traded price
    // instead of defaulting to random/base prices.
    if (!isMarketOpen()) {
      console.log("⏸ Market closed - showing last traded price");
    }

    const updates = [];

    for (const sym of Object.keys(STOCKS)) {
      prevPrices[sym] = prices[sym];
const liveData = await fetchLivePrice(sym);

prices[sym] = Number(liveData.price);

// use previous day's closing price from Upstox
dayOpen[sym] = Number(liveData.prevClose);

const price = prices[sym];
const open = dayOpen[sym];

const change = price - open;
const changePct = (change / open) * 100;

      updates.push({
        symbol: sym,
        price: +price.toFixed(2),
        prevPrice: +(prevPrices[sym] || price).toFixed(2),
        change: +change.toFixed(2),
        changePct: +changePct.toFixed(2),
        open: +open.toFixed(2),
        high: +(liveData.high || price).toFixed(2),
        low: +(liveData.low || price).toFixed(2),
        volume: liveData.volume || 0,
        name: STOCKS[sym].name,
        sector: STOCKS[sym].sector,
        exchange: STOCKS[sym].exchange,
        timestamp: Date.now()
      });
    }

    io.emit("price:update", updates);

    updates.forEach((u) => {
      io.to(`stock:${u.symbol}`).emit("stock:price", u);
    });

    console.log("📈 Live prices updated");
  }, 15000);

  console.log("📈 Live price feed started");
}

function stopPriceSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval);
}

function getCurrentPrices() {
  return Object.keys(STOCKS).map((sym) => ({
    symbol: sym,
    price: +prices[sym].toFixed(2),
    change: +(prices[sym] - dayOpen[sym]).toFixed(2),
    changePct: +(
      ((prices[sym] - dayOpen[sym]) / dayOpen[sym]) *
      100
    ).toFixed(2),
    open: +dayOpen[sym].toFixed(2),
    high: +(Math.max(prices[sym], dayOpen[sym])).toFixed(2),
    low: +(Math.min(prices[sym], dayOpen[sym])).toFixed(2),
    volume: 1000000,
    name: STOCKS[sym].name,
    sector: STOCKS[sym].sector,
    exchange: STOCKS[sym].exchange
  }));
}

function getPrice(symbol) {
  return prices[symbol] || null;
}

function getStockList() {
  return STOCKS;
}
function getStockBySymbol(symbol) {
  return STOCKS[symbol];
}
function getStockByInstrumentKey(key) {
  return Object.values(STOCKS).find(
    (stock) => stock.instrumentKey === key
  );
}
module.exports = {
  startPriceSimulator,
  stopPriceSimulator,
  getCurrentPrices,
  getPrice,
  getStockList,
  getStockByInstrumentKey,
  getStockBySymbol
};