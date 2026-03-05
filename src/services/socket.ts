import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

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
  
  // NEW: Live Match feature events
  match_updated: (updatedMatchState: any) => void;
}

export interface ClientToServerEvents {
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  updateScore: (data: { tournamentId: string; match: any }) => void;
  updateMatchStatus: (data: { matchId: string; tournamentId: string; status: string }) => void;
  joinUserRoom: (userId: string) => void;

  // NEW: Live Match feature events
  join_match: (matchId: string) => void;
}

// Dynamic URL handling for Vite/Env (Strip /api/v1 to get the root domain for WebSockets)
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = baseUrl.replace(/\/api\/v1\/?$/, '');

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
  autoConnect: true,
  transports: ['websocket', 'polling'],
  auth: {
    token: localStorage.getItem('token')
  },
  // Reconnection settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  // Timeout settings
  timeout: 10000,
  // Force new connection to avoid stale session issues
  forceNew: true,
};

// Create socket instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, socketOptions);

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

// Handle reconnection failure
(socket.io as any).on('reconnect_failed', () => {
  console.error('❌ Reconnection failed after all attempts');
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