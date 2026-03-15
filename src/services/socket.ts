/**
 * Socket Service — Fixed & Rewritten
 *
 * BUGS FIXED:
 * 1. Dual room naming convention mismatch — the server emits to `match:${id}`
 *    but some client components joined only `matchId` (without the prefix), so
 *    they never received live score updates.
 *    FIX: joinRoom always emits BOTH 'joinMatch' (server joins match:id) AND
 *    'join_match' (server also joins plain matchId) — this matches the server.ts
 *    which already handles both formats for backward compat.
 * 2. Token read once at module load — if user logs in AFTER the socket module
 *    is imported, the auth token is stale/missing.
 *    FIX: read token lazily inside the auth object getter.
 */

import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

export interface ServerToClientEvents {
  scoreUpdate: (data: any) => void;
  matchEvent: (data: { type: string; message: string }) => void;
  newMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  matchStatusUpdate: (data: any) => void;
  inningsEnded: (data: any) => void;
  matchEnded: (data: any) => void;
  tournamentUpdate: (data: any) => void;
  notification: (data: any) => void;
  userTyping: (data: any) => void;
  match_updated: (updatedMatchState: any) => void;
}

export interface ClientToServerEvents {
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  join_match: (matchId: string) => void;
  leave_match: (matchId: string) => void;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  updateScore: (data: { tournamentId: string; match: any }) => void;
  updateMatchStatus: (data: { matchId: string; tournamentId: string; status: string }) => void;
  joinUserRoom: (userId: string) => void;
  typing: (data: { roomId: string; userId: string; isTyping: boolean }) => void;
}

// Strip /api/v1 to get the root WebSocket URL
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = baseUrl.replace(/\/api\/v1\/?$/, '');

const SESSION_KEY = 'socket_session_id';

// Clear any stale session ID on module load to prevent "Session ID unknown" errors
try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }

const socketOptions: Partial<ManagerOptions & SocketOptions> = {
  withCredentials: true,
  autoConnect: true,
  transports: ['websocket', 'polling'],
  // FIX #2: read token lazily so it's always current
  auth: (cb: (data: object) => void) => {
    cb({ token: localStorage.getItem('token') || '' });
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  forceNew: true,
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, socketOptions);

// ─── Connection Events ─────────────────────────────────────────────────────

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  try { if (socket.id) localStorage.setItem(SESSION_KEY, socket.id); } catch { /* ignore */ }
});

socket.on('disconnect', (reason) => {
  console.warn('❌ WebSocket disconnected:', reason);
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  if (reason === 'io server disconnect' || reason === 'transport close') {
    socket.connect();
  }
});

(socket.io as any).on('reconnect_attempt', (n: number) => {
  console.log(`🔄 Reconnect attempt #${n}`);
  (socket.io as any).opts.forceNew = true;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
});

(socket.io as any).on('reconnect', (n: number) => {
  console.log(`✅ Reconnected after ${n} attempt(s)`);
  try { if (socket.id) localStorage.setItem(SESSION_KEY, socket.id); } catch { /* ignore */ }
});

(socket.io as any).on('connect_error', (err: Error) => {
  console.error('❌ Socket connect error:', err.message);
  if (err.message?.includes('Session ID')) {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }
});

// ─── Service Class ─────────────────────────────────────────────────────────

class SocketService {
  connect() {
    if (!socket.connected) socket.connect();
    return socket;
  }

  getSocket() { return socket; }
  disconnect() { socket.disconnect(); }
  isConnected() { return socket.connected; }

  // FIX #1: emit both room formats so the component receives events regardless
  // of which format the server emits to (server.ts already joins both on its side)
  joinRoom(matchId: string) {
    socket.emit('joinMatch', matchId);   // server joins match:${matchId}
    socket.emit('join_match', matchId);  // server joins plain ${matchId}
  }

  leaveRoom(matchId: string) {
    socket.emit('leaveMatch', matchId);
    socket.emit('leave_match', matchId);
  }

  joinTournament(tournamentId: string) {
    socket.emit('joinTournament', tournamentId);
  }

  leaveTournament(tournamentId: string) {
    socket.emit('leaveTournament', tournamentId);
  }

  joinUserRoom(userId: string) {
    socket.emit('joinUserRoom', userId);
  }

  resetConnection() {
    socket.disconnect();
    setTimeout(() => socket.connect(), 500);
  }
}

export const socketService = new SocketService();
