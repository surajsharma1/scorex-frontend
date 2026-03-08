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
// Type Definitions
// ============================================

// Ball scoring types
export interface BallPayload {
  overNumber: number;
  ballNumber: number;
  bowler: string;
  striker: string;
  nonStriker: string;
  runsOffBat: number;
  extras: number;
  extraType: 'None' | 'WD' | 'NB' | 'B' | 'LB' | 'Penalty';
  isWicket: boolean;
  wicketType?: string;
}

// Player selection types
export interface PlayerSelectionPayload {
  battingOrder: string[];
  bowlingOrder: string[];
  striker: string;
  nonStriker: string;
  bowler: string;
}

// Match types
export interface CreateMatchPayload {
  tournament?: string;
  matchName?: string;
  team1?: string;
  team2?: string;
  venue?: string;
  matchDate?: string;
  format?: string;
  maxOvers?: number;
}

// Tournament types
export interface CreateTournamentPayload {
  name: string;
  description?: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
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

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Login with email/password
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  // Register new user
  register: (data: { username: string; email: string; password: string }) => 
    api.post('/auth/register', data),
  
  // Get current authenticated user
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  // Google OAuth login
  googleLogin: (token: string) => 
    api.post('/auth/google', { token }),
  
  // Request password reset
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  // Reset password with token
  resetPassword: (token: string, password: string) => 
    api.post(`/auth/reset-password/${token}`, { password }),
  
  // Verify email
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`),
};

// ============================================
// TOURNAMENT API
// ============================================

export const tournamentAPI = {
  // List all tournaments with pagination
  getTournaments: (page = 1, limit = 10) => 
    api.get(`/tournaments?page=${page}&limit=${limit}`),
  
  // Get single tournament by ID
  getTournament: (id: string) => 
    api.get(`/tournaments/${id}`),
  
  // Create new tournament
  createTournament: (data: CreateTournamentPayload) => 
    api.post('/tournaments', data),
  
  // Update tournament
  updateTournament: (id: string, data: Partial<CreateTournamentPayload>) => 
    api.put(`/tournaments/${id}`, data),
  
  // Delete tournament
  deleteTournament: (id: string) => 
    api.delete(`/tournaments/${id}`),
  
  // Add team to tournament
  addTeam: (tournamentId: string, teamId: string) => 
    api.post(`/tournaments/${tournamentId}/teams`, { teamId }),
  
  // Generate fixtures for tournament
  generateFixtures: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/fixtures`),
  
  // Get all matches for a tournament
  getTournamentMatches: (tournamentId: string) => 
    api.get(`/tournaments/${tournamentId}/matches`),
  
  // Go live with tournament
  goLive: (id: string) => 
    api.post(`/tournaments/${id}/live`),
  
  // Update live scores
  updateLiveScores: (id: string, scores: unknown) => 
    api.put(`/tournaments/${id}/scores`, { scores }),
};

// ============================================
// MATCH API
// ============================================

export const matchAPI = {
  // Get all matches with optional filters
  getAllMatches: (params?: { tournament?: string; status?: string }) => 
    api.get('/matches', { params }),
  
  // Get single match by ID
  getMatchById: (id: string) => 
    api.get(`/matches/${id}`),
  
  // Create new match
  createMatch: (data: CreateMatchPayload) => 
    api.post('/matches', data),
  
  // Update match details
  updateMatch: (id: string, data: unknown) => 
    api.put(`/matches/${id}`, data),
  
  // Delete match
  deleteMatch: (id: string) => 
    api.delete(`/matches/${id}`),
  
  // --- Match Setup ---
  
  // Save toss winner and decision
  saveToss: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/toss`, { tossWinnerId, decision }),
  
  // Save player selections (batting order, bowling order, current players)
  savePlayerSelections: (id: string, data: PlayerSelectionPayload) => 
    api.put(`/matches/${id}/players`, data),
  
  // Start match (after toss)
  startMatch: (id: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${id}/start`, { tossWinnerId, decision }),
  
  // --- Scoring ---
  
  // Score a single ball
  scoreBall: (id: string, ballData: BallPayload) => 
    api.put(`/matches/${id}/score`, ballData),
  
  // Undo last ball
  undoLastBall: (id: string) => 
    api.put(`/matches/${id}/undo`),
  
  // --- Player Management ---
  
  // Change bowler
  changeBowler: (id: string, newBowler: string) => 
    api.put(`/matches/${id}/bowler`, { newBowler }),
  
  // Update striker
  updateStriker: (id: string, newStriker: string) => 
    api.put(`/matches/${id}/striker`, { newStriker }),
  
  // Update non-striker
  updateNonStriker: (id: string, newNonStriker: string) => 
    api.put(`/matches/${id}/nonstriker`, { newNonStriker }),
  
  // --- Statistics ---
  
  // Get tournament statistics
  getTournamentStats: (tournamentId: string) => 
    api.get(`/matches/stats/${tournamentId}`),
};

// ============================================
// TEAM API
// ============================================

export const teamAPI = {
  // Get all teams (optionally filtered by tournament)
  getTeams: (tournamentId?: string) => 
    api.get(tournamentId ? `/teams?tournament=${tournamentId}` : '/teams'),
  
  // Get single team by ID
  getTeamById: (id: string) => 
    api.get(`/teams/${id}`),
  
  // Create new team
  createTeam: (data: CreateTeamPayload) => 
    api.post('/teams', data),
  
  // Update team
  updateTeam: (id: string, data: Partial<CreateTeamPayload>) => 
    api.put(`/teams/${id}`, data),
  
  // Delete team
  deleteTeam: (id: string) => 
    api.delete(`/teams/${id}`),
  
  // Add player to team
  addPlayer: (teamId: string, player: AddPlayerPayload) => 
    api.post(`/teams/${teamId}/players`, player),
};

// ============================================
// USER API
// ============================================

export const userAPI = {
  // Get current user profile
  getProfile: () => 
    api.get('/users/profile'),
  
  // Update current user profile
  updateProfile: (data: unknown) => 
    api.put('/users/profile', data),
  
  // Search users by username/email
  searchUsers: (query: string) => 
    api.get(`/users/search?query=${query}`),
  
  // --- Admin Routes ---
  
  // Get all users (admin)
  getAllUsers: () => 
    api.get('/users/all'),
  
  // Ban user (admin)
  banUser: (userId: string) => 
    api.put(`/users/${userId}/ban`),
  
  // Unban user (admin)
  unbanUser: (userId: string) => 
    api.put(`/users/${userId}/unban`),
  
  // Update user role (admin)
  updateUserRole: (userId: string, role: string) => 
    api.put(`/users/${userId}/role`, { role }),
  
  // Update user membership (admin)
  updateUserMembership: (userId: string, data: { level: number; durationMonths?: number }) => 
    api.put(`/users/${userId}/membership`, data),
};

// ============================================
// OVERLAY API
// ============================================

export const overlayAPI = {
  // Get all overlays
  getOverlays: () => 
    api.get('/overlays'),
  
  // Get single overlay
  getOverlay: (id: string) => 
    api.get(`/overlays/${id}`),
  
  // Create overlay
  createOverlay: (data: unknown) => 
    api.post('/overlays', data),
  
  // Update overlay
  updateOverlay: (id: string, data: unknown) => 
    api.put(`/overlays/${id}`, data),
  
  // Delete overlay
  deleteOverlay: (id: string) => 
    api.delete(`/overlays/${id}`),
  
  // Get overlay templates
  getTemplates: () => 
    api.get('/overlays/templates'),
  
  // Check membership status
  getMembershipStatus: () => 
    api.get('/overlays/membership-status'),
  
  // Regenerate overlay
  regenerateOverlay: (id: string) => 
    api.post(`/overlays/${id}/regenerate`),
};

// ============================================
// FRIEND API
// ============================================

export const friendAPI = {
  // Get all friends
  getFriends: () => 
    api.get('/friends'),
  
  // Get pending friend requests
  getPendingRequests: () => 
    api.get('/friends/requests'),
  
  // Send friend request
  sendRequest: (userId: string) => 
    api.post(`/friends/request/${userId}`),
  
  // Accept friend request
  acceptRequest: (requestId: string) => 
    api.post(`/friends/accept/${requestId}`),
  
  // Reject friend request
  rejectRequest: (requestId: string) => 
    api.post(`/friends/reject/${requestId}`),
  
  // Remove friend
  removeFriend: (friendId: string) => 
    api.delete(`/friends/${friendId}`),
};

// ============================================
// MESSAGE API
// ============================================

export const messageAPI = {
  // Get messages with a user
  getMessages: (userId: string) => 
    api.get(`/messages/${userId}`),
  
  // Send message
  sendMessage: (toUserId: string, content: string) => 
    api.post('/messages', { toUserId, content }),
};

// ============================================
// CLUB API
// ============================================

export const clubAPI = {
  // Get all clubs
  getClubs: () => 
    api.get('/clubs'),
  
  // Get my clubs
  getMyClubs: () => 
    api.get('/clubs/my'),
  
  // Create club
  createClub: (data: unknown) => 
    api.post('/clubs', data),
  
  // Join club
  joinClub: (id: string) => 
    api.post(`/clubs/${id}/join`),
};

// ============================================
// LEADERBOARD API
// ============================================

export const leaderboardAPI = {
  // Get batting leaderboard
  getBattingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/batting', { params: { tournament: tournamentId } }),
  
  // Get bowling leaderboard
  getBowlingLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/bowling', { params: { tournament: tournamentId } }),
  
  // Get team leaderboard
  getTeamLeaderboard: (tournamentId?: string) => 
    api.get('/leaderboard/teams', { params: { tournament: tournamentId } }),
};

// ============================================
// PAYMENT API
// ============================================

export const paymentAPI = {
  // Create subscription
  createSubscription: (plan: string) => 
    api.post('/payments/subscribe', { plan }),
  
  // Create Razorpay order
  createRazorpayOrder: (amount: number, plan: string) => 
    api.post('/payments/razorpay/order', { amount, plan }),
  
  // Verify Razorpay payment
  verifyRazorpayPayment: (data: unknown) => 
    api.post('/payments/razorpay/verify', data),
};

// ============================================
// BRACKET API
// ============================================

export const bracketAPI = {
  // Update bracket for tournament
  updateBracket: (tournamentId: string, data: unknown) => 
    api.put(`/brackets/${tournamentId}`, data),
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
export const getMatchesByTournament = (tournamentId: string) => 
  api.get('/matches', { params: { tournament: tournamentId } });
export const updateMatchScore = matchAPI.scoreBall;
export const updateLiveScores = matchAPI.scoreBall;
export const goLive = tournamentAPI.goLive;
export const updateLiveScoresTournament = tournamentAPI.updateLiveScores;

