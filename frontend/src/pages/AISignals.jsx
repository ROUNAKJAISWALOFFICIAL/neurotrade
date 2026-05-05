import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, STOCKS } from '../store';
import SignalCard from '../components/SignalCard';

export default function AISignals() {
  const navigate = useNavigate();
  const { prices, setCurrentSymbol, executeTrade, addToast } = useStore();

  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const generateAll = async () => {
    setLoading(true);

    try {
      const syms = Object.keys(STOCKS);

      const sigs = await Promise.all(
        syms.map(async (sym) => {
          try {
            const instrumentKey =
              STOCKS[sym].instrumentKey || STOCKS[sym].symbol || sym;

            const res = await fetch(
              `http://127.0.0.1:8000/signal/${encodeURIComponent(
                instrumentKey
              )}`
            );

            const data = await res.json();

            return {
              ...data.signal,
              symbol: sym,
            };
          } catch (err) {
            console.error(`Signal fetch failed for ${sym}`, err);

            return {
              symbol: sym,
              signal: 'HOLD',
              confidence: 0,
              price: prices[sym]?.price || STOCKS[sym].basePrice || 0,
              target: 0,
              stopLoss: 0,
              holdTime: 'N/A',
              reasons: ['Failed to fetch AI signal'],
              indicators: {},
              timestamp: new Date().toISOString(),
            };
          }
        })
      );

      setSignals(sigs);
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAll();
  }, []);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const id = setInterval(generateAll, 20000);
    return () => clearInterval(id);
  }, [prices]);

  const filtered =
    filter === 'ALL'
      ? signals
      : signals.filter((s) => s.signal === filter);

  const buyCount = signals.filter((s) => s.signal === 'BUY').length;
  const sellCount = signals.filter((s) => s.signal === 'SELL').length;

  const avgConf = signals.length
    ? Math.round(
        signals.reduce((a, s) => a + (s.confidence || 0), 0) /
          signals.length
      )
    : 0;

  const handleTrade = (sig) => {
    const result = executeTrade(
      sig.symbol,
      sig.signal,
      1,
      sig.price
    );

    if (result.ok) {
      addToast({
        type: sig.signal === 'BUY' ? 'buy' : 'sell',
        title: `${sig.signal} Executed`,
        message: `1 × ${sig.symbol} @ ₹${sig.price?.toFixed(2)}`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Order Failed',
        message: result.error,
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold">
            AI Signal Engine
          </h1>
          <p className="text-[12px] text-[#5a6478] mt-1">
            Real Python AI + Upstox analysis · Auto-refreshes every 20s
          </p>
        </div>

        <button
          onClick={generateAll}
          className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-[13px] font-medium hover:bg-indigo-600/30 transition-all"
        >
          ↻ Refresh All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ['Total Signals', signals.length, 'text-white'],
          ['Buy Signals', buyCount, 'text-emerald-400'],
          ['Sell Signals', sellCount, 'text-red-400'],
          ['Avg Confidence', `${avgConf}%`, 'text-indigo-400'],
        ].map(([label, val, color], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4"
          >
            <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">
              {label}
            </div>
            <div
              className={`text-[22px] font-semibold font-mono ${color}`}
            >
              {val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Signal grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-[#8b95a8]">
              Analysing real market signals…
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((sig, i) => (
            <motion.div
              key={`${sig.symbol}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <SignalCard
                signal={sig}
                onTrade={handleTrade}
              />

              <button
                onClick={() => {
                  setCurrentSymbol(sig.symbol);
                  navigate('/chart');
                }}
                className="w-full mt-[-8px] mb-3 py-[6px] text-[11px] text-[#8b95a8] hover:text-indigo-400 border border-white/[0.06] rounded-b-2xl transition-all bg-[#111827] hover:border-indigo-500/20"
              >
                View Chart →
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}