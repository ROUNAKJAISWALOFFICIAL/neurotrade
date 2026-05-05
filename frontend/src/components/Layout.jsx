import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, STOCKS } from '../store';
import { fmtPrice, fmtPct } from '../utils/format';

const NAV = [
  { to: '/',         label: 'Dash',   icon: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z' },
  { to: '/chart',    label: 'Chart',  icon: 'M22 12l-4 0-3 9-6-18-3 9-4 0' },
  { to: '/portfolio',label: 'Port',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { to: '/orders',   label: 'Orders', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8' },
  { to: '/ai',       label: 'AI',     icon: 'M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5M12 17v5M8 21h8' },
  { to: '/news',     label: 'News',   icon: 'M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8V6z' },
];

function TickerStrip() {
  const prices = useStore(s => s.prices);
  const items = Object.entries(STOCKS).map(([sym, info]) => {
    const p = prices[sym] || {};
    const price = p.price || info.basePrice;
    const chg = p.changePct || 0;
    const isUp = chg >= 0;
    return { sym, price, chg, isUp };
  });
  const doubled = [...items, ...items];

  return (
    <div className="h-[42px] bg-[#111827] border-b border-white/[0.06] flex items-center overflow-hidden relative">
      <div className="flex gap-0 ticker-scroll whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-5 border-r border-white/[0.05] flex-shrink-0">
            <span className="font-mono text-[11px] text-[#8b95a8] font-medium">{item.sym.replace('.NS','').replace('.BSE','')}</span>
            <span className={`font-mono text-[12px] font-semibold ${item.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{item.price.toFixed(2)}
            </span>
            <span className={`font-mono text-[10px] ${item.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {item.isUp ? '▲' : '▼'}{Math.abs(item.chg).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, page } = useStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Ticker */}
      <TickerStrip />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-[68px] flex-shrink-0 bg-[#111827] border-r border-white/[0.06] flex flex-col items-center py-4 gap-1">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3 flex-shrink-0">
            <span className="font-mono font-bold text-indigo-400 text-[13px]">TE</span>
          </div>

          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-[3px] cursor-pointer transition-all duration-200 no-select
                text-[9px] font-medium tracking-wide
                ${isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25'
                  : 'text-[#5a6478] hover:bg-white/[0.04] hover:text-[#8b95a8]'
                }`
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[18px] h-[18px]">
                {icon.split('M').filter(Boolean).map((d, i) => (
                  <path key={i} d={`M${d}`} strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>
              {label}
            </NavLink>
          ))}

          <div className="flex-1" />

          {/* User avatar */}
          <div className="w-10 h-10 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center cursor-pointer flex-shrink-0">
            <span className="font-mono text-indigo-400 text-[12px] font-semibold">
              {user?.username?.slice(0, 2).toUpperCase() || 'DT'}
            </span>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
