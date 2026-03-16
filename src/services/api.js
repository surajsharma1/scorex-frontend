import axios from 'axios';
import { getApiBaseUrl } from './env';
const API_BASE = getApiBaseUrl();
const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
api.interceptors.response.use(res => res, err => {
    if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    return Promise.reject(err);
});
// ─── Tournament API ───────────────────────────────────────────────────────────
export const tournamentAPI = {
    getMyTournaments: () => api.get('/tournaments/my'),
    getTournaments: () => api.get('/tournaments'),
    getTournament: (id) => api.get(`/tournaments/${id}`),
    createTournament: (data) => api.post('/tournaments', data),
    updateTournament: (id, data) => api.put(`/tournaments/${id}`, data),
    deleteTournament: (id) => api.delete(`/tournaments/${id}`),
    generateBracket: (id) => api.post(`/tournaments/${id}/bracket`),
    startTournament: (id) => api.post(`/tournaments/${id}/start`),
    getPointsTable: (id) => api.get(`/tournaments/${id}/points-table`),
    getTournamentMatches: (id) => api.get(`/tournaments/${id}/matches`),
};
// ─── Match API ────────────────────────────────────────────────────────────────
export const matchAPI = {
    getMatches: (params) => api.get('/matches', { params }),
    getMatch: (id) => api.get(`/matches/${id}`),
    createMatch: (data) => api.post('/matches', data),
    updateMatch: (id, data) => api.put(`/matches/${id}`, data),
    deleteMatch: (id) => api.delete(`/matches/${id}`),
    getLiveMatches: () => api.get('/matches/live'),
    // Scoring
    startMatch: (id, data) => api.post(`/matches/${id}/start`, data),
    selectPlayers: (id, data) => api.post(`/matches/${id}/select-players`, data),
    addBall: (id, data) => api.post(`/matches/${id}/score`, data),
    undoBall: (id) => api.post(`/matches/${id}/undo`),
    endInnings: (id) => api.post(`/matches/${id}/end-innings`),
    endMatch: (id, data) => api.post(`/matches/${id}/end`, data),
    updateStatus: (id, status) => api.put(`/matches/${id}/status`, { status }),
    getTournamentStats: (tournamentId) => api.get(`/tournaments/${tournamentId}/stats`),
};
// ─── Team API ─────────────────────────────────────────────────────────────────
export const teamAPI = {
    getTeams: (tournamentId) => api.get('/teams', { params: tournamentId ? { tournamentId } : {} }),
    getTeam: (id) => api.get(`/teams/${id}`),
    createTeam: (data) => api.post('/teams', data),
    updateTeam: (id, data) => api.put(`/teams/${id}`, data),
    deleteTeam: (id) => api.delete(`/teams/${id}`),
    addPlayer: (teamId, data) => api.post(`/teams/${teamId}/players`, data),
    removePlayer: (teamId, playerId) => api.delete(`/teams/${teamId}/players/${playerId}`),
};
// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};
// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/users/profile', data),
    searchUsers: (q) => api.get('/users/search', { params: { q } }),
};
// ─── Overlay API ──────────────────────────────────────────────────────────────
export const overlayAPI = {
    getOverlays: () => api.get('/overlays'),
    createOverlay: (data) => api.post('/overlays', data),
    getOverlay: (id) => api.get(`/overlays/${id}`),
    deleteOverlay: (id) => api.delete(`/overlays/${id}`),
    regenerateOverlay: (id) => api.post(`/overlays/${id}/regenerate-url`),
    updateOverlay: (id, data) => api.put(`/overlays/${id}`, data),
};
// ─── Club API ─────────────────────────────────────────────────────────────────
export const clubAPI = {
    getClubs: () => api.get('/clubs'),
    getMyClubs: () => api.get('/clubs/my'),
    createClub: (data) => api.post('/clubs', data),
    joinClub: (id) => api.post(`/clubs/${id}/join`),
    leaveClub: (id) => api.post(`/clubs/${id}/leave`),
};
// ─── Friend API ───────────────────────────────────────────────────────────────
export const friendAPI = {
    getFriends: () => api.get('/friends'),
    getPendingRequests: () => api.get('/friends/requests'),
    sendRequest: (userId) => api.post(`/friends/${userId}/request`),
    acceptRequest: (requestId) => api.post(`/friends/requests/${requestId}/accept`),
    rejectRequest: (requestId) => api.post(`/friends/requests/${requestId}/reject`),
    removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
};
// ─── Message API ──────────────────────────────────────────────────────────────
export const messageAPI = {
    getMessages: (params, limit = 50) => {
        if (typeof params === 'string') {
            // Backward compatibility
            return api.get('/messages', { params: { recipientId: params, limit } });
        }
        return api.get('/messages', { params });
    },
    sendMessage: (data) => api.post('/messages', data),
    getConversations: () => api.get('/messages/conversations'),
};
// ─── Bracket API ──────────────────────────────────────────────────────────────
export const bracketAPI = {
    getBracket: (tournamentId) => api.get(`/tournaments/${tournamentId}/bracket`),
    updateBracket: (tournamentId, data) => api.put(`/tournaments/${tournamentId}/bracket`, data),
    generateBracket: (tournamentId) => api.post(`/tournaments/${tournamentId}/bracket/generate`),
};
// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentAPI = {
    createRazorpayOrder: (amount, plan) => api.post('/payments/razorpay-order', { amount, plan }),
    verifyPayment: (data) => api.post('/payments/verify-razorpay', data),
    createSubscription: (planName) => api.post('/payments/subscription', { plan: planName }),
    verifyRazorpayPayment: (data) => api.post('/payments/verify-razorpay-payment', data),
};
export default api;
