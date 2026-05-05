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
      price: base + (Math.random() - 0.5) * base * 0.01,
      open: base,
      change: 0,
      changePct: 0,
      volume: 0,
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

  // --- Execute trade locally ---
  executeTrade: (symbol, type, qty, price) => {
    const state = get();
    const total = price * qty;

    if (type === 'BUY') {
      if (state.balance < total) {
        return { ok: false, error: 'Insufficient balance' };
      }

      const h = state.holdings[symbol] || {
        qty: 0,
        avgPrice: 0,
      };

      const newAvg =
        (h.avgPrice * h.qty + price * qty) / (h.qty + qty);

      set({
        balance: state.balance - total,
        holdings: {
          ...state.holdings,
          [symbol]: {
            qty: h.qty + qty,
            avgPrice: newAvg,
          },
        },
        orders: [
          {
            id: Date.now(),
            symbol,
            type,
            qty,
            price,
            total,
            time: new Date(),
            status: 'EXECUTED',
          },
          ...state.orders,
        ],
      });

      return { ok: true };
    } else {
      const h = state.holdings[symbol];

      if (!h || h.qty < qty) {
        return {
          ok: false,
          error: 'Insufficient holdings',
        };
      }

      const pnl = (price - h.avgPrice) * qty;
      const newQty = h.qty - qty;

      const newHoldings = { ...state.holdings };

      if (newQty === 0) delete newHoldings[symbol];
      else newHoldings[symbol] = { ...h, qty: newQty };

      set({
        balance: state.balance + total,
        holdings: newHoldings,
        orders: [
          {
            id: Date.now(),
            symbol,
            type,
            qty,
            price,
            total,
            pnl,
            time: new Date(),
            status: 'EXECUTED',
          },
          ...state.orders,
        ],
      });

      return { ok: true, pnl };
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