import { io, Socket } from 'socket.io-client';

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

// Connect with credentials to match CORS settings
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ['websocket', 'polling'], // Ensure fallback options are available
  auth: {
    token: localStorage.getItem('token') // Pass token if needed by server
  }
});

// Basic Connection Listeners
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('❌ Disconnected from WebSocket server:', reason);
});

socket.io.on('error', (error: any) => {
  console.error('Socket.IO Error:', error);
});


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