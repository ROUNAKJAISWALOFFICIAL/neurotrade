import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, STOCKS } from '../store';
import { fmtPrice, fmtPct, fmtINR } from '../utils/format';
import { generateClientSignal } from '../utils/signals';

function StatCard({ label, value, sub, color = 'text-white', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4"
    >
      <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">{label}</div>
      <div className={`text-[22px] font-semibold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-[#8b95a8] mt-1">{sub}</div>}
    </motion.div>
  );
}

function MoverRow({ sym, price, chg, chgPct, onClick }) {
  const isUp = chgPct >= 0;
  return (
    <div onClick={() => onClick(sym)}
      className="flex items-center justify-between px-3 py-[10px] hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.04] transition-colors">
      <div>
        <div className="font-mono text-[12px] font-semibold">{sym.replace('.NS','').replace('^','')}</div>
        <div className="text-[10px] text-[#5a6478] mt-[1px]">{STOCKS[sym]?.sector}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px]">₹{Number(price).toFixed(2)}</div>
        <div className={`font-mono text-[11px] ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(chgPct).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

/* NEW: Market open/closed function */
function isMarketOpen() {
  const now = new Date();

  const day = now.getDay(); // 0 Sunday, 6 Saturday
  const hour = now.getHours();
  const minute = now.getMinutes();

  const currentTime = hour * 60 + minute;

  const openTime = 9 * 60 + 15;   // 9:15 AM
  const closeTime = 15 * 60 + 30; // 3:30 PM

  const isWeekday = day >= 1 && day <= 5;

  return isWeekday && currentTime >= openTime && currentTime <= closeTime;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { prices, balance, holdings, orders, setCurrentSymbol } = useStore();
  const [topSignals, setTopSignals] = useState([]);

  // Compute portfolio metrics
  let invested = 0, currentVal = 0;
  Object.entries(holdings).forEach(([sym, h]) => {
    if (h.qty > 0) {
      invested += h.avgPrice * h.qty;
      const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
      currentVal += ltp * h.qty;
    }
  });
  const pl = currentVal - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;
  const portfolioVal = balance + currentVal;

  // Sort movers
  const allPrices = Object.entries(prices)
    .filter(([sym]) => STOCKS[sym])
    .map(([sym, p]) => ({ sym, price: p.price || STOCKS[sym].basePrice, chg: p.change || 0, chgPct: p.changePct || 0 }));
  const gainers = [...allPrices].sort((a, b) => b.chgPct - a.chgPct).slice(0, 5);
  const losers  = [...allPrices].sort((a, b) => a.chgPct - b.chgPct).slice(0, 5);

  useEffect(() => {
    const sigs = Object.keys(STOCKS).slice(0, 4).map(sym => {
      const p = prices[sym]?.price || STOCKS[sym].basePrice;
      const chg = prices[sym]?.changePct || 0;
      return generateClientSignal(sym, p, chg);
    });
    setTopSignals(sigs);
  }, []);

  const goToChart = (sym) => {
    setCurrentSymbol(sym);
    navigate('/chart');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold">Dashboard</h1>
          <p className="text-[12px] text-[#5a6478] mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className={isMarketOpen() ? 'text-emerald-400' : 'text-red-400'}>
              ● Market {isMarketOpen() ? 'Live' : 'Closed'}
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate('/chart')}
          className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-[13px] font-medium hover:bg-indigo-600/30 transition-all"
        >
          Open Chart →
        </button>
      </div>

      {/* KEEPING EVERYTHING BELOW EXACTLY SAME */}
      {/* Your remaining code from Stats row till Sector Performance remains unchanged */}
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Portfolio Value" value={`₹${portfolioVal.toLocaleString('en-IN',{maximumFractionDigits:0})}`} sub="Cash + Holdings" color="text-cyan-400" delay={0} />
        <StatCard label="Available Cash" value={`₹${balance.toLocaleString('en-IN',{maximumFractionDigits:0})}`} sub="Ready to invest" color="text-white" delay={0.05} />
        <StatCard label="Unrealised P&L" value={`${pl >= 0 ? '+' : ''}₹${Math.abs(pl).toLocaleString('en-IN',{maximumFractionDigits:0})}`} sub={`${pl >= 0 ? '+' : ''}${plPct.toFixed(2)}% return`} color={pl >= 0 ? 'text-emerald-400' : 'text-red-400'} delay={0.1} />
        <StatCard label="Total Orders" value={orders.length} sub={`${Object.keys(holdings).filter(s => holdings[s].qty > 0).length} active positions`} delay={0.15} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">

        {/* Top Gainers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold">Top Gainers</span>
            <span className="text-[10px] text-emerald-400 font-mono">NSE · TODAY</span>
          </div>
          {gainers.map(m => <MoverRow key={m.sym} {...m} onClick={goToChart} />)}
        </motion.div>

        {/* Top Losers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold">Top Losers</span>
            <span className="text-[10px] text-red-400 font-mono">NSE · TODAY</span>
          </div>
          {losers.map(m => <MoverRow key={m.sym} {...m} onClick={goToChart} />)}
        </motion.div>

        {/* AI Signals preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold">AI Signals</span>
            <button onClick={() => navigate('/ai')} className="text-[10px] text-indigo-400 hover:text-indigo-300">View all →</button>
          </div>
          <div className="p-3">
            {topSignals.map((sig, i) => {
              const isBuy = sig.signal === 'BUY';
              return (
                <div key={i} onClick={() => goToChart(sig.symbol)}
                  className="flex items-center justify-between px-3 py-[10px] hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.04] rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-[2px] rounded-full text-[9px] font-bold font-mono ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {sig.signal}
                    </span>
                    <span className="font-mono text-[12px] font-semibold">{sig.symbol.replace('.NS','')}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-[12px] font-semibold ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>{sig.confidence}%</div>
                    <div className="text-[10px] text-[#5a6478]">{sig.holdTime}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Holdings summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="col-span-2 bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold">Holdings</span>
            <button onClick={() => navigate('/portfolio')} className="text-[10px] text-indigo-400 hover:text-indigo-300">Full portfolio →</button>
          </div>
          {Object.keys(holdings).filter(s => holdings[s].qty > 0).length === 0 ? (
            <div className="py-10 text-center text-[#5a6478] text-[13px]">
              No holdings yet.{' '}
              <button onClick={() => navigate('/chart')} className="text-indigo-400 hover:underline">Start trading →</button>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  {['Symbol','Qty','Avg Price','LTP','P&L','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-[#5a6478] uppercase tracking-[0.5px] font-medium border-b border-white/[0.04]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(holdings).filter(([,h]) => h.qty > 0).map(([sym, h]) => {
                  const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
                  const pnl = (ltp - h.avgPrice) * h.qty;
                  const pnlPct = ((ltp - h.avgPrice) / h.avgPrice) * 100;
                  return (
                    <tr key={sym} className="hover:bg-white/[0.02] border-b border-white/[0.03]">
                      <td className="px-4 py-[10px]">
                        <span className="font-mono font-semibold">{sym.replace('.NS','')}</span>
                        <span className="ml-2 text-[10px] text-[#5a6478]">{STOCKS[sym]?.sector}</span>
                      </td>
                      <td className="px-4 py-[10px] font-mono">{h.qty}</td>
                      <td className="px-4 py-[10px] font-mono">₹{h.avgPrice.toFixed(2)}</td>
                      <td className="px-4 py-[10px] font-mono">₹{ltp.toFixed(2)}</td>
                      <td className={`px-4 py-[10px] font-mono font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toFixed(0)} ({pnlPct.toFixed(2)}%)
                      </td>
                      <td className="px-4 py-[10px]">
                        <button onClick={() => goToChart(sym)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium">Trade</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Sector heatmap */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold">Sector Performance</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {['IT','Banking','Energy','Finance','Auto','Consumer','Pharma','Metals'].map(sector => {
              const secStocks = Object.entries(prices).filter(([sym]) => STOCKS[sym]?.sector === sector);
              const avg = secStocks.length
                ? secStocks.reduce((a, [,p]) => a + (p.changePct || 0), 0) / secStocks.length
                : (Math.random() - 0.5) * 3;
              const isUp = avg >= 0;
              return (
                <div key={sector} className={`p-3 rounded-xl ${isUp ? 'bg-emerald-500/[0.08] border border-emerald-500/15' : 'bg-red-500/[0.06] border border-red-500/12'}`}>
                  <div className="text-[11px] text-[#8b95a8] mb-1">{sector}</div>
                  <div className={`font-mono text-[13px] font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{avg.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
  
      </div>
    </div>
  );
}
