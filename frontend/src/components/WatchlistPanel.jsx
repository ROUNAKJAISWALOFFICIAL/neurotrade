import React from 'react';
import { useStore, STOCKS } from '../store';
import { fmtPrice } from '../utils/format';

export default function WatchlistPanel({ onSelect, selected }) {
  const prices = useStore(s => s.prices);
  const symbols = Object.keys(STOCKS);

  return (
    <div className="flex flex-col h-full border-l border-white/[0.06] bg-[#111827] w-[220px] flex-shrink-0">
      <div className="px-3 py-[10px] text-[10px] font-semibold text-[#8b95a8] uppercase tracking-[0.6px] border-b border-white/[0.06]">
        Watchlist
      </div>
      <div className="flex-1 overflow-y-auto">
        {symbols.map(sym => {
          const p = prices[sym] || {};
          const price = p.price || STOCKS[sym].basePrice;
          const chg = p.changePct || 0;
          const isUp = chg >= 0;
          const isActive = sym === selected;

          return (
            <div
              key={sym}
              onClick={() => onSelect?.(sym)}
              className={`flex items-center justify-between px-3 py-[9px] cursor-pointer border-b border-white/[0.03] transition-all duration-150
                ${isActive
                  ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500'
                  : 'hover:bg-white/[0.03]'
                }`}
            >
              <div>
                <div className="font-mono text-[12px] font-semibold text-white">
                  {sym.replace('.NS', '').replace('^', '')}
                </div>
                <div className="text-[10px] text-[#5a6478] mt-[1px]">{STOCKS[sym].sector}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[12px] text-white">₹{price.toFixed(2)}</div>
                <div className={`text-[10px] font-mono mt-[1px] ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
