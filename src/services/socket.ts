import { io, Socket } from 'socket.io-client';

// Define typed events
interface ServerToClientEvents {
  scoreUpdate: (data: any) => void;
  matchEvent: (data: { type: string; message: string }) => void;
  newMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
}

interface ClientToServerEvents {
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  
  public connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Dynamic URL handling for Vite/Env
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    // Strip /api/v1 to get the root domain
    const socketUrl = baseUrl.replace(/\/api\/v1\/?$/, '');

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket Disconnected:', reason);
    });

    return this.socket;
  }

  public getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinRoom(matchId: string) {
    this.getSocket().emit('joinMatch', matchId);
  }

  public leaveRoom(matchId: string) {
    this.getSocket().emit('leaveMatch', matchId);
  }
}

// Export a singleton instance
export const socketService = new SocketService();