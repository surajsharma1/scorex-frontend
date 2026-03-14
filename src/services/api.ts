/**
 * ScoreX API Client
 * Unified API for all backend endpoints
 * Base URL: /api/v1 (proxied) or VITE_API_BASE_URL env **/

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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
    // Skip auth for public endpoints
    const publicEndpoints = ['/teams', '/matches', '/tournaments', '/leaderboard'];
    const isPublic = publicEndpoints.some(endpoint => config.url?.startsWith(endpoint));
    
    if (token && !isPublic) {
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
      const errorData = error.response.data as any;
      const errorMessage = errorData.message || errorData.data?.message || '';
      // Only clear/redirect on explicit auth failures, not permission issues
      if (errorMessage.includes('Not authorized') || errorMessage.includes('token') || errorMessage.includes('Invalid credentials')) {
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
  updateLiveScores: (id: string, scores: any) => 
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
  updateMatch: (id: string, data: any) => 
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
  
  // Score a single ball - using any type for backward compatibility with ScoreboardUpdate component
  scoreBall: (id: string, ballData: any) => 
    api.put(`/matches/${id}/score`, ballData).then(getData),
  
  // Backward compatibility: updateMatchScore is alias for scoreBall
  updateMatchScore: (id: string, ballData: any) => 
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
  updateProfile: (data: any) => 
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
  createOverlay: (data: any) => 
    api.post('/overlays', data).then(getData),
  
  // Update overlay
  updateOverlay: (id: string, data: any) => 
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
  createClub: (data: any) => 
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
  verifyRazorpayPayment: (data: any) => 
    api.post('/payments/razorpay/verify', data).then(getData),
};

// ============================================
// BRACKET API
// ============================================

export const bracketAPI = {
  // Update bracket for tournament
  updateBracket: (tournamentId: string, data: any) => 
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
