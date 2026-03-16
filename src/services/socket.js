import { io } from 'socket.io-client';
import { getSocketUrl } from './env';
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
    }
    catch (e) {
        console.warn('Could not access localStorage:', e);
    }
};
// Clear any stale session on module load
clearStaleSession();
// ==========================================
// SOCKET CONNECTION WITH PROPER ERROR HANDLING
// ==========================================
// Custom socket.io parser to handle session errors
const socketOptions = {
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
export const socket = io(SOCKET_URL, socketOptions);
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
    }
    catch (e) {
        console.warn('Could not store session ID:', e);
    }
});
// Handle disconnection
socket.on('disconnect', (reason) => {
    console.warn('❌ Disconnected from WebSocket server:', reason);
    // Clear stored session on disconnect
    try {
        localStorage.removeItem(SESSION_KEY);
    }
    catch (e) {
        console.warn('Could not clear session:', e);
    }
    // If server disconnected us (not manual), attempt reconnection logic
    if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Server initiated disconnect, reconnecting...');
        socket.connect();
    }
});
// Handle reconnection attempts
socket.io.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt #${attemptNumber}`);
    // Force new connection on each reattempt to avoid stale session
    socket.io.opts.forceNew = true;
    // Clear any stored session before reconnecting
    try {
        localStorage.removeItem(SESSION_KEY);
    }
    catch (e) {
        console.warn('Could not clear session:', e);
    }
});
// Handle successful reconnection
socket.io.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    // Store new session ID
    try {
        if (socket.id) {
            localStorage.setItem(SESSION_KEY, socket.id);
        }
    }
    catch (e) {
        console.warn('Could not store session ID:', e);
    }
});
// Handle reconnection failure
socket.io.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts');
});
// Handle connection errors (use type assertion for manager events)
socket.io.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    // Check for session-specific errors and clear state
    if (error.message && error.message.includes('Session ID')) {
        console.log('Session ID error detected, clearing session state...');
        try {
            localStorage.removeItem(SESSION_KEY);
        }
        catch (e) {
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
    connect() {
        if (!socket.connected) {
            socket.connect();
        }
        return socket;
    }
    getSocket() {
        return socket;
    }
    disconnect() {
        socket.disconnect();
    }
    joinRoom(matchId) {
        socket.emit('joinMatch', matchId);
    }
    leaveRoom(matchId) {
        socket.emit('leaveMatch', matchId);
    }
    joinTournament(tournamentId) {
        socket.emit('joinTournament', tournamentId);
    }
    leaveTournament(tournamentId) {
        socket.emit('leaveTournament', tournamentId);
    }
    joinUserRoom(userId) {
        socket.emit('joinUserRoom', userId);
    }
    isConnected() {
        return socket.connected;
    }
    resetConnection() {
        socket.disconnect();
        setTimeout(() => {
            socket.connect();
        }, 500);
    }
}
// Export a singleton instance for older components
export const socketService = new SocketService();
