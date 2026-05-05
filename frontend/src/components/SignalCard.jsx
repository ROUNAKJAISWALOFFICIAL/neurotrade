import React from 'react';
import { motion } from 'framer-motion';
import { fmtPrice, fmtPct } from '../utils/format';

export default function SignalCard({ signal, onTrade }) {
  const isBuy = signal.signal === 'BUY';
  const c = isBuy
    ? { border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.07]', badge: 'bg-emerald-500/20 text-emerald-400', bar: 'bg-gradient-to-r from-emerald-700 to-emerald-400', btn: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500', label: '▲ BUY' }
    : { border: 'border-red-500/18', bg: 'bg-red-500/[0.06]', badge: 'bg-red-500/15 text-red-400', bar: 'bg-gradient-to-r from-red-700 to-red-400', btn: 'bg-red-500/15 text-red-400 hover:bg-red-500', label: '▼ SELL' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-[14px] mb-3 border ${c.border} ${c.bg}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-[10px] py-[3px] rounded-full text-[10px] font-bold font-mono tracking-wider ${c.badge}`}>
          {c.label}
        </span>
        <span className="text-[14px] font-semibold font-mono">{signal.symbol.replace('.NS','')}</span>
        <span className="ml-auto text-[10px] text-[#5a6478]">
          {new Date(signal.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Reasons */}
      <div className="text-[11px] text-[#8b95a8] leading-[1.6] mb-3">
        {signal.reasons.join(' · ')}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          ['Confidence', `${signal.confidence}%`, isBuy ? 'text-emerald-400' : 'text-red-400'],
          ['Hold Time', signal.holdTime, 'text-white'],
          ['Target', fmtPrice(signal.target), 'text-emerald-400'],
          ['Stop Loss', fmtPrice(signal.stopLoss), 'text-red-400'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white/[0.04] rounded-lg p-[8px]">
            <div className="text-[9px] text-[#5a6478] uppercase tracking-[0.5px] mb-[3px]">{label}</div>
            <div className={`text-[13px] font-semibold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Indicators row */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          ['RSI', signal.indicators?.rsi],
          ['MACD', signal.indicators?.ema],
          ['Vol', signal.indicators?.volume],
          ['News', signal.indicators?.sentiment],
        ].map(([k, v]) => (
          <span key={k} className="text-[10px] font-mono bg-white/[0.05] px-2 py-[2px] rounded-md text-[#8b95a8]">
            {k}: <span className="text-white">{v}</span>
          </span>
        ))}
      </div>

      {/* Confidence bar */}
      <div className="w-full h-[3px] bg-white/[0.07] rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${signal.confidence}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${c.bar}`}
        />
      </div>

      {/* Action button */}
      {onTrade && (
        <button
          onClick={() => onTrade(signal)}
          className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 hover:text-white ${c.btn}`}
        >
          {isBuy ? '↑ Execute Buy · 1 share' : '↓ Execute Sell · 1 share'}
        </button>
      )}
    </motion.div>
  );
}
