import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store';

let socketInstance = null;

export function useSocket() {
  const { token, setPrices, addSignal } = useStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    socketInstance = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socketInstance.on('price:update', (updates) => {
      setPrices(updates);
    });

    socketInstance.on('ai:signal', (signal) => {
      addSignal(signal);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket error:', err.message);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        connectedRef.current = false;
      }
    };
  }, []);

  return socketInstance;
}

export function subscribeToStock(symbol) {
  if (socketInstance) socketInstance.emit('subscribe:stock', symbol);
}

export function unsubscribeFromStock(symbol) {
  if (socketInstance) socketInstance.emit('unsubscribe:stock', symbol);
}
