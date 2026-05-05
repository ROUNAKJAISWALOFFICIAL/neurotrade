import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';

const ICONS = {
  buy:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '↑', border: 'border-emerald-500/25' },
  sell:  { bg: 'bg-red-500/12',     text: 'text-red-400',     icon: '↓', border: 'border-red-500/20' },
  error: { bg: 'bg-yellow-500/12',  text: 'text-yellow-400',  icon: '!', border: 'border-yellow-500/20' },
  info:  { bg: 'bg-indigo-500/12',  text: 'text-indigo-400',  icon: 'i', border: 'border-indigo-500/20' },
};

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);

  return (
    <div className="fixed bottom-6 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const style = ICONS[t.type] || ICONS.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`bg-[#111827] border ${style.border} rounded-xl p-3 min-w-[260px] max-w-[300px] shadow-2xl pointer-events-auto flex items-start gap-3`}
            >
              <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`${style.text} font-mono text-[14px] font-bold`}>{style.icon}</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{t.title}</div>
                <div className="text-[11px] text-[#8b95a8] mt-[2px] leading-[1.4]">{t.message}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
