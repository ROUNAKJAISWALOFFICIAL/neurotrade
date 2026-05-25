import { create } from 'zustand';

// --- Stock universe ---
export const STOCKS = {
  'RELIANCE.NS': {
    name: 'Reliance Industries',
    exchange: 'NSE',
    basePrice: 2847,
    sector: 'Energy',
    abbr: 'RIL',
    color: '#6366f1',
    instrumentKey: 'NSE_EQ|INE002A01018',
  },

  'TCS.NS': {
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    basePrice: 3920,
    sector: 'IT',
    abbr: 'TCS',
    color: '#06b6d4',
    instrumentKey: 'NSE_EQ|INE467B01029',
  },

  'INFY.NS': {
    name: 'Infosys Ltd',
    exchange: 'NSE',
    basePrice: 1643,
    sector: 'IT',
    abbr: 'INFY',
    color: '#8b5cf6',
    instrumentKey: 'NSE_EQ|INE009A01021',
  },

  'HDFCBANK.NS': {
    name: 'HDFC Bank',
    exchange: 'NSE',
    basePrice: 1720,
    sector: 'Banking',
    abbr: 'HDF',
    color: '#10b981',
    instrumentKey: 'NSE_EQ|INE040A01034',
  },

  'WIPRO.NS': {
    name: 'Wipro Ltd',
    exchange: 'NSE',
    basePrice: 498,
    sector: 'IT',
    abbr: 'WIP',
    color: '#f59e0b',
    instrumentKey: 'NSE_EQ|INE075A01022',
  },

  'ICICIBANK.NS': {
    name: 'ICICI Bank',
    exchange: 'NSE',
    basePrice: 1024,
    sector: 'Banking',
    abbr: 'ICI',
    color: '#22d3ee',
    instrumentKey: 'NSE_EQ|INE090A01021',
  },

  'SBIN.NS': {
    name: 'State Bank of India',
    exchange: 'NSE',
    basePrice: 812,
    sector: 'Banking',
    abbr: 'SBI',
    color: '#0ea5e9',
    instrumentKey: 'NSE_EQ|INE062A01020',
  },

  'AXISBANK.NS': {
    name: 'Axis Bank',
    exchange: 'NSE',
    basePrice: 1105,
    sector: 'Banking',
    abbr: 'AXIS',
    color: '#818cf8',
    instrumentKey: 'NSE_EQ|INE238A01034',
  },

  'BAJFINANCE.NS': {
    name: 'Bajaj Finance',
    exchange: 'NSE',
    basePrice: 7240,
    sector: 'Finance',
    abbr: 'BAJAJ',
    color: '#f97316',
    instrumentKey: 'NSE_EQ|INE296A01024',
  },

  'MARUTI.NS': {
    name: 'Maruti Suzuki',
    exchange: 'NSE',
    basePrice: 10800,
    sector: 'Auto',
    abbr: 'MARUTI',
    color: '#14b8a6',
    instrumentKey: 'NSE_EQ|INE585B01010',
  },

  'TATASTEEL.NS': {
    name: 'Tata Steel',
    exchange: 'NSE',
    basePrice: 148,
    sector: 'Metals',
    abbr: 'TATASTEEL',
    color: '#0f766e',
    instrumentKey: 'NSE_EQ|INE081A01020',
  },

  'SUNPHARMA.NS': {
    name: 'Sun Pharma',
    exchange: 'NSE',
    basePrice: 1580,
    sector: 'Pharma',
    abbr: 'SUNPHARMA',
    color: '#f43f5e',
    instrumentKey: 'NSE_EQ|INE044A01036',
  },

  'HINDUNILVR.NS': {
    name: 'Hindustan Unilever',
    exchange: 'NSE',
    basePrice: 2480,
    sector: 'FMCG',
    abbr: 'HINDUNILVR',
    color: '#f59e0b',
    instrumentKey: 'NSE_EQ|INE030A01027',
  },

  'NTPC.NS': {
    name: 'NTPC Ltd',
    exchange: 'NSE',
    basePrice: 245,
    sector: 'Power',
    abbr: 'NTPC',
    color: '#22c55e',
    instrumentKey: 'NSE_EQ|INE733E01010',
  },

  'POWERGRID.NS': {
    name: 'Power Grid Corporation',
    exchange: 'NSE',
    basePrice: 230,
    sector: 'Power',
    abbr: 'POWERGRID',
    color: '#38bdf8',
    instrumentKey: 'NSE_EQ|INE752E01010',
  },

  'BHARTIARTL.NS': {
    name: 'Bharti Airtel',
    exchange: 'NSE',
    basePrice: 910,
    sector: 'Telecom',
    abbr: 'AIRTEL',
    color: '#fb7185',
    instrumentKey: 'NSE_EQ|INE397D01024',
  },

  'HCLTECH.NS': {
    name: 'HCL Technologies',
    exchange: 'NSE',
    basePrice: 1100,
    sector: 'IT',
    abbr: 'HCL',
    color: '#0ea5e9',
    instrumentKey: 'NSE_EQ|INE860A01027',
  },

  'TECHM.NS': {
    name: 'Tech Mahindra',
    exchange: 'NSE',
    basePrice: 1480,
    sector: 'IT',
    abbr: 'TECHM',
    color: '#a855f7',
    instrumentKey: 'NSE_EQ|INE669C01036',
  },

  'LT.NS': {
    name: 'Larsen & Toubro',
    exchange: 'NSE',
    basePrice: 3200,
    sector: 'Engineering',
    abbr: 'LT',
    color: '#22c55e',
    instrumentKey: 'NSE_EQ|INE018A01030',
  },

  'NESTLEIND.NS': {
    name: 'Nestle India',
    exchange: 'NSE',
    basePrice: 26000,
    sector: 'FMCG',
    abbr: 'NESTLE',
    color: '#facc15',
    instrumentKey: 'NSE_EQ|INE239A01016',
  },

  'ASIANPAINT.NS': {
    name: 'Asian Paints',
    exchange: 'NSE',
    basePrice: 4100,
    sector: 'Consumer',
    abbr: 'ASIANPAINT',
    color: '#f97316',
    instrumentKey: 'NSE_EQ|INE021A01026',
  },

  'ADANIENT.NS': {
    name: 'Adani Enterprises',
    exchange: 'NSE',
    basePrice: 3900,
    sector: 'Conglomerate',
    abbr: 'ADANIENT',
    color: '#fb923c',
    instrumentKey: 'NSE_EQ|INE742E01027',
  },

  'ADANIPORTS.NS': {
    name: 'Adani Ports',
    exchange: 'NSE',
    basePrice: 800,
    sector: 'Ports',
    abbr: 'ADANIPORTS',
    color: '#38bdf8',
    instrumentKey: 'NSE_EQ|INE742E01010',
  },

  'JSWSTEEL.NS': {
    name: 'JSW Steel',
    exchange: 'NSE',
    basePrice: 780,
    sector: 'Metals',
    abbr: 'JSWSTEEL',
    color: '#22d3ee',
    instrumentKey: 'NSE_EQ|INE019A01026',
  },

  'ULTRACEMCO.NS': {
    name: 'Ultratech Cement',
    exchange: 'NSE',
    basePrice: 9700,
    sector: 'Cement',
    abbr: 'ULTRACEMCO',
    color: '#8b5cf6',
    instrumentKey: 'NSE_EQ|INE481G01026',
  },

  'BPCL.NS': {
    name: 'BPCL',
    exchange: 'NSE',
    basePrice: 550,
    sector: 'Energy',
    abbr: 'BPCL',
    color: '#f97316',
    instrumentKey: 'NSE_EQ|INE029A01011',
  },

  'ITC.NS': {
    name: 'ITC Ltd',
    exchange: 'NSE',
    basePrice: 490,
    sector: 'FMCG',
    abbr: 'ITC',
    color: '#4ade80',
    instrumentKey: 'NSE_EQ|INE154A01025',
  },

  'DRREDDY.NS': {
    name: "Dr. Reddy's Laboratories",
    exchange: 'NSE',
    basePrice: 5200,
    sector: 'Pharma',
    abbr: 'DRREDDY',
    color: '#ec4899',
    instrumentKey: 'NSE_EQ|INE089A01023',
  },

  'M&M.NS': {
    name: 'Mahindra & Mahindra',
    exchange: 'NSE',
    basePrice: 1850,
    sector: 'Auto',
    abbr: 'M&M',
    color: '#22c55e',
    instrumentKey: 'NSE_EQ|INE101A01026',
  },

  'TATAMOTORS.NS': {
    name: 'Tata Motors',
    exchange: 'NSE',
    basePrice: 550,
    sector: 'Auto',
    abbr: 'TATAMOTORS',
    color: '#38bdf8',
    instrumentKey: 'NSE_EQ|INE02DJ01018',
  },

  'DIVISLAB.NS': {
    name: "Divi's Laboratories",
    exchange: 'NSE',
    basePrice: 4200,
    sector: 'Pharma',
    abbr: 'DIVISLAB',
    color: '#fb7185',
    instrumentKey: 'NSE_EQ|INE361B01024',
  },

  'SBILIFE.NS': {
    name: 'SBI Life Insurance',
    exchange: 'NSE',
    basePrice: 1310,
    sector: 'Insurance',
    abbr: 'SBILIFE',
    color: '#0ea5e9',
    instrumentKey: 'NSE_EQ|INE123W01016',
  },

  'BAJAJFINSV.NS': {
    name: 'Bajaj Finserv',
    exchange: 'NSE',
    basePrice: 18600,
    sector: 'Finance',
    abbr: 'BAJAJFINSV',
    color: '#8b5cf6',
    instrumentKey: 'NSE_EQ|INE918I01026',
  },

  'JSWENERGY.NS': {
    name: 'JSW Energy',
    exchange: 'NSE',
    basePrice: 375,
    sector: 'Power',
    abbr: 'JSWENERGY',
    color: '#22d3ee',
    instrumentKey: 'NSE_EQ|INE854D01010',
  },

  'TATAPOWER.NS': {
    name: 'Tata Power',
    exchange: 'NSE',
    basePrice: 455,
    sector: 'Power',
    abbr: 'TATAPOWER',
    color: '#4ade80',
    instrumentKey: 'NSE_EQ|INE245A01021',
  },

  'ADANIPOWER.NS': {
    name: 'Adani Power',
    exchange: 'NSE',
    basePrice: 325,
    sector: 'Power',
    abbr: 'ADANIPOWER',
    color: '#f97316',
    instrumentKey: 'NSE_EQ|INE814H01011',
  },

  'GAIL.NS': {
    name: 'GAIL (India)',
    exchange: 'NSE',
    basePrice: 145,
    sector: 'Energy',
    abbr: 'GAIL',
    color: '#22c55e',
    instrumentKey: 'NSE_EQ|INE129A01019',
  },

  'COALINDIA.NS': {
    name: 'Coal India',
    exchange: 'NSE',
    basePrice: 210,
    sector: 'Mining',
    abbr: 'COALINDIA',
    color: '#0ea5e9',
    instrumentKey: 'NSE_EQ|INE091A01013',
  },

  'HDFC.NS': {
    name: 'Housing Development Finance Corp',
    exchange: 'NSE',
    basePrice: 2850,
    sector: 'Finance',
    abbr: 'HDFC',
    color: '#14b8a6',
    instrumentKey: 'NSE_EQ|INE001A01036',
  },

  'CIPLA.NS': {
    name: 'Cipla Ltd',
    exchange: 'NSE',
    basePrice: 1280,
    sector: 'Pharma',
    abbr: 'CIPLA',
    color: '#fb7185',
    instrumentKey: 'NSE_EQ|INE059A01026',
  },

  'BRITANNIA.NS': {
    name: 'Britannia Industries',
    exchange: 'NSE',
    basePrice: 4300,
    sector: 'FMCG',
    abbr: 'BRIT',
    color: '#fde68a',
    instrumentKey: 'NSE_EQ|INE016A01026',
  },
};
// --- Initialize prices from base ---
const initPrices = () => {
  const p = {};

  Object.keys(STOCKS).forEach((sym) => {
    const base = STOCKS[sym].basePrice;

    p[sym] = {
      price: base,
      open: base,
      change: 0,
      changePct: 0,
      volume: 0,
      prevPrice: base,
    };
  });

  return p;
};

export const useStore = create((set, get) => ({
  // --- Auth ---
  user: null,
  token: localStorage.getItem('te_token') || null,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    localStorage.setItem('te_token', token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('te_token');
    set({ user: null, token: null });
  },
  // --- Orders ---
  orders: [],

  setOrders: (orders) => set({ orders }),

 
  // --- Market data ---
  prices: initPrices(),
  prevPrices: {},

  setPrices: (updates) =>
    set((state) => {
      const newPrices = { ...state.prices };
      const newPrev = { ...state.prevPrices };

      updates.forEach((u) => {
        const old = newPrices[u.symbol] || {};

        const open = u.open ?? old.open ?? u.price;

        const change = u.price - open;
        const changePct = (change / open) * 100;

        newPrev[u.symbol] = old;

        newPrices[u.symbol] = {
          ...u,
          open,
          change,
          changePct,
        };
      });

      return {
        prices: newPrices,
        prevPrices: newPrev,
      };
    }),

  // --- Current stock ---
  currentSymbol: 'RELIANCE.NS',

  setCurrentSymbol: (sym) =>
    set({
      currentSymbol: sym,
    }),

  // --- Portfolio ---
  balance: 100000,
  holdings: {},
  orders: [],

  setBalance: (balance) => set({ balance }),

  setHoldings: (holdings) => set({ holdings }),

  addOrder: (order) =>
    set((s) => ({
      orders: [order, ...s.orders],
    })),

  // --- Execute trade through backend persistence ---
  executeTrade: async (symbol, type, qty, price) => {
    const state = get();
    const token = state.token || localStorage.getItem('te_token');
    if (!token) {
      return { ok: false, error: 'Authentication required' };
    }

    try {
      const res = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, side: type, qty, price }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Order failed' };
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [holdRes, orderRes] = await Promise.all([
        fetch('/api/trades/holdings', { headers }),
        fetch('/api/trades/orders', { headers }),
      ]);
      const [holdData, orderData] = await Promise.all([holdRes.json(), orderRes.json()]);

      if (holdData.holdings) {
        set({
          holdings: holdData.holdings.reduce((acc, h) => ({ ...acc, [h.symbol]: h }), {}),
        });
      }
      if (orderData.orders) {
        set({ orders: orderData.orders });
      }
      if (data.balance !== undefined) {
        set({ balance: data.balance });
      }

      return {
        ok: true,
        trade: data.trade,
        pnl: data.trade?.pnl,
        balance: data.balance,
      };
    } catch (err) {
      return { ok: false, error: err.message || 'Order failed' };
    }
  },

  // --- UI ---
  page: 'dashboard',
  setPage: (page) => set({ page }),

  chartType: 'candle',
  setChartType: (t) => set({ chartType: t }),

  chartInterval: '1D',
  setChartInterval: (i) => set({ chartInterval: i }),

  // --- Signals ---
  signals: [],

  addSignal: (sig) =>
    set((s) => ({
      signals: [sig, ...s.signals].slice(0, 20),
    })),

  // --- Toasts ---
  toasts: [],

  addToast: (toast) => {
    const id = Date.now();

    set((s) => ({
      toasts: [{ ...toast, id }, ...s.toasts],
    }));

    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },
}));