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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

// ─── Tournament API ───────────────────────────────────────────────────────────
export const tournamentAPI = {
  getMyTournaments: () => api.get('/tournaments/my'),
  getTournaments: () => api.get('/tournaments'),
  getTournament: (id: string) => api.get(`/tournaments/${id}`),
  createTournament: (data: any) => api.post('/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  generateBracket: (id: string) => api.post(`/tournaments/${id}/bracket`),
  startTournament: (id: string) => api.post(`/tournaments/${id}/start`),
  getPointsTable: (id: string) => api.get(`/tournaments/${id}/points-table`),
};

// ─── Match API ────────────────────────────────────────────────────────────────
export const matchAPI = {
  getMatches: (params?: any) => api.get('/matches', { params }),
  getMatch: (id: string) => api.get(`/matches/${id}`),
  createMatch: (data: any) => api.post('/matches', data),
  updateMatch: (id: string, data: any) => api.put(`/matches/${id}`, data),
  deleteMatch: (id: string) => api.delete(`/matches/${id}`),
  getLiveMatches: () => api.get('/matches/live'),
  // Scoring
  startMatch: (id: string, data: any) => api.post(`/matches/${id}/start`, data),
  selectPlayers: (id: string, data: any) => api.post(`/matches/${id}/select-players`, data),
  addBall: (id: string, data: any) => api.post(`/matches/${id}/score`, data),
  undoBall: (id: string) => api.post(`/matches/${id}/undo`),
  endInnings: (id: string) => api.post(`/matches/${id}/end-innings`),
  endMatch: (id: string, data: any) => api.post(`/matches/${id}/end`, data),
  updateStatus: (id: string, status: string) => api.put(`/matches/${id}/status`, { status }),
};

// ─── Team API ─────────────────────────────────────────────────────────────────
export const teamAPI = {
  getTeams: (tournamentId?: string) => api.get('/teams', { params: tournamentId ? { tournamentId } : {} }),
  getTeam: (id: string) => api.get(`/teams/${id}`),
  createTeam: (data: any) => api.post('/teams', data),
  updateTeam: (id: string, data: any) => api.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, data: any) => api.post(`/teams/${teamId}/players`, data),
  removePlayer: (teamId: string, playerId: string) => api.delete(`/teams/${teamId}/players/${playerId}`),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  searchUsers: (q: string) => api.get('/users/search', { params: { q } }),
};

// ─── Overlay API ──────────────────────────────────────────────────────────────
export const overlayAPI = {
  getOverlays: () => api.get('/overlays'),
  createOverlay: (data: any) => api.post('/overlays', data),
  getOverlay: (id: string) => api.get(`/overlays/${id}`),
  deleteOverlay: (id: string) => api.delete(`/overlays/${id}`),
};

// ─── Club API ─────────────────────────────────────────────────────────────────
export const clubAPI = {
  getClubs: () => api.get('/clubs'),
  getMyClubs: () => api.get('/clubs/my'),
  createClub: (data: any) => api.post('/clubs', data),
  joinClub: (id: string) => api.post(`/clubs/${id}/join`),
  leaveClub: (id: string) => api.post(`/clubs/${id}/leave`),
};

// ─── Friend API ───────────────────────────────────────────────────────────────
export const friendAPI = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests'),
  sendRequest: (userId: string) => api.post(`/friends/${userId}/request`),
  acceptRequest: (requestId: string) => api.post(`/friends/requests/${requestId}/accept`),
  rejectRequest: (requestId: string) => api.post(`/friends/requests/${requestId}/reject`),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (amount: number, plan: string) => api.post('/payments/razorpay-order', { amount, plan }),
  verifyPayment: (data: any) => api.post('/payments/verify-razorpay', data),
};

export default api;
