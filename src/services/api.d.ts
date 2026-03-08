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
