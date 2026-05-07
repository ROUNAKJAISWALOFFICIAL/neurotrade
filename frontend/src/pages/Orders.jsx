import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';

export default function Orders() {
  const { orders } = useStore();
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.type === filter);
  const totalPnl = orders.filter(o => o.pnl != null).reduce((a, o) => a + o.pnl, 0);
  const wins = orders.filter(o => o.pnl != null && o.pnl > 0).length;
  const losses = orders.filter(o => o.pnl != null && o.pnl < 0).length;

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold">Order History</h1>
        <p className="text-[12px] text-[#5a6478] mt-1">All your paper trades</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ['Total Orders', orders.length, 'text-white'],
          ['Realised P&L', `${totalPnl>=0?'+':''}₹${Math.abs(totalPnl).toFixed(0)}`, totalPnl>=0?'text-emerald-400':'text-red-400'],
          ['Winning Trades', wins, 'text-emerald-400'],
          ['Losing Trades', losses, 'text-red-400'],
        ].map(([label,val,color],i) => (
          <motion.div key={label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4">
            <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">{label}</div>
            <div className={`text-[22px] font-semibold font-mono ${color}`}>{val}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL','BUY','SELL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-[6px] rounded-lg text-[12px] font-medium transition-all
              ${filter===f?'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30':'text-[#8b95a8] border border-white/[0.07] hover:text-white hover:border-white/20'}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-[#5a6478] flex items-center">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}}
        className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#5a6478]">No orders found.</div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['#','Type','Symbol','Qty','Price','Total','P&L','Status','Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-[#5a6478] uppercase tracking-[0.5px] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#5a6478] font-mono">{filtered.length - i}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${o.type==='BUY'?'text-emerald-400':'text-red-400'}`}>{o.type}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{o.symbol.replace('.NS','').replace('^','')}</td>
                  <td className="px-4 py-3 font-mono">{o.qty}</td>
                  <td className="px-4 py-3 font-mono">₹{Number(o.price).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono">₹{Number(o.total).toFixed(0)}</td>
                  <td className={`px-4 py-3 font-mono font-semibold ${o.pnl!=null?(o.pnl>=0?'text-emerald-400':'text-red-400'):'text-[#5a6478]'}`}>
                    {o.pnl != null ? `${o.pnl>=0?'+':''}₹${Math.abs(o.pnl).toFixed(0)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-[2px] rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-400">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#5a6478] text-[11px]">
                    {new Date(o.timestamp || o.time).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
