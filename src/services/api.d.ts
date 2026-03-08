/**
 * ScoreX API Client Type Definitions
 */

import { AxiosInstance } from 'axios';

declare const api: AxiosInstance;
export default api;

// Type definitions for API operations
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

export interface PlayerSelectionPayload {
  battingOrder: string[];
  bowlingOrder: string[];
  striker: string;
  nonStriker: string;
  bowler: string;
}

// Auth API
export declare const authAPI: {
  login: (data: { email: string; password: string }) => Promise<any>;
  register: (data: { username: string; email: string; password: string }) => Promise<any>;
  getCurrentUser: () => Promise<any>;
  googleLogin: (token: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
};

// Tournament API
export declare const tournamentAPI: {
  getTournaments: (page?: number, limit?: number) => Promise<any>;
  getTournament: (id: string) => Promise<any>;
  createTournament: (data: any) => Promise<any>;
  updateTournament: (id: string, data: any) => Promise<any>;
  deleteTournament: (id: string) => Promise<any>;
  addTeam: (tournamentId: string, teamId: string) => Promise<any>;
  generateFixtures: (tournamentId: string) => Promise<any>;
  getTournamentMatches: (tournamentId: string) => Promise<any>;
  goLive: (id: string) => Promise<any>;
  updateLiveScores: (id: string, scores: any) => Promise<any>;
};

// Match API
export declare const matchAPI: {
  getAllMatches: (params?: { tournament?: string; status?: string }) => Promise<any>;
  getMatchById: (id: string) => Promise<any>;
  createMatch: (data: any) => Promise<any>;
  updateMatch: (id: string, data: any) => Promise<any>;
  deleteMatch: (id: string) => Promise<any>;
  saveToss: (id: string, tossWinnerId: string, decision: string) => Promise<any>;
  savePlayerSelections: (id: string, data: PlayerSelectionPayload) => Promise<any>;
  startMatch: (id: string, tossWinnerId: string, decision: string) => Promise<any>;
  scoreBall: (id: string, ballData: BallPayload) => Promise<any>;
  undoLastBall: (id: string) => Promise<any>;
  changeBowler: (id: string, newBowler: string) => Promise<any>;
  updateStriker: (id: string, newStriker: string) => Promise<any>;
  updateNonStriker: (id: string, newNonStriker: string) => Promise<any>;
  getTournamentStats: (tournamentId: string) => Promise<any>;
};

// Team API
export declare const teamAPI: {
  getTeams: (tournamentId?: string) => Promise<any>;
  getTeamById: (id: string) => Promise<any>;
  createTeam: (data: any) => Promise<any>;
  updateTeam: (id: string, data: any) => Promise<any>;
  deleteTeam: (id: string) => Promise<any>;
  addPlayer: (teamId: string, player: any) => Promise<any>;
};

// User API
export declare const userAPI: {
  getProfile: () => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  searchUsers: (query: string) => Promise<any>;
  getAllUsers: () => Promise<any>;
  banUser: (userId: string) => Promise<any>;
  unbanUser: (userId: string) => Promise<any>;
  updateUserRole: (userId: string, role: string) => Promise<any>;
  updateUserMembership: (userId: string, data: { level: number; durationMonths?: number }) => Promise<any>;
};

// Overlay API
export declare const overlayAPI: {
  getOverlays: () => Promise<any>;
  getOverlay: (id: string) => Promise<any>;
  createOverlay: (data: any) => Promise<any>;
  updateOverlay: (id: string, data: any) => Promise<any>;
  deleteOverlay: (id: string) => Promise<any>;
  getTemplates: () => Promise<any>;
  getMembershipStatus: () => Promise<any>;
  regenerateOverlay: (id: string) => Promise<any>;
};

// Friend API
export declare const friendAPI: {
  getFriends: () => Promise<any>;
  getPendingRequests: () => Promise<any>;
  sendRequest: (userId: string) => Promise<any>;
  acceptRequest: (requestId: string) => Promise<any>;
  rejectRequest: (requestId: string) => Promise<any>;
  removeFriend: (friendId: string) => Promise<any>;
};

// Message API
export declare const messageAPI: {
  getMessages: (userId: string) => Promise<any>;
  sendMessage: (toUserId: string, content: string) => Promise<any>;
};

// Club API
export declare const clubAPI: {
  getClubs: () => Promise<any>;
  getMyClubs: () => Promise<any>;
  createClub: (data: any) => Promise<any>;
  joinClub: (id: string) => Promise<any>;
};

// Leaderboard API
export declare const leaderboardAPI: {
  getBattingLeaderboard: (tournamentId?: string) => Promise<any>;
  getBowlingLeaderboard: (tournamentId?: string) => Promise<any>;
  getTeamLeaderboard: (tournamentId?: string) => Promise<any>;
};

// Payment API
export declare const paymentAPI: {
  createSubscription: (plan: string) => Promise<any>;
  createRazorpayOrder: (amount: number, plan: string) => Promise<any>;
  verifyRazorpayPayment: (data: any) => Promise<any>;
};

// Bracket API
export declare const bracketAPI: {
  updateBracket: (tournamentId: string, data: any) => Promise<any>;
};

// Backward compatibility aliases
export declare const getMatches: any;
export declare const getMatch: any;
export declare const getMatchesByTournament: any;
export declare const updateMatchScore: any;
export declare const updateLiveScores: any;
export declare const goLive: any;
export declare const updateLiveScoresTournament: any;
