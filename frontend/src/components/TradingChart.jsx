import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { useStore, STOCKS } from '../store';

function generateCandles(basePrice, count = 150, intervalSec = 86400) {
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const candles = [];

  for (let i = count; i >= 0; i--) {
    const open = price;

    const volatility =
      intervalSec <= 60 ? 0.0015 :
      intervalSec <= 300 ? 0.002 :
      intervalSec <= 900 ? 0.003 :
      0.005;

    const change = (Math.random() - 0.5) * price * volatility;
    const close = open + change;

    const high =
      Math.max(open, close) + Math.random() * price * volatility * 0.5;

    const low =
      Math.min(open, close) - Math.random() * price * volatility * 0.5;

    candles.push({
      time: now - i * intervalSec,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(100000 + Math.random() * 500000),
    });

    price = close;
  }

  return candles;
}

const INTERVAL_SECONDS = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1D': 86400,
  '1W': 604800,
};

export default function TradingChart({ symbol, interval, chartType }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // store candle history by symbol+interval
  const candleDataRef = useRef({});

  const prices = useStore((s) => s.prices);
  const livePrice = prices[symbol]?.price;

  const destroyChart = () => {
    if (chartRef.current) {
      try {
        if (chartRef.current._ro) {
          chartRef.current._ro.disconnect();
        }
        chartRef.current.remove();
      } catch {}

      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
  };

  const buildChart = useCallback(() => {
    if (!containerRef.current) return;

    destroyChart();

    const stock = STOCKS[symbol];
    if (!stock) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 400;

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { color: '#0a0e1a' },
        textColor: '#8b95a8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.07)',
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.07)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    const ivSec = INTERVAL_SECONDS[interval] || 86400;
    const key = `${symbol}-${interval}`;

    // generate candles only once per symbol+interval
    if (!candleDataRef.current[key]) {
      candleDataRef.current[key] = generateCandles(
        stock.basePrice,
        interval === '1W' ? 52 : interval === '1m' ? 200 : 150,
        ivSec
      );
    }

    const candles = candleDataRef.current[key];

    const volData = candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color:
        c.close >= c.open
          ? 'rgba(16,185,129,0.38)'
          : 'rgba(239,68,68,0.32)',
    }));

    // volume series
    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volSeries.setData(volData);
    volumeSeriesRef.current = volSeries;

    // main chart series
    if (chartType === 'candle') {
      const cs = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      cs.setData(candles);
      mainSeriesRef.current = cs;
    } else if (chartType === 'line') {
      const ls = chart.addLineSeries({
        color: '#6366f1',
        lineWidth: 2,
      });

      ls.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.close,
        }))
      );

      mainSeriesRef.current = ls;
    } else {
      const as = chart.addAreaSeries({
        topColor: 'rgba(99,102,241,0.28)',
        bottomColor: 'rgba(99,102,241,0.02)',
        lineColor: '#6366f1',
        lineWidth: 2,
      });

      as.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.close,
        }))
      );

      mainSeriesRef.current = as;
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 400,
        });
      }
    });

    ro.observe(containerRef.current);
    chartRef.current._ro = ro;
  }, [symbol, interval, chartType]);

  useEffect(() => {
    buildChart();
    return destroyChart;
  }, [buildChart]);

  // live chart update
  useEffect(() => {
    if (!livePrice || !mainSeriesRef.current) return;

    const key = `${symbol}-${interval}`;
    const candles = candleDataRef.current[key];

    if (!candles || !candles.length) return;

    const newClose = +Number(livePrice).toFixed(2);
    const last = candles[candles.length - 1];

    const updated = {
      ...last,
      close: newClose,
      high: Math.max(last.high, newClose),
      low: Math.min(last.low, newClose),
    };

    candles[candles.length - 1] = updated;

    try {
      if (chartType === 'candle') {
        mainSeriesRef.current.update(updated);
      } else {
        mainSeriesRef.current.update({
          time: updated.time,
          value: updated.close,
        });
      }
    } catch {}
  }, [livePrice, symbol, interval, chartType]);

  return <div ref={containerRef} className="w-full h-full" />;
}