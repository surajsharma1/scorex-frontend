import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
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

// Singleton factory - fixes TDZ, safe lazy init
class SocketFactory {
  private static instance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private static isInitialized = false;

  private constructor() {
    // Private constructor
  }

  static getInstance(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!SocketFactory.instance) {
      SocketFactory.instance = io(getSocketUrl(), {
        withCredentials: true,
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: { token: localStorage.getItem('token') },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
      }) as Socket<ServerToClientEvents, ClientToServerEvents>;

      SocketFactory.setupEventHandlers(SocketFactory.instance);
      SocketFactory.initializeConnection();
    }
    return SocketFactory.instance;
  }

  private static setupEventHandlers(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason);
    });

    // Manager events (safe inside factory)
    (socket.io as any).on('reconnect', () => console.log('✅ Reconnected'));
    (socket.io as any).on('connect_error', (error: Error) => {
      console.error('❌ Connect error:', error.message);
    });
  }

  private static initializeConnection() {
    const socket = SocketFactory.getInstance();
    if (!socket.connected) {
      socket.connect();
    }
  }

  static connect() {
    const socket = SocketFactory.getInstance();
    if (!socket.connected) socket.connect();
  }

  static disconnect() {
    const socket = SocketFactory.instance;
    if (socket) socket.disconnect();
  }

  static joinMatch(matchId: string) {
    SocketFactory.getInstance().emit('joinMatch', matchId);
  }

  static leaveMatch(matchId: string) {
    SocketFactory.getInstance().emit('leaveMatch', matchId);
  }

  static isConnected(): boolean {
    return SocketFactory.instance?.connected || false;
  }
}

// Public API
export const socket = {
  get: () => SocketFactory.getInstance(),
  connect: () => SocketFactory.connect(),
  disconnect: () => SocketFactory.disconnect(),
  joinMatch: (matchId: string) => SocketFactory.joinMatch(matchId),
  leaveMatch: (matchId: string) => SocketFactory.leaveMatch(matchId),
  joinTournament: (tournamentId: string) => SocketFactory.getInstance().emit('joinTournament', tournamentId),
  leaveTournament: (tournamentId: string) => SocketFactory.getInstance().emit('leaveTournament', tournamentId),
  joinUserRoom: (userId: string) => SocketFactory.getInstance().emit('joinUserRoom', userId),
  isConnected: () => SocketFactory.isConnected(),
};

// Legacy service compatibility
export const socketService = {
  connect: SocketFactory.connect.bind(SocketFactory),
  getSocket: () => SocketFactory.getInstance(),
  disconnect: SocketFactory.disconnect.bind(SocketFactory),
};

console.log('🔌 Socket factory initialized safely');

