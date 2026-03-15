/**
 * ScoreX API Client — Fixed & Rewritten
 *
 * BUGS FIXED:
 * 1. authAPI.googleLogin sent { token } but backend expects { idToken }
 * 2. authAPI.resetPassword called /auth/reset-password/:token (URL token)
 *    but backend is POST /auth/reset-password with body { email, otp, newPassword }
 * 3. Request interceptor skipped auth token for ALL requests to /teams, /matches,
 *    /tournaments, /leaderboard — including protected POST/PUT/DELETE routes.
 *    Only public GET read-routes should skip auth.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request Interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (!token) return config;

    // FIX #3: The original skipped auth for ANY request whose URL started with
    // /teams, /matches, /tournaments, /leaderboard — this blocked auth on all
    // POST/PUT/DELETE operations on those resources.
    // Correct rule: only skip auth on safe read-only GET requests to public endpoints.
    const isPublicGet =
      config.method === 'get' &&
      ['/teams', '/matches', '/tournaments', '/leaderboard'].some(
        (endpoint) => config.url?.startsWith(endpoint)
      );

    if (!isPublicGet) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const msg = ((error.response.data as any)?.message || '').toLowerCase();
      if (msg.includes('not authorized') || msg.includes('token') || msg.includes('invalid credentials')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?error=session_expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BallPayload {
  overNumber: number; ballNumber: number;
  bowler: string; striker: string; nonStriker: string;
  runsOffBat: number; extras: number;
  extraType: 'None' | 'WD' | 'NB' | 'B' | 'LB' | 'Penalty';
  isWicket: boolean; wicketType?: string;
}

export interface PlayerSelectionPayload {
  battingOrder: string[]; bowlingOrder: string[];
  striker: string; nonStriker: string; bowler: string;
}

export interface CreateMatchPayload {
  tournament?: string; matchName?: string;
  team1?: string; team2?: string;
  venue?: string; matchDate?: string; format?: string; maxOvers?: number;
}

export interface CreateTournamentPayload {
  name: string; description?: string; organizer?: string;
  startDate?: string; endDate?: string; location?: string;
  locationType?: string; type?: string; format?: string;
}

export interface CreateTeamPayload {
  name: string; color?: string; tournament?: string;
  players?: Array<{ name: string; role: string; jerseyNumber: string }>;
}

export interface AddPlayerPayload { name: string; role: string; jerseyNumber: string; }

const getData = (response: any) => response.data;

// ─── AUTH API ──────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(getData),

  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data).then(getData),

  getCurrentUser: () =>
    api.get('/auth/me').then(getData),

  // FIX #1: was sending { token } — backend googleLogin expects { idToken }
  googleLogin: (idToken: string) =>
    api.post('/auth/google', { idToken }).then(getData),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(getData),

  // FIX #2: was /auth/reset-password/:token with { password }
  // Backend is POST /auth/reset-password with body { email, otp, newPassword }
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }).then(getData),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}`).then(getData),
};

// ─── TOURNAMENT API ────────────────────────────────────────────────────────
export const tournamentAPI = {
  getTournaments: (page = 1, limit = 10) =>
    api.get(`/tournaments?page=${page}&limit=${limit}`).then(getData),

  getTournament: (id: string) =>
    api.get(`/tournaments/${id}`).then(getData),

  createTournament: (data: CreateTournamentPayload) =>
    api.post('/tournaments', data).then(getData),

  updateTournament: (id: string, data: Partial<CreateTournamentPayload>) =>
    api.put(`/tournaments/${id}`, data).then(getData),

  deleteTournament: (id: string) =>
    api.delete(`/tournaments/${id}`).then(getData),

  addTeam: (tournamentId: string, teamId: string) =>
    api.post(`/tournaments/${tournamentId}/teams`, { teamId }).then(getData),

  removeTeam: (tournamentId: string, teamId: string) =>
    api.delete(`/tournaments/${tournamentId}/teams/${teamId}`).then(getData),

  generateFixtures: (tournamentId: string) =>
    api.post(`/tournaments/${tournamentId}/bracket`).then(getData),

  startTournament: (tournamentId: string) =>
    api.post(`/tournaments/${tournamentId}/start`).then(getData),

  endTournament: (tournamentId: string, winnerId?: string) =>
    api.post(`/tournaments/${tournamentId}/end`, { winnerId }).then(getData),

  getTournamentMatches: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/matches`).then(getData),

  getTournamentStats: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/stats`).then(getData),

  searchTournaments: (q: string) =>
    api.get(`/tournaments/search?q=${encodeURIComponent(q)}`).then(getData),

  goLive: (id: string) =>
    api.post(`/tournaments/${id}/live`).then(getData),

  updateLiveScores: (id: string, scores: any) =>
    api.put(`/tournaments/${id}/scores`, { scores }).then(getData),
};

// ─── MATCH API ─────────────────────────────────────────────────────────────
export const matchAPI = {
  getAllMatches: (params?: { tournament?: string; status?: string }) =>
    api.get('/matches', { params }).then(getData),

  getMatchesByTournament: (tournamentId: string) =>
    api.get('/matches', { params: { tournament: tournamentId } }).then(getData),

  getMatchById: (id: string) =>
    api.get(`/matches/${id}`).then(getData),

  getLiveMatches: () =>
    api.get('/matches/live').then(getData),

  getUpcomingMatches: (limit = 10) =>
    api.get(`/matches/upcoming?limit=${limit}`).then(getData),

  createMatch: (data: CreateMatchPayload) =>
    api.post('/matches', data).then(getData),

  updateMatch: (id: string, data: any) =>
    api.put(`/matches/${id}`, data).then(getData),

  deleteMatch: (id: string) =>
    api.delete(`/matches/${id}`).then(getData),

  // Match setup
  startMatch: (id: string, tossWinner: string, decision: string) =>
    api.post(`/matches/${id}/start`, { tossWinner, decision }).then(getData),

  saveToss: (id: string, tossWinnerId: string, decision: string) =>
    api.post(`/matches/${id}/start`, { tossWinner: tossWinnerId, decision }).then(getData),

  // Scoring — backend route is POST /matches/:id/score
  scoreBall: (id: string, ballData: any) =>
    api.post(`/matches/${id}/score`, ballData).then(getData),

  updateMatchScore: (id: string, ballData: any) =>
    api.post(`/matches/${id}/score`, ballData).then(getData),

  // Player management
  setStriker: (id: string, playerId: string) =>
    api.post(`/matches/${id}/striker`, { playerId }).then(getData),

  setNonStriker: (id: string, playerId: string) =>
    api.post(`/matches/${id}/non-striker`, { playerId }).then(getData),

  setBowler: (id: string, playerId: string) =>
    api.post(`/matches/${id}/bowler`, { playerId }).then(getData),

  endInnings: (id: string) =>
    api.post(`/matches/${id}/end-innings`).then(getData),

  endMatch: (id: string, data?: { winnerId?: string; resultType?: string; margin?: string }) =>
    api.post(`/matches/${id}/end`, data || {}).then(getData),

  updateMatchStatus: (id: string, status: string) =>
    api.put(`/matches/${id}/status`, { status }).then(getData),

  setMatchOverlay: (id: string, overlayId: string) =>
    api.put(`/matches/${id}/overlay`, { overlayId }).then(getData),

  getTournamentStats: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/stats`).then(getData),
};

  // ─── TEAM API ──────────────────────────────────────────────────────────────
export const teamAPI = {
  getTeams: (tournamentId?: string) =>
    api.get(tournamentId ? `/teams?tournament=${tournamentId}` : '/teams').then(getData),

  getTeamById: (id: string) =>
    api.get(`/teams/${id}`).then(getData),

  createTeam: (data: CreateTeamPayload) =>
    api.post('/teams', data).then(getData),

  updateTeam: (id: string, data: Partial<CreateTeamPayload>) =>
    api.put(`/teams/${id}`, data).then(getData),

  deleteTeam: (id: string) =>
    api.delete(`/teams/${id}`).then(getData),

  addPlayer: (teamId: string, player: AddPlayerPayload) =>
    api.post(`/teams/${teamId}/players`, player).then(getData),

  removePlayer: (teamId: string, playerId: string) =>
    api.delete(`/teams/${teamId}/players/${playerId}`).then(getData),

  getTeamPlayers: (teamId: string) =>
    api.get(`/teams/${teamId}/players`).then(getData),

  getUserTeams: () =>
    api.get('/teams/my').then(getData),

  searchTeams: (q: string) =>
    api.get(`/teams/search?q=${encodeURIComponent(q)}`).then(getData),
};

// ─── USER API ──────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () =>
    api.get('/users/profile').then(getData),

  updateProfile: (data: any) =>
    api.put('/users/profile', data).then(getData),

  searchUsers: (query: string) =>
    api.get(`/users/search?query=${query}`).then(getData),

  getAllUsers: () =>
    api.get('/users/all').then(getData),

  updateUserRole: (userId: string, role: string) =>
    api.put(`/users/${userId}/role`, { role }).then(getData),

  updateUserMembership: (userId: string, data: { level: number; durationMonths?: number }) =>
    api.put(`/users/${userId}/membership`, data).then(getData),

  banUser: (userId: string) =>
    api.put(`/users/${userId}/ban`).then(getData),

  unbanUser: (userId: string) =>
    api.put(`/users/${userId}/unban`).then(getData),
};

  // ─── OVERLAY API ───────────────────────────────────────────────────────────
export const overlayAPI = {
  getOverlays: () =>
    api.get('/overlays').then(getData),

  getOverlay: (id: string) =>
    api.get(`/overlays/${id}`).then(getData),

  createOverlay: (data: any) =>
    api.post('/overlays', data).then(getData),

  updateOverlay: (id: string, data: any) =>
    api.put(`/overlays/${id}`, data).then(getData),

  deleteOverlay: (id: string) =>
    api.delete(`/overlays/${id}`).then(getData),

  getTemplates: () =>
    api.get('/overlays/templates').then(getData),

  getMembershipStatus: () =>
    api.get('/overlays/membership-status').then(getData),

  regenerateOverlay: (id: string) =>
    api.post(`/overlays/${id}/regenerate`).then(getData),
};

// ─── FRIEND API ────────────────────────────────────────────────────────────
export const friendAPI = {
  getFriends: () =>
    api.get('/friends').then(getData),

  getPendingRequests: () =>
    api.get('/friends/requests').then(getData),

  sendRequest: (userId: string) =>
    api.post('/friends', { userId }).then(getData),

  acceptRequest: (requestId: string) =>
    api.put(`/friends/${requestId}/accept`).then(getData),

  rejectRequest: (requestId: string) =>
    api.put(`/friends/${requestId}/reject`).then(getData),

  removeFriend: (friendId: string) =>
    api.delete(`/friends/${friendId}`).then(getData),

  searchUsers: (q: string) =>
    api.get(`/friends/search?q=${encodeURIComponent(q)}`).then(getData),

  getOnlineFriends: () =>
    api.get('/friends/online').then(getData),
};

// ─── MESSAGE API ───────────────────────────────────────────────────────────
export const messageAPI = {
  getConversations: () =>
    api.get('/messages/conversations').then(getData),

  getMessages: (userId: string) =>
    api.get(`/messages/${userId}`).then(getData),

  sendMessage: (toUserId: string, content: string) =>
    api.post('/messages', { toUserId, content }).then(getData),

  markAsRead: (conversationId: string) =>
    api.put(`/messages/${conversationId}/read`).then(getData),

  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`).then(getData),
};

// ─── CLUB API ──────────────────────────────────────────────────────────────
export const clubAPI = {
  getClubs: () =>
    api.get('/clubs').then(getData),

  getMyClubs: () =>
    api.get('/clubs/my').then(getData),

  createClub: (data: any) =>
    api.post('/clubs', data).then(getData),

  updateClub: (id: string, data: any) =>
    api.put(`/clubs/${id}`, data).then(getData),

  deleteClub: (id: string) =>
    api.delete(`/clubs/${id}`).then(getData),

  joinClub: (id: string) =>
    api.post(`/clubs/${id}/join`).then(getData),

  leaveClub: (id: string) =>
    api.post(`/clubs/${id}/leave`).then(getData),
};

// ─── LEADERBOARD API ───────────────────────────────────────────────────────
export const leaderboardAPI = {
  getGlobalLeaderboard: (type: 'player' | 'team' = 'player', page = 1, limit = 50) =>
    api.get(`/leaderboard?type=${type}&page=${page}&limit=${limit}`).then(getData),

  getTournamentLeaderboard: (tournamentId: string, type: 'player' | 'team' = 'player') =>
    api.get(`/leaderboard/tournament/${tournamentId}?type=${type}`).then(getData),

  getMatchLeaderboard: (matchId: string) =>
    api.get(`/leaderboard/match/${matchId}`).then(getData),

  getOrangeCap: (tournamentId?: string) =>
    api.get('/leaderboard/orange-cap', { params: { tournamentId } }).then(getData),

  getPurpleCap: (tournamentId?: string) =>
    api.get('/leaderboard/purple-cap', { params: { tournamentId } }).then(getData),

  getBattingLeaderboard: (tournamentId?: string) =>
    api.get(`/leaderboard/tournament/${tournamentId || ''}/batting`).then(getData),

  getBowlingLeaderboard: (tournamentId?: string) =>
    api.get(`/leaderboard/tournament/${tournamentId || ''}/bowling`).then(getData),

  getTeamLeaderboard: (tournamentId?: string) =>
    api.get(`/leaderboard/tournament/${tournamentId || ''}/team`).then(getData),
};

  // ─── PAYMENT API ───────────────────────────────────────────────────────────
export const paymentAPI = {
  getPlans: () =>
    api.get('/payments/plans').then(getData),

  getMembership: () =>
    api.get('/payments/membership').then(getData),

  purchaseMembership: (planId: string, cardNumber: string, expiry: string, cvv: string) =>
    api.post('/payments/membership', { planId, cardNumber, expiry, cvv }).then(getData),

  extendMembership: (months: number, cardNumber: string, expiry: string, cvv: string) =>
    api.post('/payments/extend', { months, cardNumber, expiry, cvv }).then(getData),

  cancelMembership: () =>
    api.post('/payments/cancel').then(getData),

  getPaymentHistory: () =>
    api.get('/payments/history').then(getData),

  createSubscription: (planName: string) =>
    api.post('/payments/subscription', { planName }).then(getData),

  createRazorpayOrder: (amount: number, planName: string) =>
    api.post('/payments/razorpay/order', { amount, planName }).then(getData),

  verifyRazorpayPayment: (data: any) =>
    api.post('/payments/razorpay/verify', data).then(getData),
};

  // ─── BRACKET API ───────────────────────────────────────────────────────────
export const bracketAPI = {
  getBrackets: () =>
    api.get('/brackets').then(getData),

  createBracket: (data: any) =>
    api.post('/brackets', data).then(getData),

  updateBracket: (id: string, data: any) =>
    api.put(`/brackets/${id}`, data).then(getData),

  generateBracket: (id: string, teams: any[]) =>
    api.post(`/brackets/${id}/generate`, { teams }).then(getData),

  deleteBracket: (id: string) =>
    api.delete(`/brackets/${id}`).then(getData),
};

export default api;

// ─── Backward compatibility aliases ────────────────────────────────────────
export const getMatches = matchAPI.getAllMatches;
export const getMatch = matchAPI.getMatchById;
export const getMatchesByTournament = matchAPI.getMatchesByTournament;
export const updateMatchScore = matchAPI.scoreBall;
export const updateLiveScores = matchAPI.scoreBall;
export const goLive = tournamentAPI.goLive;
export const updateLiveScoresTournament = tournamentAPI.updateLiveScores;
