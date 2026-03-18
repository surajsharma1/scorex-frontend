import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { getSocketUrl, getApiBaseUrl } from './env';

// Define typed events
export interface ServerToClientEvents {
  scoreUpdate: (data: any) => void;
  matchEvent: (data: { type: string; message: string }) => void;
  newMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  matchStatusUpdate: (data: any) => void;
  tournamentUpdate: (data: any) => void;
  notification: (data: any) => void;
  inningsEnded: () => void;
  matchEnded: (data: any) => void;
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
}

const SOCKET_URL = getSocketUrl();
const SESSION_KEY = 'socket_session_id';

const clearStaleSession = () => {
  try {
    const storedSid = localStorage.getItem(SESSION_KEY);
    if (storedSid) {
      console.log('Clearing stale socket session:', storedSid);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.warn('Could not access localStorage:', e);
  }
};

clearStaleSession();

const socketOptions: Partial<ManagerOptions & SocketOptions> = {
  withCredentials: true,
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: {
    token: localStorage.getItem('token')
  },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 10000,
  forceNew: true,
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, socketOptions);

// Socket status
export const getSocketStatus = () => socket.connected ? 'connected' : 'disconnected';

// Health check
const checkServerHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl().replace('/api/v1', '')}/api/health`, { 
      method: 'GET', 
      cache: 'no-cache' 
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Initialize
const initializeConnection = async () => {
  if (socket.connected) return;
  const healthy = await checkServerHealth();
  if (!healthy) console.warn('🚨 Backend health check failed');
  socket.connect();
};

initializeConnection();

// Events
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  if (socket.id) localStorage.setItem(SESSION_KEY, socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('❌ Socket disconnected:', reason);
  localStorage.removeItem(SESSION_KEY);
  if (reason === 'io server disconnect' || reason === 'transport close') socket.connect();
});

(socket.io as any).on('reconnect_attempt', (n) => console.log(`🔄 Reconnect attempt #${n}`));
(socket.io as any).on('reconnect', (n) => console.log(`✅ Reconnected after ${n} attempts`));
(socket.io as any).on('reconnect_failed', () => console.warn('🔄 Reconnect failed - retrying indefinitely'));
(socket.io as any).on('connect_error', (error) => {
  console.error('❌ Connect error:', error.message);
  if (error.message.includes('Session ID')) localStorage.removeItem(SESSION_KEY);
  setTimeout(initializeConnection, 5000);
});

// Legacy service
export class SocketService {
  connect() {
    if (!socket.connected) socket.connect();
    return socket;
  }
  getSocket() { return socket; }
  disconnect() { socket.disconnect(); }
  joinRoom(matchId: string) { socket.emit('joinMatch', matchId); }
  leaveRoom(matchId: string) { socket.emit('leaveMatch', matchId); }
  joinTournament(tournamentId: string) { socket.emit('joinTournament', tournamentId); }
  leaveTournament(tournamentId: string) { socket.emit('leaveTournament', tournamentId); }
  joinUserRoom(userId: string) { socket.emit('joinUserRoom', userId); }
  isConnected(): boolean { return socket.connected; }
  resetConnection() {
    socket.disconnect();
    setTimeout(() => socket.connect(), 500);
  }
}

export const socketService = new SocketService();

