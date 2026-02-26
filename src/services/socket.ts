import { io, Socket } from 'socket.io-client';

// Define typed events
interface ServerToClientEvents {
  scoreUpdate: (data: any) => void;
  matchEvent: (data: { type: string; message: string }) => void;
  newMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  matchStatusUpdate: (data: any) => void;
  tournamentUpdate: (data: any) => void;
  notification: (data: any) => void;
}

interface ClientToServerEvents {
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  updateScore: (data: { tournamentId: string; match: any }) => void;
  updateMatchStatus: (data: { matchId: string; tournamentId: string; status: string }) => void;
  joinUserRoom: (userId: string) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;
  
  public connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Socket connection already in progress...');
      return this.socket || this.createNewSocket();
    }

    this.isConnecting = true;

    // Dynamic URL handling for Vite/Env
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    // Strip /api/v1 to get the root domain
    const socketUrl = baseUrl.replace(/\/api\/v1\/?$/, '');

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      withCredentials: true,
      // Force a new connection by generating a unique ID
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // Rejoin any rooms after reconnection
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket Disconnected:', reason);
      
      // If disconnected due to server restart or session expiry, force new connection
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Server disconnected, forcing new connection...');
        this.forceNewConnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket Connection Error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.isConnecting = false;
      }
    });

    this.isConnecting = false;
    return this.socket;
  }

  private createNewSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const socketUrl = baseUrl.replace(/\/api\/v1\/?$/, '');

    return io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      withCredentials: true,
      forceNew: true,
    });
  }

  private forceNewConnection() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  private handleReconnect() {
    // This method can be extended to rejoin rooms after reconnection
    // For now, we just reset the state and let components rejoin as needed
    console.log('Socket reconnected, components will rejoin rooms on next render');
  }

  public getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  public joinRoom(matchId: string) {
    this.getSocket().emit('joinMatch', matchId);
  }

  public leaveRoom(matchId: string) {
    this.getSocket().emit('leaveMatch', matchId);
  }

  public joinTournament(tournamentId: string) {
    this.getSocket().emit('joinTournament', tournamentId);
  }

  public leaveTournament(tournamentId: string) {
    this.getSocket().emit('leaveTournament', tournamentId);
  }

  public joinUserRoom(userId: string) {
    this.getSocket().emit('joinUserRoom', userId);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public resetConnection() {
    this.forceNewConnection();
  }
}

// Export a singleton instance
export const socketService = new SocketService();
