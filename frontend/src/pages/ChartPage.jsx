import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore, STOCKS } from '../store';
import TradingChart from '../components/TradingChart';
import WatchlistPanel from '../components/WatchlistPanel';
import TradeForm from '../components/TradeForm';
import SignalCard from '../components/SignalCard';
import { fmtPrice } from '../utils/format';
import { generateClientSignal } from '../utils/signals';

const INTERVALS = ['1m','5m','15m','1D','1W'];
const CHART_TYPES = ['candle','line','area'];

export default function ChartPage() {
  const { currentSymbol, setCurrentSymbol, prices, chartType, setChartType, chartInterval, setChartInterval, executeTrade, addToast } = useStore();

  const [panelTab, setPanelTab] = useState('signal');
  const [bottomTab, setBottomTab] = useState('holdings');
  const [signal, setSignal] = useState(null);
  const { holdings, orders, balance } = useStore();

  const stock = STOCKS[currentSymbol];
  const priceData = prices[currentSymbol] || {};
  const ltp = priceData.price || stock?.basePrice || 0;
  const chg = priceData.change || 0;
  const chgPct = priceData.changePct || 0;
  const isUp = chgPct >= 0;

  // Generate signal when symbol changes
  useEffect(() => {
    const sig = generateClientSignal(currentSymbol, ltp, chgPct);
    setSignal(sig);
  }, [currentSymbol]);

  // Refresh signal periodically
  useEffect(() => {
    const id = setInterval(() => {
      const sig = generateClientSignal(currentSymbol, ltp, chgPct);
      setSignal(sig);
    }, 15000);
    return () => clearInterval(id);
  }, [currentSymbol, ltp]);

  const handleSignalTrade = (sig) => {
    const qty = 1;
    const price = sig.price;
    const type = sig.signal;
    const result = executeTrade(sig.symbol, type, qty, price);
    if (result.ok) {
      addToast({ type: type === 'BUY' ? 'buy' : 'sell', title: `${type} Executed`, message: `${qty} × ${sig.symbol.replace('.NS','')} @ ₹${price.toFixed(2)}` });
    } else {
      addToast({ type: 'error', title: 'Order Failed', message: result.error });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Portfolio mini-bar */}
      <div className="flex items-center gap-6 px-5 py-[8px] bg-[#111827] border-b border-white/[0.06] flex-shrink-0">
        {[
          ['Balance', `₹${balance.toLocaleString('en-IN',{maximumFractionDigits:0})}`, 'text-cyan-400'],
          ['Holdings', Object.keys(holdings).filter(s=>holdings[s].qty>0).length + ' stocks', 'text-white'],
          ['Orders', orders.length, 'text-white'],
        ].map(([label, val, color]) => (
          <div key={label}>
            <div className="text-[9px] text-[#5a6478] uppercase tracking-[0.5px]">{label}</div>
            <div className={`font-mono text-[13px] font-semibold mt-[1px] ${color}`}>{val}</div>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot inline-block" />
          <span className="text-[11px] text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">

        {/* Chart column */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Stock header */}
          <div className="flex items-center gap-4 px-5 py-3 bg-[#111827] border-b border-white/[0.06] flex-shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[12px] font-bold flex-shrink-0"
              style={{ background: `${stock?.color}22`, color: stock?.color, border: `1px solid ${stock?.color}44` }}>
              {stock?.abbr}
            </div>
            <div>
              <div className="text-[18px] font-semibold leading-none">{currentSymbol.replace('.NS','').replace('^','')}</div>
              <div className="text-[11px] text-[#5a6478] mt-[3px]">{stock?.exchange} · {stock?.name}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono text-[24px] font-semibold">₹{ltp.toFixed(2)}</div>
              <div className={`font-mono text-[13px] ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}₹{chg.toFixed(2)} ({isUp ? '+' : ''}{chgPct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Interval + type row */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111827] border-b border-white/[0.06] flex-shrink-0">
            <div className="flex gap-1">
              {INTERVALS.map(iv => (
                <button key={iv} onClick={() => setChartInterval(iv)}
                  className={`px-[10px] py-[4px] rounded-md text-[11px] font-mono font-medium transition-all
                    ${chartInterval === iv ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-[#8b95a8] hover:text-white hover:bg-white/[0.05]'}`}>
                  {iv}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="flex gap-1">
              {CHART_TYPES.map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-[8px] py-[4px] rounded-md text-[11px] font-mono transition-all
                    ${chartType === t ? 'bg-white/[0.08] text-white' : 'text-[#5a6478] hover:text-white'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10 mx-1" />
            {['RSI','MACD','EMA','BB','VWAP'].map(ind => (
              <button key={ind} className="px-[8px] py-[4px] rounded-md text-[11px] font-mono text-[#5a6478] hover:text-indigo-400 hover:bg-indigo-600/10 transition-all">{ind}</button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0">
            <TradingChart symbol={currentSymbol} interval={chartInterval} chartType={chartType} />
          </div>

          {/* Bottom tabs */}
          <div className="border-t border-white/[0.06] bg-[#111827] flex-shrink-0" style={{ height: '200px' }}>
            <div className="flex border-b border-white/[0.06]">
              {['holdings','orders'].map(tab => (
                <button key={tab} onClick={() => setBottomTab(tab)}
                  className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-all capitalize
                    ${bottomTab === tab ? 'text-indigo-400 border-indigo-500' : 'text-[#5a6478] border-transparent hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="overflow-auto h-[calc(100%-36px)]">
              {bottomTab === 'holdings' ? (
                <HoldingsTable holdings={holdings} prices={prices} />
              ) : (
                <OrdersTable orders={orders} />
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[290px] flex-shrink-0 border-l border-white/[0.06] bg-[#111827] flex flex-col overflow-hidden">
          <div className="flex border-b border-white/[0.06] flex-shrink-0">
            {[['signal','Signal'],['trade','Trade'],['stats','Stats']].map(([key,label]) => (
              <button key={key} onClick={() => setPanelTab(key)}
                className={`flex-1 py-3 text-[12px] font-medium border-b-2 transition-all
                  ${panelTab === key ? 'text-indigo-400 border-indigo-500' : 'text-[#5a6478] border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelTab === 'signal' && (
              <div className="p-3">
                {signal && <SignalCard signal={signal} onTrade={handleSignalTrade} />}
                <button onClick={() => { const s = generateClientSignal(currentSymbol, ltp, chgPct); setSignal(s); }}
                  className="w-full py-2 text-[11px] text-[#8b95a8] hover:text-white border border-white/[0.07] rounded-lg transition-all hover:border-white/20">
                  ↻ Refresh Signal
                </button>
              </div>
            )}
            {panelTab === 'trade' && <TradeForm symbol={currentSymbol} />}
            {panelTab === 'stats' && <StatsPanel symbol={currentSymbol} price={ltp} />}
          </div>
        </div>

        {/* Watchlist */}
        <WatchlistPanel selected={currentSymbol} onSelect={setCurrentSymbol} />
      </div>
    </div>
  );
}

function HoldingsTable({ holdings, prices }) {
  const entries = Object.entries(holdings).filter(([,h]) => h.qty > 0);
  if (!entries.length) return (
    <div className="flex items-center justify-center h-full text-[#5a6478] text-[13px]">No holdings yet.</div>
  );
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>{['Symbol','Qty','Avg','LTP','P&L'].map(h=><th key={h} className="text-left px-4 py-2 text-[10px] text-[#5a6478] uppercase tracking-[0.5px] font-medium">{h}</th>)}</tr>
      </thead>
      <tbody>
        {entries.map(([sym,h]) => {
          const ltp = prices[sym]?.price || STOCKS[sym]?.basePrice || 0;
          const pnl = (ltp - h.avgPrice) * h.qty;
          return (
            <tr key={sym} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
              <td className="px-4 py-[9px] font-mono font-semibold">{sym.replace('.NS','')}</td>
              <td className="px-4 py-[9px] font-mono">{h.qty}</td>
              <td className="px-4 py-[9px] font-mono">₹{h.avgPrice.toFixed(2)}</td>
              <td className="px-4 py-[9px] font-mono">₹{ltp.toFixed(2)}</td>
              <td className={`px-4 py-[9px] font-mono font-semibold ${pnl>=0?'text-emerald-400':'text-red-400'}`}>
                {pnl>=0?'+':''}₹{Math.abs(pnl).toFixed(0)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OrdersTable({ orders }) {
  if (!orders.length) return (
    <div className="flex items-center justify-center h-full text-[#5a6478] text-[13px]">No orders yet.</div>
  );
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>{['Type','Symbol','Qty','Price','P&L','Time'].map(h=><th key={h} className="text-left px-4 py-2 text-[10px] text-[#5a6478] uppercase tracking-[0.5px] font-medium">{h}</th>)}</tr>
      </thead>
      <tbody>
        {orders.slice(0,30).map((o,i) => (
          <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
            <td className={`px-4 py-[9px] font-mono font-bold ${o.type==='BUY'?'text-emerald-400':'text-red-400'}`}>{o.type}</td>
            <td className="px-4 py-[9px] font-mono font-semibold">{o.symbol.replace('.NS','')}</td>
            <td className="px-4 py-[9px] font-mono">{o.qty}</td>
            <td className="px-4 py-[9px] font-mono">₹{Number(o.price).toFixed(2)}</td>
            <td className={`px-4 py-[9px] font-mono ${o.pnl!=null?(o.pnl>=0?'text-emerald-400':'text-red-400'):'text-[#5a6478]'}`}>
              {o.pnl != null ? `${o.pnl>=0?'+':''}₹${Math.abs(o.pnl).toFixed(0)}` : '—'}
            </td>
            <td className="px-4 py-[9px] text-[#5a6478] text-[11px]">
              {new Date(o.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatsPanel({ symbol, price }) {
  const stats = [
    ['Open', `₹${(price*0.995).toFixed(2)}`],
    ['High', `₹${(price*1.018).toFixed(2)}`],
    ['Low', `₹${(price*0.982).toFixed(2)}`],
    ['Prev Close', `₹${(price*0.998).toFixed(2)}`],
    ['RSI (14)', (42+Math.random()*32).toFixed(1)],
    ['MACD', ((Math.random()-0.5)*18).toFixed(2)],
    ['EMA 20', `₹${(price*0.991).toFixed(2)}`],
    ['EMA 50', `₹${(price*0.972).toFixed(2)}`],
    ['VWAP', `₹${(price*1.002).toFixed(2)}`],
    ['P/E Ratio', (14+Math.random()*28).toFixed(1)],
    ['52W High', `₹${(price*1.22).toFixed(2)}`],
    ['52W Low', `₹${(price*0.75).toFixed(2)}`],
  ];
  return (
    <div className="p-3 flex flex-col gap-[6px]">
      {stats.map(([k,v]) => (
        <div key={k} className="flex justify-between items-center py-[7px] px-3 bg-white/[0.03] rounded-lg">
          <span className="text-[11px] text-[#8b95a8]">{k}</span>
          <span className="font-mono text-[12px] font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}
