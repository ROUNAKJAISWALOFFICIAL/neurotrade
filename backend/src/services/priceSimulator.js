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
  "AXISBANK.NS": {
    name: "Axis Bank",
    basePrice: 1105,
    sector: "Banking",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE238A01034"
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
  "NTPC.NS": {
    name: "NTPC Ltd",
    basePrice: 245,
    sector: "Power",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE733E01010"
  },
  "POWERGRID.NS": {
    name: "Power Grid Corporation",
    basePrice: 230,
    sector: "Power",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE752E01010"
  },
  "BHARTIARTL.NS": {
    name: "Bharti Airtel",
    basePrice: 910,
    sector: "Telecom",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE397D01024"
  },
  "HCLTECH.NS": {
    name: "HCL Technologies",
    basePrice: 1100,
    sector: "IT",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE860A01027"
  },
  "TECHM.NS": {
    name: "Tech Mahindra",
    basePrice: 1480,
    sector: "IT",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE669C01036"
  },
  "LT.NS": {
    name: "Larsen & Toubro",
    basePrice: 3200,
    sector: "Engineering",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE018A01030"
  },
  "NESTLEIND.NS": {
    name: "Nestle India",
    basePrice: 26000,
    sector: "FMCG",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE239A01016"
  },
  "ASIANPAINT.NS": {
    name: "Asian Paints",
    basePrice: 4100,
    sector: "Consumer",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE021A01026"
  },
  "ADANIENT.NS": {
    name: "Adani Enterprises",
    basePrice: 3900,
    sector: "Conglomerate",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE742E01027"
  },
  "ADANIPORTS.NS": {
    name: "Adani Ports",
    basePrice: 800,
    sector: "Ports",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE742E01010"
  },
  "JSWSTEEL.NS": {
    name: "JSW Steel",
    basePrice: 780,
    sector: "Metals",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE019A01026"
  },
  "ULTRACEMCO.NS": {
    name: "Ultratech Cement",
    basePrice: 9700,
    sector: "Cement",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE481G01026"
  },
  "BPCL.NS": {
    name: "BPCL",
    basePrice: 550,
    sector: "Energy",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE029A01011"
  },
  "ITC.NS": {
    name: "ITC Ltd",
    basePrice: 490,
    sector: "FMCG",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE154A01025"
  },
  "DRREDDY.NS": {
    name: "Dr. Reddy's Laboratories",
    basePrice: 5200,
    sector: "Pharma",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE089A01023"
  },
  "M&M.NS": {
    name: "Mahindra & Mahindra",
    basePrice: 1850,
    sector: "Auto",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE101A01026"
  },
  "TATAMOTORS.NS": {
    name: "Tata Motors",
    basePrice: 550,
    sector: "Auto",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE02DJ01018"
  },
  "DIVISLAB.NS": {
    name: "Divi's Laboratories",
    basePrice: 4200,
    sector: "Pharma",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE361B01024"
  },
  "SBILIFE.NS": {
    name: "SBI Life Insurance",
    basePrice: 1310,
    sector: "Insurance",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE123W01016"
  },
  "BAJAJFINSV.NS": {
    name: "Bajaj Finserv",
    basePrice: 18600,
    sector: "Finance",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE918I01026"
  },
  "JSWENERGY.NS": {
    name: "JSW Energy",
    basePrice: 375,
    sector: "Power",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE854D01010"
  },
  "TATAPOWER.NS": {
    name: "Tata Power",
    basePrice: 455,
    sector: "Power",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE245A01021"
  },
  "ADANIPOWER.NS": {
    name: "Adani Power",
    basePrice: 325,
    sector: "Power",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE814H01011"
  },
  "GAIL.NS": {
    name: "GAIL (India)",
    basePrice: 145,
    sector: "Energy",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE129A01019"
  },
  "COALINDIA.NS": {
    name: "Coal India",
    basePrice: 210,
    sector: "Mining",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE091A01013"
  },
  "HDFC.NS": {
    name: "Housing Development Finance Corp",
    basePrice: 2850,
    sector: "Finance",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE001A01036"
  },
  "CIPLA.NS": {
    name: "Cipla Ltd",
    basePrice: 1280,
    sector: "Pharma",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE059A01026"
  },
  "BRITANNIA.NS": {
    name: "Britannia Industries",
    basePrice: 4300,
    sector: "FMCG",
    exchange: "NSE",
    instrumentKey: "NSE_EQ|INE016A01026"
  }
};

const prices = {};
const prevPrices = {};
const dayOpen = {};

Object.keys(STOCKS).forEach((sym) => {
  prices[sym] = 0;        // start empty
  prevPrices[sym] = 0;
  dayOpen[sym] = null;
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

    const livePrice = Number(quote.last_price);
    
    // Ensure we never return 0 or invalid price
    if (!livePrice || livePrice <= 0) {
      throw new Error(`Invalid price received for ${symbol}: ${livePrice}`);
    }

    return {
      price: livePrice,
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

    // Return cached price only if available, NEVER fallback to basePrice or 0
    const cachedPrice = prices[symbol];
    if (!cachedPrice || cachedPrice <= 0) {
      console.warn(`⚠️ No valid cached price for ${symbol}, will retry on next interval`);
      return {
        price: null,
        prevClose: dayOpen[symbol] || null,
        high: null,
        low: null,
        volume: 0
      };
    }

    return {
      price: cachedPrice,
      prevClose: dayOpen[symbol] || cachedPrice,
      high: cachedPrice,
      low: cachedPrice,
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

      // CRITICAL: Only use Upstox API price, never fallback to basePrice
      const livePrice = Number(liveData.price);
      
      // Skip this symbol if no valid price available
      if (!livePrice || livePrice <= 0) {
        console.warn(`⚠️ Skipping ${sym} - no valid live price`);
        continue;
      }

      // Set dayOpen ONLY ONCE per day using prevClose from Upstox
      if (!dayOpen[sym]) {
        dayOpen[sym] = Number(liveData.prevClose) || livePrice;
        console.log(`✅ Set dayOpen[${sym}] = ${dayOpen[sym]}`);
      }

      prices[sym] = livePrice;

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

    if (updates.length > 0) {
      io.emit("price:update", updates);

      updates.forEach((u) => {
        io.to(`stock:${u.symbol}`).emit("stock:price", u);
      });

      console.log(`📈 Updated ${updates.length} prices from Upstox`);
    } else {
      console.warn("⚠️ No valid prices received from Upstox");
    }
  }, 15000);

  console.log("📈 Live price feed started (Upstox only)");
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