/**
 * socketService.js — Socket.io bootstrap & helpers
 *
 * Lifecycle:
 *   1. index.js calls initSocketServer(httpServer) once on startup.
 *   2. Each browser connects and authenticates with its JWT (query or header).
 *   3. notificationService calls emitToUser(username, event, data) or emitBroadcast(event, data).
 */
import { Server } from 'socket.io';
import { verifyToken } from './jwt.js';

let _io = null;
// username → Set<socketId> (one user may have multiple tabs)
const userSockets = new Map();

export function initSocketServer(httpServer, corsOrigins) {
  _io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // JWT middleware — client must pass token in handshake query or auth header
  _io.use((socket, next) => {
    try {
      const raw =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        null;
      if (!raw) return next(new Error('Unauthorized: no token'));
      const payload = verifyToken(raw);
      socket.data.username = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  _io.on('connection', (socket) => {
    const username = socket.data.username;
    if (!userSockets.has(username)) userSockets.set(username, new Set());
    userSockets.get(username).add(socket.id);
    console.log(`[socket] connect  ${username} (${socket.id})`);

    socket.on('disconnect', () => {
      const ids = userSockets.get(username);
      if (ids) {
        ids.delete(socket.id);
        if (ids.size === 0) userSockets.delete(username);
      }
      console.log(`[socket] disconnect ${username} (${socket.id})`);
    });
  });

  console.log('[socket] Socket.io server initialised');
  return _io;
}

/**
 * Push a notification to a specific logged-in user.
 * If the user has multiple tabs open, all receive the event.
 */
export function emitToUser(username, event, data) {
  if (!_io || !username) return;
  const ids = userSockets.get(username);
  if (!ids?.size) return;
  for (const sid of ids) {
    _io.to(sid).emit(event, data);
  }
}

/**
 * Push a notification to every connected socket (broadcast).
 */
export function emitBroadcast(event, data) {
  if (!_io) return;
  _io.emit(event, data);
}

export function getIo() {
  return _io;
}
