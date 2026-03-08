/**
 * ScoreX API Client
 * Unified API for all backend endpoints
 * Base URL: /api/v1
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// ============================================
// Axios Instance Setup
// ============================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle Errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
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
// Helper function to extract data from response
// ============================================

const getData = (response: any) => response.data;

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Login with email/password
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data).then(getData),
  
  // Register new user
  register: (data: { username: string; email: string; password: string }) => 
    api.post('/auth/register', data).then(getData),
  
  // Get current authenticated user
  getCurrentUser: () => 
    api.get('/auth/me').then(getData),
  
  // Google OAuth login
  googleLogin: (token: string) => 
    api.post('/auth/google', { token }).then(getData),
  
  // Request password reset
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }).then(getData),
  
  // Reset password with token
  resetPassword: (token: string, password: string) => 
    api.post(`/auth/reset-password/${token}`, { password }).then(getData),
  
  // Verify email
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`).then(getData),
};

// ============================================
// TOURNAMENT API
// ============================================

export const tournamentAPI = {
  // List all tournaments with pagination
  getTournaments: (page = 1, limit = 10) => 
  locationType?: string;
  type?: string;
  format?: string;
}

// Team types
export interface CreateTeamPayload {
  name: string;
  color?: string;
  tournament?: string;
  players?: Array<{ name: string; role: string; jerseyNumber: string }>;
}

// Player types
export interface AddPlayerPayload {
  name: string;
  role: string;
  jerseyNumber: string;
}

// Helper function to extract data from response
const getData = (response: any) => response.data;

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Login with email/password
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data).then(getData),
  
  // Register new user
  register: (data: { username: string; email: string; password: string }) => 
    api.post('/auth/register', data).then(getData),
  
  // Get current authenticated user
  getCurrentUser: () => 
    api.get('/auth/me').then(getData),
  
  // Google OAuth login
  googleLogin: (token: string) => 
    api.post('/auth/google', { token }).then(getData),
  
  // Request password reset
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }).then(getData),
  
  // Reset password with token
  resetPassword: (token: string, password: string) => 
    api.post(`/auth/reset-password/${token}`, { password }).then(getData),
  
  // Verify email
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`).then(getData),
};

// ============================================
// TOURNAMENT API
// ============================================

export const tournamentAPI = {
  // List all tournaments with pagination
  getTournaments: (page = 1, limit = 10) => 
    api.get(`/tournaments?page=${page}&limit=${limit}`).then(getData),
  
  // Get single tournament by ID
  getTournament: (id: string) => 
    api.get(`/tournaments/${id}`).then(getData),
  
  // Create new tournament
  createTournament: (data: CreateTournamentPayload) => 
    api.post('/tournaments', data).then(getData),
  
  // Update tournament
  updateTournament: (id: string, data: Partial<CreateTournamentPayload>) => 
    api.put(`/tournaments/${id}`, data).then(getData),
  
  // Delete tournament
  deleteTournament: (id: string) => 
    api.delete(`/tournaments/${id}`).then(getData),
  
  // Add team to tournament
  addTeam: (tournamentId: string, teamId: string) => 
    api.post(`/tournaments/${tournamentId}/teams`, { teamId }).then(getData),
  
  // Generate fixtures for tournament
  generateFixtures: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/fixtures`).then(getData),
  
  // Get all matches for a tournament
  getTournamentMatches: (tournamentId: string) => 
    api.get(`/tournaments/${tournamentId}/matches`).then(getData),
  
  // Go live with tournament
  goLive: (id: string) => 
    api.post(`/tournaments/${id}/live`).then(getData),
  
  // Update live scores
  updateLiveScores: (id: string, scores: unknown) => 
    api.put(`/tournaments/${id}/scores`, { scores }).then(getData),
};

// ============================================
// MATCH API
// ============================================

export const matchAPI = {
  // Get all matches with optional filters
  getAllMatches: (params?: { tournament?: string; status?: string }) => 
    api.get('/matches', { params }).then(getData),
  
  // Get matches by tournament ID (convenience method)
  getMatchesByTournament: (tournamentId: string) => 
    api.get('/matches', { params: { tournament: tournamentId } }).then(getData),
  
  // Get single match by ID
  getMatchById: (id: string) => 
    api.get(`/matches/${id}`).then(getData),
  
  // Create new match
  createMatch: (data: CreateMatchPayload) => 
    api.post('/matches', data).then(getData),
  
  // Update match details
  updateMatch: (id: string, data: unknown) => 
    api.put(`/matches/${id}`, data).then(getData),
  
  // Delete match
  deleteMatch: (id: string) => 
    api.delete(`/matches/${id}`).then(getData),
  
  // --- Match Setup ---
  
  // Save toss winner and decision
  saveToss: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/toss`, { tossWinnerId, decision }).then(getData),
  
  // Save player selections (batting order, bowling order, current players)
  savePlayerSelections: (id: string, data: PlayerSelectionPayload) => 
    api.put(`/matches/${id}/players`, data).then(getData),
  
  // Start match (after toss)
  startMatch: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/start`, { tossWinnerId, decision }).then(getData),
  
  // --- Scoring ---
  
  // Score a single ball
  scoreBall: (id: string, ballData: BallPayload) => 
    api.put(`/matches/${id}/score`, ballData).then(getData),
  
  // Backward compatibility: updateMatchScore is alias for scoreBall
  updateMatchScore: (id: string, ballData: BallPayload) => 
    api.put(`/matches/${id}/score`, ballData).then(getData),
  
  // Undo last ball
  undoLastBall: (id: string) => 
    api.put(`/matches/${id}/undo`).then(getData),
  
  // --- Player Management ---
  
  // Change bowler
  changeBowler: (id: string, newBowler: string) => 
    api.put(`/matches/${id}/bowler`, { newBowler }).then(getData),
  
  // Update striker
  updateStriker: (id: string, newStriker: string) => 
    api.put(`/matches/${id}/striker`, { newStriker }).then(getData),
  
  // Update non-striker
  updateNonStriker: (id: string, newNonStriker: string) => 
    api.put(`/matches/${id}/nonstriker`, { newNonStriker }).then(getData),
  
  // --- Statistics ---
  
  // Get tournament statistics
  getTournamentStats: (tournamentId: string) => 
    api.get(`/matches/stats/${tournamentId}`).then(getData),
};

// ============================================
// TEAM API
// ============================================

export const teamAPI = {
  // Get all teams (optionally filtered by tournament)
  getTeams: (tournamentId?: string) => 
    api.get(tournamentId ? `/teams?tournament=${tournamentId}` : '/teams').then(getData),
  
  // Get single team by ID
  getTeamById: (id: string) => 
    api.get(`/teams/${id}`).then(getData),
  
  // Create new team
  createTeam: (data: CreateTeamPayload) => 
    api.post('/teams', data).then(getData),
  
  // Update team
  updateTeam: (id: string, data: Partial<CreateTeamPayload>) => 
    api.put(`/teams/${id}`, data).then(getData),
  
  // Delete team
  deleteTeam: (id: string) => 
    api.delete(`/teams/${id}`).then(getData),
  
  // Add player to team
  addPlayer: (teamId: string, player: AddPlayerPayload) => 
    api.post(`/teams/${teamId}/players`, player).then(getData),
};

// ============================================
// USER API
// ============================================

export const userAPI = {
  // Get current user profile
  getProfile: () => 
    api.get('/users/profile').then(getData),
  
  // Update current user profile
  updateProfile: (data: unknown) => 
    api.put('/users/profile', data).then(getData),
  
  // Search users by username/email
  searchUsers: (query: string) => 
    api.get(`/users/search?query=${query}`).then(getData),
  
  // --- Admin Routes ---
  
  // Get all users (admin)
  getAllUsers: () => 
    api.get('/users/all').then(getData),
  
  // Ban user (admin)
  banUser: (userId: string) => 
    api.put(`/users/${userId}/ban`).then(getData),
  
  // Unban user (admin)
  unbanUser: (userId: string) => 
    api.put(`/users/${userId}/unban`).then(getData),
  
  // Update user role (admin)
  updateUserRole: (userId: string, role: string) => 
    api.put(`/users/${userId}/role`, { role }).then(getData),
  
  // Update user membership (admin)
  updateUserMembership: (userId: string, data: { level: number; durationMonths?: number }) => 
    api.put(`/users/${userId}/membership`, data).then(getData),
};

// ============================================
// OVERLAY API
// ============================================

export const overlayAPI = {
  // Get all overlays
  getOverlays: () => 
    api.get('/overlays').then(getData),
  
  // Get single overlay
  getOverlay: (id: string) => 
    api.get(`/overlays/${id}`).then(getData),
  
  // Create overlay
  createOverlay: (data: unknown) => 
    api.post('/overlays', data).then(getData),
  
  // Update overlay
  updateOverlay: (id: string, data: unknown) => 
    api.put(`/overlays/${id}`, data).then(getData),
  
  // Delete overlay
  deleteOverlay: (id: string) => 
    api.delete(`/overlays/${id}`).then(getData),
  
  // Get overlay templates
  getTemplates: () => 
    api.get('/overlays/templates').then(getData),
  
  // Check membership status
  getMembershipStatus: () => 
    api.get('/overlays/membership-status').then(getData),
  
  // Regenerate overlay
  regenerateOverlay: (id: string) => 
    api.post(`/overlays/${id}/regenerate`).then(getData),
};

// ============================================
// FRIEND API
// ============================================

export const friendAPI = {
  // Get all friends
  getFriends: () => 
    api.get('/friends').then(getData),
  
  // Get pending friend requests
  getPendingRequests: () => 
    api.get('/friends/requests').then(getData),
  
  // Send friend request
  sendRequest: (userId: string) => 
    api.post(`/friends/request/${userId}`).then(getData),
  
  // Accept friend request
  acceptRequest: (requestId: string) => 
    api.post(`/friends/accept/${requestId}`).then(getData),
  
  // Reject friend request
  rejectRequest: (requestId: string) => 
    api.post(`/friends/reject/${requestId}`).then(getData),
  
  // Remove friend
  removeFriend: (friendId: string) => 
    api.delete(`/friends/${friendId}`).then(getData),
};

// ============================================
// MESSAGE API
// ============================================

export const messageAPI = {
  // Get messages with a user
  getMessages: (userId: string) => 
    api.get(`/messages/${userId}`).then(getData),
  
  // Send message
  sendMessage: (toUserId: string, content: string) => 
    api.post('/messages', { toUserId, content }).then(getData),
};

// ============================================
// CLUB API
// ============================================

export const clubAPI = {
  // Get all clubs
  getClubs: () => 
    api.get('/clubs').then(getData),
  
  // Get my clubs
  getMyClubs: () => 
    api.get('/clubs/my').then(getData),
  
  // Create club
  createClub: (data: unknown) => 
    api.post('/clubs', data).then(getData),
  
  // Join club
  joinClub: (id: string) => 
    api.post(`/clubs/${id}/join`).then(getData),
};

// ============================================
// LEADERBOARD API
// ============================================

export const leaderboardAPI = {
  // Get batting leaderboard
  getBattingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/batting', { params: { tournament: tournamentId } }).then(getData),
  
  // Get bowling leaderboard
  getBowlingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/bowling', { params: { tournament: tournamentId } }).then(getData),
  
  // Get team leaderboard
  getTeamLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/teams', { params: { tournament: tournamentId } }).then(getData),
};

// ============================================
// PAYMENT API
// ============================================

export const paymentAPI = {
  // Create subscription
  createSubscription: (plan: string) => 
    api.post('/payments/subscribe', { plan }).then(getData),
  
  // Create Razorpay order
  createRazorpayOrder: (amount: number, plan: string) => 
    api.post('/payments/razorpay/order', { amount, plan }).then(getData),
  
  // Verify Razorpay payment
  verifyRazorpayPayment: (data: unknown) => 
    api.post('/payments/razorpay/verify', data).then(getData),
};

// ============================================
// BRACKET API
// ============================================

export const bracketAPI = {
  // Update bracket for tournament
  updateBracket: (tournamentId: string, data: unknown) => 
    api.put(`/brackets/${tournamentId}`, data).then(getData),
};

// ============================================
// Export default instance
// ============================================

export default api;

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================

// Keep these for backward compatibility with existing code
export const getMatches = matchAPI.getAllMatches;
export const getMatch = matchAPI.getMatchById;
export const getMatchesByTournament = matchAPI.getMatchesByTournament;
export const updateMatchScore = matchAPI.scoreBall;
export const updateLiveScores = matchAPI.scoreBall;
export const goLive = tournamentAPI.goLive;
export const updateLiveScoresTournament = tournamentAPI.updateLiveScores;
