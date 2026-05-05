import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { useSocket } from './hooks/useSocket';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChartPage from './pages/ChartPage';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import AISignals from './pages/AISignals';
import News from './pages/News';
import Login from './pages/Login';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const { token, setUser, setToken, setBalance } = useStore();
  useSocket();

  // Auto demo login if no token
  useEffect(() => {
    if (!token) {
      // Auto-login as demo user
      const demoUser = { _id: 'demo', username: 'DemoTrader', email: 'demo@tradeedge.in', balance: 100000 };
      setUser(demoUser);
      setToken('demo_token');
      setBalance(100000);
    } else {
      // Restore demo user from token
      setUser({ _id: 'demo', username: 'DemoTrader', email: 'demo@tradeedge.in', balance: 100000 });
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="chart" element={<ChartPage />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="orders" element={<Orders />} />
          <Route path="ai" element={<AISignals />} />
          <Route path="news" element={<News />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}
