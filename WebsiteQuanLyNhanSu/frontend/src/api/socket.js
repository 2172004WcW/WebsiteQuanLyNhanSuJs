/**
 * socket.js — Singleton Socket.io-client
 *
 * Cách dùng:
 *   import { initSocket, getSocket, disconnectSocket } from './socket.js';
 *   initSocket(getToken());   // token theo tab (sessionStorage) — DashboardLayout
 *   getSocket()?.on('new_notification', cb);     // trong bất kỳ component nào
 *   disconnectSocket();                          // khi logout / unmount layout
 */
import { io } from 'socket.io-client';

let _socket = null;

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081');

export function initSocket(token) {
  if (_socket?.connected) return _socket;

  // Ngắt kết nối cũ nếu có (ví dụ: đổi tài khoản)
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(BACKEND_URL, {
    path: '/socket.io',
    auth: { token },
    // Fallback về polling rồi nâng cấp lên websocket
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  _socket.on('connect', () => {
    console.log('[socket] connected', _socket.id);
  });
  _socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err.message);
  });
  _socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  return _socket;
}

export function getSocket() {
  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
