/**
 * ScoreX API Service
 * Unified API client for all backend endpoints
 * Version 2.0 - Clean, consistent, and organized
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const API_VERSION = 'v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ============================================
// Request Interceptor - Attach Token
// ============================================

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

// ============================================
// Response Interceptor - Handle Errors
// ============================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Type Definitions
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface MatchFilters {
  tournament?: string;
  status?: string;
}

// ============================================
// Auth API Module
// ============================================

export const authAPI = {
  // Login with email/password
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  // Register new user
  register: (userData: { username: string; email: string; password: string }) => 
    api.post('/auth/register', userData),
  
  // Get current authenticated user
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  // Google OAuth login
  googleLogin: (token: string) => 
    api.post('/auth/google', { token }),
  
  // Forgot password
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
// User API Module
// ============================================

export const userAPI = {
  // Get current user's profile
  getProfile: () => 
    api.get('/users/profile'),
  
  // Update current user's profile
  updateProfile: (data: { username?: string; email?: string; fullName?: string; avatar?: string }) => 
    api.put('/users/profile', data),
  
  // Search users by query
  searchUsers: (query: string) => 
    api.get(`/users/search?query=${encodeURIComponent(query)}`),
  
  // Get all users (admin only)
  getUsers: (params?: PaginationParams) => 
    api.get('/users', { params }),
  
  // Get all users including deleted (admin)
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
  
  // Get user stats
  getUserStats: () => 
    api.get('/users/stats'),
};

// ============================================
// Tournament API Module
// ============================================

export const tournamentAPI = {
  // Get all tournaments with pagination
  getTournaments: (params?: PaginationParams & { status?: string; type?: string }) => 
    api.get('/tournaments', { params }),
  
  // Get single tournament by ID
  getTournament: (id: string) => 
    api.get(`/tournaments/${id}`),
  
  // Create new tournament
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
    teams?: string[];
  }) => api.post('/tournaments', data),
  
  // Update tournament
  updateTournament: (id: string, data: any) => 
    api.put(`/tournaments/${id}`, data),
  
  // Delete tournament
  deleteTournament: (id: string) => 
    api.delete(`/tournaments/${id}`),
  
  // Get tournament matches
  getTournamentMatches: (id: string) => 
    api.get(`/tournaments/${id}/matches`),
  
  // Add team to tournament
  addTeamToTournament: (tournamentId: string, teamId: string) => 
    api.post(`/tournaments/${tournamentId}/teams`, { teamId }),
  
  // Generate fixtures
  generateFixtures: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/fixtures`),
  
  // Go live with tournament
  goLive: (id: string) => 
    api.post(`/tournaments/${id}/live`),
  
  // Update live scores
  updateLiveScores: (id: string, scores: any) => 
    api.put(`/tournaments/${id}/scores`, { scores }),
};

// ============================================
// Match API Module
// ============================================

export const matchAPI = {
  // Get all matches with optional filters
  getMatches: (params?: MatchFilters & PaginationParams) => 
    api.get('/matches', { params }),
  
  // Get single match by ID
  getMatch: (id: string) => 
    api.get(`/matches/${id}`),
  
  // Get matches by tournament
  getMatchesByTournament: (tournamentId: string) => 
    api.get('/matches', { params: { tournament: tournamentId } }),
  
  // Create new match
  createMatch: (data: {
    tournament?: string;
    tournamentId?: string;
    matchName?: string;
    team1?: string;
    team2?: string;
    teamA?: string;
    teamB?: string;
    venue?: string;
    date?: string;
    matchDate?: string;
    format?: string;
    matchType?: string;
    maxOvers?: number;
    playersPerSide?: number;
  }) => api.post('/matches', data),
  
  // Update match
  updateMatch: (id: string, data: any) => 
    api.put(`/matches/${id}`, data),
  
  // Delete match
  deleteMatch: (id: string) => 
    api.delete(`/matches/${id}`),
  
  // Save toss result
  saveToss: (id: string, tossWinner: string, tossDecision: string, data: { tossWinnerId: string; decision: 'Bat' | 'Bowl'; }) => 
    api.put(`/matches/${id}/toss`, data),
  
  // Save player selections
  savePlayerSelections: (id: string, data: {
    battingOrder?: string[];
    bowlingOrder?: string[];
    striker?: string;
    nonStriker?: string;
    bowler?: string;
  }) => api.put(`/matches/${id}/players`, data),
  
  // Start match (after toss)
  startMatch: (id: string, data: { tossWinnerId: string; decision: 'Bat' | 'Bowl' }) => 
    api.put(`/matches/${id}/start`, data),
  
  // Score a ball
  scoreBall: (id: string, ballData: {
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
  }) => api.put(`/matches/${id}/score`, ballData),
  
  // Update match score (alias for scoreBall)
  updateMatchScore: (id: string, scores: any) => 
    api.put(`/matches/${id}/score`, scores),
  
  // Undo last ball
  undoLastBall: (id: string) => 
    api.put(`/matches/${id}/undo`),
  
  // Change bowler
  changeBowler: (id: string, newBowler: string) => 
    api.put(`/matches/${id}/bowler`, { newBowler }),
  
  // Update striker
  updateStriker: (id: string, newStriker: string) => 
    api.put(`/matches/${id}/striker`, { newStriker }),
  
  // Update non-striker
  updateNonStriker: (id: string, newNonStriker: string) => 
    api.put(`/matches/${id}/nonstriker`, { newNonStriker }),
  
  // Get tournament statistics
  getTournamentStats: (tournamentId: string) => 
    api.get(`/matches/stats/${tournamentId}`),
};

// ============================================
// Team API Module
// ============================================

export const teamAPI = {
  // Get all teams with optional tournament filter
  getTeams: (params?: { tournament?: string } & PaginationParams) => 
    api.get('/teams', { params }),
  
  // Get single team by ID
  getTeam: (id: string) => 
    api.get(`/teams/${id}`),
  
  // Create new team
  createTeam: (data: {
    name: string;
    color?: string;
    tournament?: string;
    players?: Array<{
      name: string;
      role?: string;
      jerseyNumber?: string;
    }>;
  }) => api.post('/teams', data),
  
  // Update team
  updateTeam: (id: string, data: any) => 
    api.put(`/teams/${id}`, data),
  
  // Delete team
  deleteTeam: (id: string) => 
    api.delete(`/teams/${id}`),
  
  // Add player to team
  addPlayer: (teamId: string, player: {
    name: string;
    role: string;
    jerseyNumber: string;
  }) => api.post(`/teams/${teamId}/players`, player),
  
  // Add player by username
  addPlayerByUsername: (teamId: string, username: string, role?: string, jerseyNumber?: string) => 
    api.post(`/teams/${teamId}/players`, { username, role, jerseyNumber }),
};

// ============================================
// Bracket API Module
// ============================================

export const bracketAPI = {
  // Get bracket for tournament
  getBracket: (tournamentId: string) => 
    api.get(`/brackets/${tournamentId}`),
  
  // Update/create bracket
  updateBracket: (tournamentId: string, data: any) => 
    api.put(`/brackets/${tournamentId}`, data),
  
  // Generate bracket
  generateBracket: (tournamentId: string) => 
    api.post(`/brackets/${tournamentId}/generate`, {}),
};

// ============================================
// Overlay API Module
// ============================================

export const overlayAPI = {
  // Get all overlays
  getOverlays: () => 
    api.get('/overlays'),
  
  // Get single overlay
  getOverlay: (id: string) => 
    api.get(`/overlays/${id}`),
  
  // Create overlay
  createOverlay: (data: any) => 
    api.post('/overlays', data),
  
  // Update overlay
  updateOverlay: (id: string, data: any) => 
    api.put(`/overlays/${id}`, data),
  
  // Delete overlay
  deleteOverlay: (id: string) => 
    api.delete(`/overlays/${id}`),
  
  // Get overlay templates
  getTemplates: () => 
    api.get('/overlays/templates'),
  
  // Get membership status
  getMembershipStatus: () => 
    api.get('/overlays/membership-status'),
  
  // Regenerate overlay
  regenerateOverlay: (id: string) => 
    api.post(`/overlays/${id}/regenerate`),
};

// ============================================
// Friend API Module
// ============================================

export const friendAPI = {
  // Get friends list
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
// Message API Module
// ============================================

export const messageAPI = {
  // Get messages with user
  getMessages: (userId: string) => 
    api.get(`/messages/${userId}`),
  
  // Send message
  sendMessage: (toUserId: string, content: string) => 
    api.post('/messages', { toUserId, content }),
  
  // Get conversation
  getConversation: (userId: string) => 
    api.get(`/messages/conversation/${userId}`),
  
  // Mark messages as read
  markAsRead: (userId: string) => 
    api.put(`/messages/read/${userId}`),
};

// ============================================
// Club API Module
// ============================================

export const clubAPI = {
  // Get all clubs
  getClubs: () => 
    api.get('/clubs'),
  
  // Get user's clubs
  getMyClubs: () => 
    api.get('/clubs/my'),
  
  // Get single club
  getClub: (id: string) => 
    api.get(`/clubs/${id}`),
  
  // Create club
  createClub: (data: any) => 
    api.post('/clubs', data),
  
  // Join club
  joinClub: (id: string) => 
    api.post(`/clubs/${id}/join`),
  
  // Leave club
  leaveClub: (id: string) => 
    api.post(`/clubs/${id}/leave`),
};

// ============================================
// Leaderboard API Module
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
// Payment API Module
// ============================================

export const paymentAPI = {
  // Create subscription
  createSubscription: (plan: string) => 
    api.post('/payments/subscribe', { plan }),
  
  // Create Razorpay order
  createRazorpayOrder: (amount: number, plan: string) => 
    api.post('/payments/razorpay/order', { amount, plan }),
  
  // Verify Razorpay payment
  verifyRazorpayPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => api.post('/payments/razorpay/verify', data),
  
  // Get payment history
  getPaymentHistory: () => 
    api.get('/payments/history'),
};

// ============================================
// Notification API Module
// ============================================

export const notificationAPI = {
  // Get all notifications
  getNotifications: () => 
    api.get('/notifications'),
  
  // Get unread notifications
  getUnreadNotifications: () => 
    api.get('/notifications/unread'),
  
  // Mark notification as read
  markAsRead: (id: string) => 
    api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => 
    api.put('/notifications/read-all'),
  
  // Delete notification
  deleteNotification: (id: string) => 
    api.delete(`/notifications/${id}`),
  
  // Update notification preferences
  updatePreferences: (data: any) => 
    api.put('/notifications/preferences', data),
};

// ============================================
// Stats API Module
// ============================================

export const statsAPI = {
  // Get tournament stats
  getTournamentStats: (tournamentId: string) => 
    api.get(`/stats/tournament/${tournamentId}`),
  
  // Get team stats
  getTeamStats: (teamId: string) => 
    api.get(`/stats/team/${teamId}`),
  
  // Get player stats
  getPlayerStats: (playerId: string) => 
    api.get(`/stats/player/${playerId}`),
  
  // Get overall stats
  getOverallStats: () => 
    api.get('/stats/overall'),
};

// ============================================
// Health Check
// ============================================

export const healthAPI = {
  // Check API health
  check: () => api.get('/health'),
  
  // Get available routes
  getRoutes: () => api.get('/routes'),
};

// ============================================
// Export default instance
// ============================================

export default api;

// ============================================
// Utility Functions
// ============================================

/**
 * Helper to extract data from API response
 */
export const extractData = <T>(response: any): T => {
  return response.data?.data ?? response.data ?? response;
};

/**
 * Helper to check if API call was successful
 */
export const isSuccess = (response: any): boolean => {
  return response.data?.success === true || response.success === true;
};

