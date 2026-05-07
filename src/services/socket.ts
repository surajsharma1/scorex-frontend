import { io, Socket } from 'socket.io-client';
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

// Type for the full socket API
type SocketAPI = {
  get: () => Socket<ServerToClientEvents, ClientToServerEvents>;
  connect: () => void;
  disconnect: () => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  joinUserRoom: (userId: string) => void;
  isConnected: () => boolean;
  on: (event: string, listener: (...args: any[]) => void) => void;
  off: (event: string, listener?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  removeAllListeners: (event?: string) => void;
};

// Singleton factory
class SocketFactory {
  private static instance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  private constructor() {}

  static getInstance(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!SocketFactory.instance) {
      SocketFactory.instance = io(getSocketUrl(), {
        withCredentials: true,
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: { token: localStorage.getItem('token') },
        reconnection: true,
        reconnectionAttempts: 5,        // Stop hammering after 5 attempts — was Infinity
        reconnectionDelay: 2000,        // Start at 2s — was 1s
        reconnectionDelayMax: 30000,    // Cap at 30s backoff — was 5s
        timeout: 10000,
        forceNew: false,                // Reuse connection — was true (created new socket every call)
      }) as Socket<ServerToClientEvents, ClientToServerEvents>;

      SocketFactory.setupEventHandlers(SocketFactory.instance);
    }
    return SocketFactory.instance;
  }

  private static setupEventHandlers(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    (socket.io as any).on('reconnect', () => console.log('[Socket] Reconnected'));
    (socket.io as any).on('connect_error', (error: Error) => {
      // Only log first error — avoid console spam during reconnect storm
      console.warn('[Socket] Connect error:', error.message);
    });
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

  // NEW: Dynamic event methods
  static on(event: string, listener: (...args: any[]) => void) {
    SocketFactory.getInstance().on(event as any, listener);
  }

  static off(event: string, listener?: (...args: any[]) => void) {
    const socket = SocketFactory.getInstance();
    if (listener) {
      socket.off(event as any, listener);
    } else {
      socket.removeAllListeners(event as any);
    }
  }

  static emit(event: string, ...args: any[]) {
    SocketFactory.getInstance().emit(event as any, ...args);
  }

  static removeAllListeners(event?: string) {
    SocketFactory.getInstance().removeAllListeners(event as any);
  }
}

// Public API as SocketAPI
export const socket: SocketAPI = {
  get: () => SocketFactory.getInstance(),
  connect: () => SocketFactory.connect(),
  disconnect: () => SocketFactory.disconnect(),
  joinMatch: (matchId: string) => SocketFactory.joinMatch(matchId),
  leaveMatch: (matchId: string) => SocketFactory.leaveMatch(matchId),
  joinTournament: (tournamentId: string) => SocketFactory.getInstance().emit('joinTournament', tournamentId),
  leaveTournament: (tournamentId: string) => SocketFactory.getInstance().emit('leaveTournament', tournamentId),
  joinUserRoom: (userId: string) => SocketFactory.getInstance().emit('joinUserRoom', userId),
  isConnected: () => SocketFactory.isConnected(),
  on: (event: string, listener: (...args: any[]) => void) => SocketFactory.on(event, listener),
  off: (event: string, listener?: (...args: any[]) => void) => SocketFactory.off(event, listener),
  emit: (event: string, ...args: any[]) => SocketFactory.emit(event, ...args),
  removeAllListeners: (event?: string) => SocketFactory.removeAllListeners(event),
};

// Legacy service compatibility
export const socketService = {
  connect: SocketFactory.connect.bind(SocketFactory),
  getSocket: () => SocketFactory.getInstance(),
  disconnect: SocketFactory.disconnect.bind(SocketFactory),
};