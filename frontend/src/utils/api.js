import axios from 'axios';
import { useStore } from '../store';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('te_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('te_token');
      const logout = useStore.getState().logout;
      if (typeof logout === 'function') logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
