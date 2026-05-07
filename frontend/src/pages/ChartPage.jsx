import React, { useState, useEffect } from 'react';
import { useStore, STOCKS } from '../store';
import TradingChart from '../components/TradingChart';
import WatchlistPanel from '../components/WatchlistPanel';
import TradeForm from '../components/TradeForm';
import SignalCard from '../components/SignalCard';
import { generateClientSignal } from '../utils/signals';

const INTERVALS = ['1m','5m','15m','1D','1W'];
const CHART_TYPES = ['candle','line','area'];

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return day >= 1 && day <= 5 && minutes >= 9*60+15 && minutes <= 15*60+30;
}

export default function ChartPage() {

  const {
    currentSymbol,
    setCurrentSymbol,
    prices,
    chartType,
    setChartType,
    chartInterval,
    setChartInterval,
    executeTrade,
    addToast,
    holdings,
    orders,
    balance
  } = useStore();

  const [panelTab, setPanelTab] = useState('signal');
  const [bottomTab, setBottomTab] = useState('holdings');
  const [signal, setSignal] = useState(null);

  const stock = STOCKS[currentSymbol];
  const priceData = prices[currentSymbol] || {};

  const ltp = Number(priceData.price || stock?.basePrice || 0);
  const chg = Number(priceData.change || 0);
  const chgPct = Number(priceData.changePct || 0);
  const isUp = chgPct >= 0;

  // REAL SIGNAL (no random refresh logic dependency)
  useEffect(() => {
    if (!ltp) return;

    const sig = generateClientSignal(currentSymbol, ltp, chgPct);
    setSignal(sig);
  }, [currentSymbol, ltp, chgPct]);

  const handleSignalTrade = async (sig) => {
    if (!isMarketOpen()) {
      addToast({
        type: 'error',
        title: 'Market Closed',
        message: 'Trades can only be executed during market hours'
      });
      return;
    }

    const result = await executeTrade(sig.symbol, sig.signal, 1, sig.price);

    if (result.ok) {
      addToast({
        type: sig.signal === 'BUY' ? 'buy' : 'sell',
        title: `${sig.signal} Executed`,
        message: `${sig.symbol} @ ₹${sig.price}`
      });
    } else {
      addToast({
        type: 'error',
        title: 'Order Failed',
        message: result.error
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center gap-6 px-5 py-2 bg-[#111827] border-b border-white/10">
        <div className="text-cyan-400 font-mono">
          Balance ₹{balance}
        </div>

        <div className="text-white font-mono">
          Holdings {Object.values(holdings).filter(h => h.qty > 0).length}
        </div>

        <div className="text-white font-mono">
          Orders {orders.length}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={isMarketOpen() ? 'text-green-400' : 'text-red-400'}>
            {isMarketOpen() ? 'Live' : 'Closed'}
          </span>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT */}
        <div className="flex flex-col flex-1">

          {/* PRICE */}
          <div className="p-3 bg-[#111827] border-b border-white/10 flex justify-between">
            <div>
              <div className="text-xl text-white">{currentSymbol}</div>
              <div className="text-gray-400 text-sm">{stock?.name}</div>
            </div>

            <div className="text-right">
              <div className="text-2xl text-white">₹{ltp.toFixed(2)}</div>
              <div className={isUp ? 'text-green-400' : 'text-red-400'}>
                {chg.toFixed(2)} ({chgPct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* CHART */}
          <div className="flex-1">
            <TradingChart
              symbol={currentSymbol}
              interval={chartInterval}
              chartType={chartType}
            />
          </div>

          {/* BOTTOM */}
          <div className="h-[200px] border-t border-white/10 overflow-auto">
            {bottomTab === 'holdings' ? (
              <HoldingsTable holdings={holdings} prices={prices} />
            ) : (
              <OrdersTable orders={orders} />
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[300px] border-l border-white/10 bg-[#111827]">

          {panelTab === 'signal' && (
            <div className="p-3">
              {signal && (
                <SignalCard signal={signal} onTrade={handleSignalTrade} />
              )}
            </div>
          )}

          {panelTab === 'trade' && <TradeForm symbol={currentSymbol} />}
        </div>

        <WatchlistPanel
          selected={currentSymbol}
          onSelect={setCurrentSymbol}
        />
      </div>
    </div>
  );
  function HoldingsTable({ holdings = {}, prices = {} }) {
  const entries = Object.entries(holdings).filter(([, h]) => h.qty > 0);

  if (!entries.length) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No holdings yet
      </div>
    );
  }

  return (
    <div className="p-2">
      {entries.map(([sym, h]) => {
        const ltp = prices[sym]?.price || h.avgPrice || 0;
        const pnl = (ltp - h.avgPrice) * h.qty;

        return (
          <div key={sym} className="flex justify-between p-2 border-b border-white/10">
            <span>{sym.replace('.NS','')}</span>
            <span>{h.qty}</span>
            <span>₹{ltp.toFixed(2)}</span>
            <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
              {pnl.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function OrdersTable({ orders = [] }) {
  if (!orders.length) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No orders yet
      </div>
    );
  }

  return (
    <div className="p-2">
      {orders.map((o, i) => (
        <div key={i} className="flex justify-between p-2 border-b border-white/10">
          <span className={o.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
            {o.type}
          </span>
          <span>{o.symbol}</span>
          <span>{o.qty}</span>
          <span>₹{Number(o.price).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
}