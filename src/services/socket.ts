import { io, Socket } from 'socket.io-client';
import { useEffect, useCallback, useRef, useState } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token?: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Join a tournament room
  joinTournament(tournamentId: string) {
    this.socket?.emit('joinTournament', tournamentId);
  }

  // Leave a tournament room
  leaveTournament(tournamentId: string) {
    this.socket?.emit('leaveTournament', tournamentId);
  }

  // Join a match room
  joinMatch(matchId: string) {
    this.socket?.emit('joinMatch', matchId);
  }

  // Leave a match room
  leaveMatch(matchId: string) {
    this.socket?.emit('leaveMatch', matchId);
  }

  // Join user room for notifications
  joinUserRoom(userId: string) {
    this.socket?.emit('joinUserRoom', userId);
  }

  // Update score
  updateScore(data: { tournamentId: string; match: any }) {
    this.socket?.emit('updateScore', data);
  }

  // Update match status
  updateMatchStatus(data: { matchId: string; tournamentId: string; status: string }) {
    this.socket?.emit('updateMatchStatus', data);
  }

  // Update tournament
  updateTournament(data: { tournamentId: string; tournament: any }) {
    this.socket?.emit('updateTournament', data);
  }

  // Send notification
  sendNotification(data: { userId?: string; message: string; type: string }) {
    this.socket?.emit('sendNotification', data);
  }

  // Send chat message
  sendMessage(roomId: string, message: any) {
    this.socket?.emit('sendMessage', { roomId, message });
  }

  // Typing indicator
  setTyping(roomId: string, userId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, userId, isTyping });
  }

  // Subscribe to events
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    this.socket?.on(event, callback);
  }

  // Unsubscribe from events
  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// React hook for socket connection
export function useSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = socketService.connect(token);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.off('connect');
      socketRef.current?.off('disconnect');
    };
  }, [token]);

  return { isConnected, socket: socketRef.current };
}

// React hook for tournament events
export function useTournamentSocket(tournamentId: string | null) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !tournamentId) return;

    socketService.joinTournament(tournamentId);

    return () => {
      socketService.leaveTournament(tournamentId);
    };
  }, [socket, tournamentId]);

  const onScoreUpdate = useCallback((callback: (data: any) => void) => {
    socketService.on('scoreUpdate', callback);
    return () => socketService.off('scoreUpdate', callback);
  }, []);

  const onMatchStatusUpdate = useCallback((callback: (data: any) => void) => {
    socketService.on('matchStatusUpdate', callback);
    return () => socketService.off('matchStatusUpdate', callback);
  }, []);

  const onTournamentUpdate = useCallback((callback: (data: any) => void) => {
    socketService.on('tournamentUpdate', callback);
    return () => socketService.off('tournamentUpdate', callback);
  }, []);

  return {
    isConnected,
    onScoreUpdate,
    onMatchStatusUpdate,
    onTournamentUpdate,
  };
}

// React hook for match events
export function useMatchSocket(matchId: string | null) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !matchId) return;

    socketService.joinMatch(matchId);

    return () => {
      socketService.leaveMatch(matchId);
    };
  }, [socket, matchId]);

  return { isConnected };
}

// React hook for notifications
export function useNotifications() {
  const { socket, isConnected } = useSocket();

  const onNotification = useCallback((callback: (data: any) => void) => {
    socketService.on('notification', callback);
    return () => socketService.off('notification', callback);
  }, []);

  return { isConnected, onNotification };
}

// React hook for chat
export function useChat(roomId: string | null) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !roomId) return;

    // Join the room is handled by the component that manages the room

    return () => {
      // Cleanup if needed
    };
  }, [socket, roomId]);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    socketService.on('newMessage', callback);
    return () => socketService.off('newMessage', callback);
  }, []);

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    socketService.on('userTyping', callback);
    return () => socketService.off('userTyping', callback);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (roomId) {
      socketService.sendMessage(roomId, message);
    }
  }, [roomId]);

  const sendTyping = useCallback((userId: string, isTyping: boolean) => {
    if (roomId) {
      socketService.setTyping(roomId, userId, isTyping);
    }
  }, [roomId]);

  return {
    isConnected,
    onNewMessage,
    onUserTyping,
    sendMessage,
    sendTyping,
  };
}

export default socketService;
