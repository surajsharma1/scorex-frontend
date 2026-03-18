import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { getApiBaseUrl } from './env';
import { getSocketUrl } from './env';

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
  inningsEnded: () => void;  // NEW: Fixes LiveScoring socket.on/off
  matchEnded: (data: any) => void;  // NEW: Fixes LiveScoring socket.on/off
  
  // Live Match feature events
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

// Production-ready socket URL (handles env/relative/localhost)
const SOCKET_URL = getSocketUrl();


// ==========================================
// SESSION MANAGEMENT
// ==========================================
const SESSION_KEY = 'socket_session_id';

// Clear stale session on startup to prevent "Session ID unknown" errors
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

// Clear any stale session on module load
clearStaleSession();


// ==========================================
// SOCKET CONNECTION WITH PROPER ERROR HANDLING
// ==========================================

// Custom socket.io parser to handle session errors
const socketOptions: Partial<ManagerOptions & SocketOptions> = {
  withCredentials: true,
  autoConnect: false, // Manual control
  transports: ['websocket', 'polling'],
  auth: {
    token: localStorage.getItem('token')
  },
  // Infinite reconnection (never give up)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 10000,
  forceNew: true,
};

// Create socket instance
// Connection status hook
// Socket status tracker (no React hooks - service module)
let connectionStatus = 'disconnected';
export const getSocketStatus = () => connectionStatus;

// Health check before connect
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

// Auto-connect with health check
const initializeConnection = async () => {
  if (socket.connected) return;
  
  const healthy = await checkServerHealth();
  if (!healthy) {
    console.warn('🚨 Backend health check failed - will retry connection...');
  }
  
  console.log('🔌 Initializing socket connection...');
  socket.connect();
};

initializeConnection();

// Export socket
export const socket = io(SOCKET_URL, socketOptions) as Socket<ServerToClientEvents, ClientToServerEvents>;

// ==========================================
// CONNECTION EVENT HANDLERS
// ==========================================

// Handle successful connection
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server:', socket.id);
  
  // Store the session ID for debugging
  try {
    if (socket.id) {
      localStorage.setItem(SESSION_KEY, socket.id);
    }
  } catch (e) {
    console.warn('Could not store session ID:', e);
  }
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.warn('❌ Disconnected from WebSocket server:', reason);
  
  // Clear stored session on disconnect
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Could not clear session:', e);
  }
  
  // If server disconnected us (not manual), attempt reconnection logic
  if (reason === 'io server disconnect' || reason === 'transport close') {
    console.log('Server initiated disconnect, reconnecting...');
    socket.connect();
  }
});

// Handle reconnection attempts
(socket.io as any).on('reconnect_attempt', (attemptNumber: number) => {
  console.log(`🔄 Reconnection attempt #${attemptNumber}`);
  
  // Force new connection on each reattempt to avoid stale session
  (socket.io as any).opts.forceNew = true;
  
  // Clear any stored session before reconnecting
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Could not clear session:', e);
  }
});

// Handle successful reconnection
(socket.io as any).on('reconnect', (attemptNumber: number) => {
  console.log(`✅ Reconnected after ${attemptNumber} attempts`);
  
  // Store new session ID
  try {
    if (socket.id) {
      localStorage.setItem(SESSION_KEY, socket.id);
    }
  } catch (e) {
    console.warn('Could not store session ID:', e);
  }
});

// Handle reconnection failure - now infinite, so log but continue
(socket.io as any).on('reconnect_failed', () => {
  console.warn('🔄 Reconnection temporarily failed - will retry indefinitely (infinite mode)');
});

// Handle connection errors (use type assertion for manager events)
(socket.io as any).on('connect_error', (error: Error) => {
  console.error('❌ Connection error:', error.message);
  
  // Check for session-specific errors and clear state
  if (error.message && error.message.includes('Session ID')) {
    console.log('Session ID error detected, clearing session state...');
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('Could not clear session:', e);
    }
  }
  
  // Auto-retry health check after 5s
  setTimeout(initializeConnection, 5000);
});

// General socket errors - use proper typing (handled above via socket.io.on)
// socket.on('connect_error', ...) is a duplicate - use socket.io.on instead


// ==========================================
// LEGACY SERVICE WRAPPER (Backwards Compatibility)
// Keeps your existing components working without modification
// ==========================================
class SocketService {
  public connect() {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  public getSocket() {
    return socket;
  }

  public disconnect() {
    socket.disconnect();
  }

  public joinRoom(matchId: string) {
    socket.emit('joinMatch', matchId);
  }

  public leaveRoom(matchId: string) {
    socket.emit('leaveMatch', matchId);
  }

  public joinTournament(tournamentId: string) {
    socket.emit('joinTournament', tournamentId);
  }

  public leaveTournament(tournamentId: string) {
    socket.emit('leaveTournament', tournamentId);
  }

  public joinUserRoom(userId: string) {
    socket.emit('joinUserRoom', userId);
  }

  public isConnected(): boolean {
    return socket.connected;
  }

  public resetConnection() {
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
    }, 500);
  }
}

// Export a singleton instance for older components
export const socketService = new SocketService();

