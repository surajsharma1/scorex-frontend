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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  register: (data: { username: string; email: string; password: string }) => 
    api.post('/auth/register', data),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  googleLogin: (token: string) => 
    api.post('/auth/google', { token }),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post(`/auth/reset-password/${token}`, { password }),
  
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`),
};

// ============================================
// TOURNAMENT API
// ============================================
export const tournamentAPI = {
  getTournaments: (page = 1, limit = 10) => 
    api.get(`/tournaments?page=${page}&limit=${limit}`),
  
  getTournament: (id: string) => 
    api.get(`/tournaments/${id}`),
  
  createTournament: (data: {
    name: string;
    description?: string;
    organizer?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    locationType?: string;
    type?: string;
    format?: string;
  }) => api.post('/tournaments', data),
  
  updateTournament: (id: string, data: any) => 
    api.put(`/tournaments/${id}`, data),
  
  deleteTournament: (id: string) => 
    api.delete(`/tournaments/${id}`),
  
  addTeam: (tournamentId: string, teamId: string) => 
    api.post(`/tournaments/${tournamentId}/teams`, { teamId }),
  
  generateFixtures: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/fixtures`),
  
  getTournamentMatches: (tournamentId: string) => 
    api.get(`/tournaments/${tournamentId}/matches`),
};

// ============================================
// MATCH API
// ============================================
export const matchAPI = {
  getAllMatches: (params?: { tournament?: string; status?: string }) => 
    api.get('/matches', { params }),
  
  getMatchById: (id: string) => 
    api.get(`/matches/${id}`),
  
  createMatch: (data: {
    tournament?: string;
    matchName?: string;
    team1?: string;
    team2?: string;
    venue?: string;
    matchDate?: string;
    format?: string;
    maxOvers?: number;
  }) => api.post('/matches', data),
  
  updateMatch: (id: string, data: any) => 
    api.put(`/matches/${id}`, data),
  
  deleteMatch: (id: string) => 
    api.delete(`/matches/${id}`),
  
  // Match setup
  saveToss: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/toss`, { tossWinnerId, decision }),
  
  savePlayerSelections: (id: string, data: {
    battingOrder: string[];
    bowlingOrder: string[];
    striker: string;
    nonStriker: string;
    bowler: string;
  }) => api.put(`/matches/${id}/players`, data),
  
  startMatch: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/start`, { tossWinnerId, decision }),
  
  // Scoring
  scoreBall: (id: string, ballData: {
    overNumber: number;
    ballNumber: number;
    bowler: string;
    striker: string;
    nonStriker: string;
    runsOffBat: number;
    extras: number;
    extraType: string;
    isWicket: boolean;
    wicketType?: string;
  }) => api.put(`/matches/${id}/score`, ballData),
  
  undoLastBall: (id: string) => 
    api.put(`/matches/${id}/undo`),
  
  // Player management
  changeBowler: (id: string, newBowler: string) => 
    api.put(`/matches/${id}/bowler`, { newBowler }),
  
  updateStriker: (id: string, newStriker: string) => 
    api.put(`/matches/${id}/striker`, { newStriker }),
  
  updateNonStriker: (id: string, newNonStriker: string) => 
    api.put(`/matches/${id}/nonstriker`, { newNonStriker }),
  
  // Stats
  getTournamentStats: (tournamentId: string) => 
    api.get(`/matches/stats/${tournamentId}`),
};

// ============================================
// TEAM API
// ============================================
export const teamAPI = {
  getTeams: (tournamentId?: string) => 
    api.get(tournamentId ? `/teams?tournament=${tournamentId}` : '/teams'),
  
  getTeamById: (id: string) => 
    api.get(`/teams/${id}`),
  
  createTeam: (data: {
    name: string;
    color?: string;
    tournament?: string;
    players?: Array<{ name: string; role: string; jerseyNumber: string }>;
  }) => api.post('/teams', data),
  
  updateTeam: (id: string, data: any) => 
    api.put(`/teams/${id}`, data),
  
  deleteTeam: (id: string) => 
    api.delete(`/teams/${id}`),
  
  addPlayer: (teamId: string, player: { name: string; role: string; jerseyNumber: string }) => 
    api.post(`/teams/${teamId}/players`, player),
};

// ============================================
// USER API
// ============================================
export const userAPI = {
  getProfile: () => 
    api.get('/users/profile'),
  
  updateProfile: (data: any) => 
    api.put('/users/profile', data),
  
  searchUsers: (query: string) => 
    api.get(`/users/search?query=${query}`),
  
  // Admin routes
  getAllUsers: () => 
    api.get('/users/all'),
  
  banUser: (userId: string) => 
    api.put(`/users/${userId}/ban`),
  
  unbanUser: (userId: string) => 
    api.put(`/users/${userId}/unban`),
  
  updateUserRole: (userId: string, role: string) => 
    api.put(`/users/${userId}/role`, { role }),
  
  updateUserMembership: (userId: string, data: { level: number; durationMonths?: number }) => 
    api.put(`/users/${userId}/membership`, data),
};

// ============================================
// OVERLAY API
// ============================================
export const overlayAPI = {
  getOverlays: () => 
    api.get('/overlays'),
  
  getOverlay: (id: string) => 
    api.get(`/overlays/${id}`),
  
  createOverlay: (data: any) => 
    api.post('/overlays', data),
  
  updateOverlay: (id: string, data: any) => 
    api.put(`/overlays/${id}`, data),
  
  deleteOverlay: (id: string) => 
    api.delete(`/overlays/${id}`),
  
  getTemplates: () => 
    api.get('/overlays/templates'),
  
  getMembershipStatus: () => 
    api.get('/overlays/membership-status'),
  
  regenerateOverlay: (id: string) => 
    api.post(`/overlays/${id}/regenerate`),
};

// ============================================
// FRIEND API
// ============================================
export const friendAPI = {
  getFriends: () => 
    api.get('/friends'),
  
  getPendingRequests: () => 
    api.get('/friends/requests'),
  
  sendRequest: (userId: string) => 
    api.post(`/friends/request/${userId}`),
  
  acceptRequest: (requestId: string) => 
    api.post(`/friends/accept/${requestId}`),
  
  rejectRequest: (requestId: string) => 
    api.post(`/friends/reject/${requestId}`),
  
  removeFriend: (friendId: string) => 
    api.delete(`/friends/${friendId}`),
};

// ============================================
// MESSAGE API
// ============================================
export const messageAPI = {
  getMessages: (userId: string) => 
    api.get(`/messages/${userId}`),
  
  sendMessage: (toUserId: string, content: string) => 
    api.post('/messages', { toUserId, content }),
};

// ============================================
// CLUB API
// ============================================
export const clubAPI = {
  getClubs: () => 
    api.get('/clubs'),
  
  getMyClubs: () => 
    api.get('/clubs/my'),
  
  createClub: (data: any) => 
    api.post('/clubs', data),
  
  joinClub: (id: string) => 
    api.post(`/clubs/${id}/join`),
};

// ============================================
// LEADERBOARD API
// ============================================
export const leaderboardAPI = {
  getBattingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/batting', { params: { tournament: tournamentId } }),
  
  getBowlingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/bowling', { params: { tournament: tournamentId } }),
  
  getTeamLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/teams', { params: { tournament: tournamentId } }),
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  createSubscription: (plan: string) => 
    api.post('/payments/subscribe', { plan }),
  
  createRazorpayOrder: (amount: number, plan: string) => 
    api.post('/payments/razorpay/order', { amount, plan }),
  
  verifyRazorpayPayment: (data: any) => 
    api.post('/payments/razorpay/verify', data),
};

// Export default api instance
export default api;

// ============================================
// BACKWARD COMPATIBILITY ALIASES (for existing components)
// ============================================

// Aliases for matchAPI
export const getMatches = matchAPI.getAllMatches;
export const getMatch = matchAPI.getMatchById;
export const getMatchesByTournament = (tournamentId: string) => 
  api.get('/matches', { params: { tournament: tournamentId } });
export const updateMatchScore = matchAPI.scoreBall;
export const updateLiveScores = matchAPI.scoreBall;

// Aliases for tournamentAPI
export const goLive = (id: string) => api.post(`/tournaments/${id}/live`);
export const updateLiveScoresTournament = (id: string, scores: any) => 
  api.put(`/tournaments/${id}/scores`, { scores });

