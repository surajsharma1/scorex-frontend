import axios from 'axios';

// Determine API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- API Modules ---

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  googleLogin: (token: string) => api.post('/auth/google', { token }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  searchUsers: (query: string) => api.get(`/users/search?query=${query}`),
  getUsers: () => api.get('/users'), // Admin only
  getAllUsers: () => api.get('/users/all'), // Admin - get all users including deleted
  banUser: (userId: string) => api.put(`/users/${userId}/ban`), // Admin - ban user
  unbanUser: (userId: string) => api.put(`/users/${userId}/unban`), // Admin - unban user
  updateUserRole: (userId: string, role: string) => api.put(`/users/${userId}/role`, { role }), // Admin - update user role
  updateUserMembership: (userId: string, data: { level: number, durationMonths?: number }) => api.put(`/users/${userId}/membership`, data), // Admin - update user membership with custom duration
};

export const tournamentAPI = {
  getTournaments: (page = 1, limit = 10) => api.get(`/tournaments?page=${page}&limit=${limit}`),
  getTournament: (id: string) => api.get(`/tournaments/${id}`),
  createTournament: (data: any) => api.post('/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  goLive: (id: string) => api.post(`/tournaments/${id}/live`),
  updateLiveScores: (id: string, scores: any) => api.put(`/tournaments/${id}/scores`, { scores }),
};

export const matchAPI = {
  getAllMatches: () => api.get('/matches'),
  getMatches: (id: string) => api.get(`/matches/${id}`),
  // Get matches by tournament ID (uses query param)
  getMatchesByTournament: (tournamentId: string) => api.get(`/matches?tournament=${tournamentId}`),
  createMatch: (data: any) => api.post('/matches', data),
  updateMatch: (id: string, data: any) => api.put(`/matches/${id}`, data),
  deleteMatch: (id: string) => api.delete(`/matches/${id}`),
  updateLiveScores: (id: string, scores: any) => api.put(`/matches/${id}/score`, scores),
  updateMatchScore: (id: string, scores: any) => api.put(`/matches/${id}/score`, scores),
};

export const teamAPI = {
  getTeams: (tournamentId?: string) => api.get(tournamentId ? `/teams?tournament=${tournamentId}` : '/teams'),
  createTeam: (data: any) => api.post('/teams', data),
  updateTeam: (id: string, data: any) => api.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, player: any) => api.post(`/teams/${teamId}/players`, player),
};

export const bracketAPI = {
  updateBracket: (tournamentId: string, data: any) => api.put(`/brackets/${tournamentId}`, data),
};

export const overlayAPI = {
  getOverlays: () => api.get('/overlays'),
  getOverlay: (id: string) => api.get(`/overlays/${id}`),
  createOverlay: (data: any) => api.post('/overlays', data),
  updateOverlay: (id: string, data: any) => api.put(`/overlays/${id}`, data),
  deleteOverlay: (id: string) => api.delete(`/overlays/${id}`),
  getTemplates: () => api.get('/overlays/templates'),
  getMembershipStatus: () => api.get('/overlays/membership-status'),
};

export const friendAPI = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests'),
  sendRequest: (userId: string) => api.post(`/friends/request/${userId}`),
  acceptRequest: (requestId: string) => api.post(`/friends/accept/${requestId}`),
  rejectRequest: (requestId: string) => api.post(`/friends/reject/${requestId}`),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

export const messageAPI = {
  getMessages: (userId: string) => api.get(`/messages/${userId}`),
  sendMessage: (toUserId: string, content: string) => api.post('/messages', { toUserId, content }),
};

export const clubAPI = {
  getClubs: () => api.get('/clubs'),
  getMyClubs: () => api.get('/clubs/my'),
  createClub: (data: any) => api.post('/clubs', data),
  joinClub: (id: string) => api.post(`/clubs/${id}/join`),
};

  export const leaderboardAPI = {
  getBattingLeaderboard: (tournamentId?: string) => api.get('/leaderboard/batting', { params: { tournament: tournamentId } }),
  getBowlingLeaderboard: (tournamentId?: string) => api.get('/leaderboard/bowling', { params: { tournament: tournamentId } }),
  getTeamLeaderboard: (tournamentId?: string) => api.get('/leaderboard/teams', { params: { tournament: tournamentId } }),
};

export const paymentAPI = {
  createSubscription: (plan: string) => api.post('/payments/subscribe', { plan }),
  createRazorpayOrder: (amount: number, plan: string) => api.post('/payments/razorpay/order', { amount, plan }),
  verifyRazorpayPayment: (data: any) => api.post('/payments/razorpay/verify', data),
};

export default api;