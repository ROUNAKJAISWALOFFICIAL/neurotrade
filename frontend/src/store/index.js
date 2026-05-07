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