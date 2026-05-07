import React, { useState, useEffect } from 'react';
import { useStore, STOCKS } from '../store';
import { fmtPrice } from '../utils/format';

export default function TradeForm({ symbol }) {
  const { prices, balance, holdings, token, addToast, setBalance, setHoldings, setOrders } = useStore();
  const [side, setSide] = useState('BUY'); // Corrected: Default to 'BUY'
  const [orderType, setOrderType] = useState('MARKET'); // Added: Separate state for orderType
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [sl, setSl] = useState('');
  const [tgt, setTgt] = useState('');

  const ltp = prices[symbol]?.price || STOCKS[symbol]?.basePrice || 0;

  useEffect(() => {
    setPrice(ltp.toFixed(2));
    setSl((ltp * 0.97).toFixed(2));
    setTgt((ltp * 1.04).toFixed(2));
  }, [symbol, ltp]);

  const execPrice = orderType === 'MARKET' ? ltp : parseFloat(price) || ltp;
  const total = execPrice * qty;
  const holding = holdings[symbol];
  const maxSell = holding?.qty || 0;

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, side, qty, price: execPrice })
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);

      // Re-fetch state to keep UI in sync with DB
      const [hRes, oRes] = await Promise.all([
        fetch('/api/trades/holdings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/trades/orders', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const hData = await hRes.json();
      const oData = await oRes.json();

      setBalance(result.balance);
      setHoldings(hData.holdings.reduce((acc, h) => ({ ...acc, [h.symbol]: h }), {}));
      setOrders(oData.orders);

      const msg = side === 'BUY'
        ? `Bought ${qty} × ${symbol.replace('.NS','')} @ ₹${execPrice.toFixed(2)}`
        : `Sold ${qty} × ${symbol.replace('.NS','')} @ ₹${execPrice.toFixed(2)}`;
      addToast({ type: side === 'BUY' ? 'buy' : 'sell', title: `${side} Executed`, message: msg });
    } catch (err) {
      addToast({ type: 'error', title: 'Order Failed', message: err.message });
    }
  };

  return (
    <div className="p-[14px] flex flex-col gap-3">
      {/* Buy / Sell toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          ↑ BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
            side === 'SELL'
              ? 'bg-red-500 text-white'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
        >↓ SELL</button>
      </div>

      {/* Order Type */}
      <div>
        <label className="text-[10px] text-[#5a6478] uppercase tracking-wider block mb-1">Order Type</label>
        <select
          value={orderType}
          onChange={e => setOrderType(e.target.value)}
          className="w-full bg-[#1a2235] border border-white/10 rounded-lg text-[13px] text-white py-[9px] px-3 outline-none focus:border-indigo-500 font-mono appearance-none"
        >
          <option>MARKET</option>
          <option>LIMIT</option>
          <option>SL</option>
        </select>
      </div>

      {/* Price */}
      {orderType !== 'MARKET' && (
        <div>
          <label className="text-[10px] text-[#5a6478] uppercase tracking-wider block mb-1">Limit Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full bg-[#1a2235] border border-white/10 rounded-lg text-[13px] text-white py-[9px] px-3 outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="text-[10px] text-[#5a6478] uppercase tracking-wider block mb-1">
          Quantity {side === 'SELL' && <span className="text-[#5a6478]">(max: {maxSell})</span>}
        </label>
        <input
          type="number"
          min={1}
          max={side === 'SELL' ? maxSell : undefined}
          value={qty}
          onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full bg-[#1a2235] border border-white/10 rounded-lg text-[13px] text-white py-[9px] px-3 outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      {/* SL / Target */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[#5a6478] uppercase tracking-wider block mb-1">Stop Loss</label>
          <input type="number" value={sl} onChange={e => setSl(e.target.value)}
            className="w-full bg-[#1a2235] border border-white/10 rounded-lg text-[12px] text-white py-[8px] px-3 outline-none focus:border-red-500 font-mono" />
        </div>
        <div>
          <label className="text-[10px] text-[#5a6478] uppercase tracking-wider block mb-1">Target</label>
          <input type="number" value={tgt} onChange={e => setTgt(e.target.value)}
            className="w-full bg-[#1a2235] border border-white/10 rounded-lg text-[12px] text-white py-[8px] px-3 outline-none focus:border-emerald-500 font-mono" />
        </div>
      </div>

      {/* Balance info */}
      <div className="bg-[#1a2235] rounded-lg p-[10px] flex justify-between items-center">
        <span className="text-[11px] text-[#8b95a8]">Available Balance</span>
        <span className="font-mono text-[14px] font-semibold text-cyan-400">
          ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Total */}
      <div className="bg-[#1a2235] rounded-lg p-[10px] flex justify-between items-center">
        <span className="text-[11px] text-[#8b95a8]">Order Total</span>
        <span className={`font-mono text-[14px] font-semibold ${side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 ${
          side === 'BUY'
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {side === 'BUY' ? '↑ Place Buy Order' : '↓ Place Sell Order'}
      </button>

      {/* LTP reference */}
      <div className="text-center text-[11px] text-[#5a6478]">
        LTP: <span className="font-mono text-white">{fmtPrice(ltp)}</span>
        {' · '}
        {symbol.replace('.NS','').replace('.BSE','')} · {STOCKS[symbol]?.exchange}
      </div>
    </div>
  );
}
