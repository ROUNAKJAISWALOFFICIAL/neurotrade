import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const SENTIMENT_STYLE = {
  bullish: 'bg-emerald-500/15 text-emerald-400',
  bearish: 'bg-red-500/12 text-red-400',
  neutral: 'bg-white/[0.08] text-[#8b95a8]',
};

export default function News() {
  const navigate = useNavigate();
  const { setCurrentSymbol } = useStore();

  const [news, setNews] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((item, index) => ({
          id: index + 1,
          headline: item.headline || item.title || 'No headline',
          summary: item.summary || item.description || 'No summary available',
          source: item.source || 'NewsAPI',
          time: item.time || 'Recently',
          sentiment: item.sentiment || 'neutral',
          score: item.score || 0,
          symbol: item.symbol || 'NIFTY',
          sector: item.sector || 'Market'
        }));

        setNews(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  }, []);

  const filtered =
    filter === 'ALL'
      ? news
      : news.filter(n => n.sentiment === filter.toLowerCase());

  const goToStock = (sym) => {
    setCurrentSymbol(sym);
    navigate('/chart');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold">Market News</h1>
          <p className="text-[12px] text-[#5a6478] mt-1">
            Live financial news feed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot inline-block" />
          <span className="text-[12px] text-emerald-400">Live Feed</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          [
            'Bullish',
            news.filter(n => n.sentiment === 'bullish').length,
            'text-emerald-400',
            'bg-emerald-500/[0.07] border-emerald-500/20'
          ],
          [
            'Neutral',
            news.filter(n => n.sentiment === 'neutral').length,
            'text-[#8b95a8]',
            'bg-white/[0.03] border-white/[0.07]'
          ],
          [
            'Bearish',
            news.filter(n => n.sentiment === 'bearish').length,
            'text-red-400',
            'bg-red-500/[0.06] border-red-500/18'
          ],
        ].map(([label, count, color, bg], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`border rounded-2xl p-4 ${bg}`}
          >
            <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">
              {label} News
            </div>

            <div className={`text-[26px] font-semibold font-mono ${color}`}>
              {count}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'BULLISH', 'NEUTRAL', 'BEARISH'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-[6px] rounded-lg text-[12px] font-medium transition-all
              ${
                filter === f
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-[#8b95a8] border border-white/[0.07] hover:text-white'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-[#8b95a8] mt-10">
          Loading news...
        </div>
      )}

      {/* News List */}
      <div className="flex flex-col gap-3">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4 hover:border-white/15 transition-all cursor-pointer"
            onClick={() =>
              setExpanded(expanded === item.id ? null : item.id)
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`px-2 py-[2px] rounded-md text-[9px] font-bold uppercase tracking-[0.5px] ${SENTIMENT_STYLE[item.sentiment]}`}
                  >
                    {item.sentiment}
                  </span>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      goToStock(item.symbol);
                    }}
                    className="px-2 py-[2px] rounded-md text-[9px] bg-indigo-600/15 text-indigo-400 font-mono hover:bg-indigo-600/25 transition-all"
                  >
                    {item.symbol.replace('.NS', '').replace('^', '')}
                  </button>

                  <span className="text-[10px] text-[#5a6478]">
                    {item.sector}
                  </span>
                </div>

                <p className="text-[13px] text-white leading-[1.5] mb-2">
                  {item.headline}
                </p>

                {expanded === item.id && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[12px] text-[#8b95a8] leading-[1.6] mt-2 pt-2 border-t border-white/[0.06]"
                  >
                    {item.summary}
                  </motion.p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-[#5a6478]">
                  {item.source}
                </div>

                <div className="text-[10px] text-[#5a6478] mt-1">
                  {item.time}
                </div>

                <div
                  className={`font-mono text-[12px] font-semibold mt-2 ${
                    item.score > 0
                      ? 'text-emerald-400'
                      : item.score < 0
                      ? 'text-red-400'
                      : 'text-[#8b95a8]'
                  }`}
                >
                  {item.score > 0 ? '+' : ''}
                  {Number(item.score).toFixed(2)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}