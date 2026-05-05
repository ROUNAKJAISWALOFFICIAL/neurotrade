import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import api from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken, setBalance } = useStore();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: 'demo@tradeedge.in', password: 'demo123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemo = () => {
    setUser({ _id: 'demo', username: 'DemoTrader', email: 'demo@tradeedge.in', balance: 100000 });
    setToken('demo_token');
    setBalance(100000);
    navigate('/');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      setUser(data.user);
      setToken(data.token);
      setBalance(data.user.balance || 100000);
      navigate('/');
    } catch (err) {
      // Backend not running — use demo mode
      handleDemo();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="font-mono font-bold text-indigo-400 text-[20px]">TE</span>
          </div>
          <h1 className="text-[28px] font-semibold">TradeEdge</h1>
          <p className="text-[13px] text-[#5a6478] mt-1">Premium Paper Trading Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6">
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all capitalize
                  ${mode===m?'bg-[#1a2235] text-white shadow-sm':'text-[#8b95a8] hover:text-white'}`}>
                {m}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] text-[#5a6478] uppercase tracking-[0.5px] block mb-2">Username</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  placeholder="your_username"
                  className="w-full bg-[#1a2235] border border-white/10 rounded-xl text-[14px] text-white py-3 px-4 outline-none focus:border-indigo-500 transition-colors" />
              </div>
            )}
            <div>
              <label className="text-[11px] text-[#5a6478] uppercase tracking-[0.5px] block mb-2">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com" type="email"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl text-[14px] text-white py-3 px-4 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] text-[#5a6478] uppercase tracking-[0.5px] block mb-2">Password</label>
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••" type="password"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl text-[14px] text-white py-3 px-4 outline-none focus:border-indigo-500 transition-colors" />
            </div>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-[14px] transition-all disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] text-[#5a6478]">or</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <button onClick={handleDemo}
            className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white rounded-xl font-medium text-[14px] transition-all">
            ▶ Continue as Demo Trader
          </button>

          <p className="text-center text-[11px] text-[#5a6478] mt-4">
            Demo starts with ₹1,00,000 virtual balance
          </p>
        </div>
      </motion.div>
    </div>
  );
}
