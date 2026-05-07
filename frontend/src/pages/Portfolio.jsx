import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, STOCKS } from '../store';

export default function Portfolio() {
  const navigate = useNavigate();
  const { holdings, prices, balance, orders, setCurrentSymbol, executeTrade, addToast } = useStore();

  let invested = 0, currentVal = 0;
  const entries = Object.entries(holdings).filter(([,h]) => h.qty > 0);
  entries.forEach(([sym, h]) => {
    const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
    invested += h.avgPrice * h.qty;
    currentVal += ltp * h.qty;
  });
  const pl = currentVal - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  const handleExit = async (sym) => {
    const h = holdings[sym];
    const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
    const result = await executeTrade(sym, 'SELL', h.qty, ltp);
    if (result.ok) {
      addToast({ type: 'sell', title: 'Position Closed', message: `Exited ${sym.replace('.NS','')} · P&L ${result.pnl >= 0 ? '+' : ''}₹${result.pnl?.toFixed(0)}` });
    } else {
      addToast({ type: 'error', title: 'Order Failed', message: result.error });
    }
  };

  const realized = orders.filter(o => o.type === 'SELL' && o.pnl != null).reduce((a, o) => a + o.pnl, 0);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold">Portfolio</h1>
          <p className="text-[12px] text-[#5a6478] mt-1">Your positions & performance</p>
        </div>
        <button onClick={() => navigate('/chart')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[13px] font-medium hover:bg-indigo-500 transition-all">
          + New Trade
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ['Total Portfolio', `₹${(balance+currentVal).toLocaleString('en-IN',{maximumFractionDigits:0})}`, 'text-cyan-400'],
          ['Invested', `₹${invested.toLocaleString('en-IN',{maximumFractionDigits:0})}`, 'text-white'],
          ['Unrealised P&L', `${pl>=0?'+':''}₹${Math.abs(pl).toLocaleString('en-IN',{maximumFractionDigits:0})}`, pl>=0?'text-emerald-400':'text-red-400'],
          ['Realised P&L', `${realized>=0?'+':''}₹${Math.abs(realized).toFixed(0)}`, realized>=0?'text-emerald-400':'text-red-400'],
        ].map(([label,val,color],i) => (
          <motion.div key={label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4">
            <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">{label}</div>
            <div className={`text-[20px] font-semibold font-mono ${color}`}>{val}</div>
            {label==='Unrealised P&L' && <div className="text-[11px] text-[#8b95a8] mt-1">{plPct.toFixed(2)}% overall</div>}
          </motion.div>
        ))}
      </div>

      {/* Holdings table */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[14px] font-semibold">Open Positions ({entries.length})</span>
        </div>
        {entries.length === 0 ? (
          <div className="py-16 text-center text-[#5a6478]">
            <div className="text-[16px] mb-2">No open positions</div>
            <button onClick={() => navigate('/chart')} className="text-indigo-400 text-[13px] hover:underline">Start trading →</button>
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Stock','Exchange','Qty','Avg Cost','LTP','Invested','Current Value','P&L','% Return','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-[#5a6478] uppercase tracking-[0.5px] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(([sym, h], i) => {
                const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
                const inv = h.avgPrice * h.qty;
                const cur = ltp * h.qty;
                const pnl = cur - inv;
                const pnlPct = (pnl / inv) * 100;
                return (
                  <motion.tr key={sym} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold font-mono flex-shrink-0"
                          style={{background:`${STOCKS[sym]?.color}22`,color:STOCKS[sym]?.color}}>
                          {STOCKS[sym]?.abbr}
                        </div>
                        <div>
                          <div className="font-mono font-semibold">{sym.replace('.NS','')}</div>
                          <div className="text-[10px] text-[#5a6478]">{STOCKS[sym]?.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8b95a8]">{STOCKS[sym]?.exchange}</td>
                    <td className="px-4 py-3 font-mono">{h.qty}</td>
                    <td className="px-4 py-3 font-mono">₹{h.avgPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">₹{ltp.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">₹{inv.toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono">₹{cur.toFixed(0)}</td>
                    <td className={`px-4 py-3 font-mono font-semibold ${pnl>=0?'text-emerald-400':'text-red-400'}`}>
                      {pnl>=0?'+':''}₹{Math.abs(pnl).toFixed(0)}
                    </td>
                    <td className={`px-4 py-3 font-mono ${pnlPct>=0?'text-emerald-400':'text-red-400'}`}>
                      {pnlPct>=0?'+':''}{pnlPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setCurrentSymbol(sym); navigate('/chart'); }}
                          className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 text-[11px] hover:bg-indigo-600/30 transition-all">Trade</button>
                        <button onClick={() => handleExit(sym)}
                          className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-[11px] hover:bg-red-500/20 border border-red-500/20 transition-all">Exit</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
