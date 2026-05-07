import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  const { token, setHoldings, setOrders, setBalance, setUser, setPrices, logout } = useStore();
  const navigate = useNavigate();
  useSocket();

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const res = await fetch('/api/stocks/prices');
        const data = await res.json();
        if (data.prices) setPrices(data.prices);
      } catch (err) {
        console.warn('Failed to load live prices:', err);
      }
    };
    loadPrices();
  }, [setPrices]);

  useEffect(() => {
    if (!token) return;

    const syncState = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [uRes, hRes, oRes] = await Promise.all([
          fetch('/api/auth/me', { headers }),
          fetch('/api/trades/holdings', { headers }),
          fetch('/api/trades/orders', { headers })
        ]);

        if (uRes.status === 401 || hRes.status === 401 || oRes.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        const userData = await uRes.json();
        const holdData = await hRes.json();
        const orderData = await oRes.json();

        if (userData.user) setUser(userData.user);
        if (userData.user?.balance !== undefined) setBalance(userData.user.balance);
        if (holdData.holdings) setHoldings(holdData.holdings.reduce((acc, h) => ({ ...acc, [h.symbol]: h }), {}));
        if (orderData.orders) setOrders(orderData.orders);
      } catch (err) {
        console.error('Sync failed', err);
      }
    };
    syncState();
  }, [token, setHoldings, setOrders, setBalance, setUser, logout, navigate]);

  return (
    <>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
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
