/**
 * matchApi.ts — Fixed & Rewritten
 *
 * BUGS FIXED:
 * 1. scoreBall / updateMatchScore used PUT /matches/:id/score — backend route is POST
 * 2. startMatch used PUT /matches/:id/start — backend route is POST
 * 3. endInnings used PUT /matches/:id/end-innings — backend route is POST
 * 4. changeBowler / updateStriker / updateNonStriker used PUT but backend is POST
 *    and expects field name 'playerId', not 'newBowler'/'newStriker'/'newNonStriker'
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface BallPayload {
  overNumber?: number;
  ballNumber?: number;
  runs?: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isWicket?: boolean;
  outType?: string;
  byes?: number;
  legByes?: number;
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
  runsOffBat?: number;
  extras?: number;
  extraType?: 'None' | 'WD' | 'NB' | 'B' | 'LB' | 'Penalty';
  wicketType?: string;
}

export interface PlayerSelectionPayload {
  team1Players?: {id: string; name: string}[];
  team2Players?: {id: string; name: string}[];
  battingOrder: string[];
  bowlingOrder: string[];
  striker?: string;
  strikerName?: string;
  nonStriker?: string;
  nonStrikerName?: string;
  bowler?: string;
  bowlerName?: string;
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
}

export const matchApi = {
  getMatch: async (matchId: string) => {
    const res = await apiClient.get(`/matches/${matchId}`);
    return res.data;
  },

  getMatches: async (params?: { tournament?: string; status?: string }) => {
    const res = await apiClient.get('/matches', { params });
    return res.data;
  },

  getMatchesByTournament: async (tournamentId: string) => {
    const res = await apiClient.get('/matches', { params: { tournament: tournamentId } });
    return res.data;
  },

  createMatch: async (data: any) => {
    const res = await apiClient.post('/matches', data);
    return res.data;
  },

  deleteMatch: async (matchId: string) => {
    const res = await apiClient.delete(`/matches/${matchId}`);
    return res.data;
  },

  // FIX #2: was PUT, should be POST
  startMatch: async (matchId: string, payload: {
    tossWinner: string; decision: 'bat' | 'bowl';
    striker?: string; nonStriker?: string; bowler?: string;
  }) => {
    const res = await apiClient.post(`/matches/${matchId}/start`, payload);
    return res.data;
  },

  saveToss: async (matchId: string, tossWinnerId: string, decision: string) => {
    const res = await apiClient.post(`/matches/${matchId}/start`, { tossWinner: tossWinnerId, decision });
    return res.data;
  },

  // FIX #1: was PUT, should be POST
  scoreBall: async (matchId: string, payload: BallPayload) => {
    const res = await apiClient.post(`/matches/${matchId}/score`, payload);
    return res.data;
  },

  updateMatchScore: async (matchId: string, payload: any) => {
    const res = await apiClient.post(`/matches/${matchId}/score`, payload);
    return res.data;
  },

  // FIX #3: was PUT, should be POST
  endInnings: async (matchId: string) => {
    const res = await apiClient.post(`/matches/${matchId}/end-innings`);
    return res.data;
  },

  endMatch: async (matchId: string, data?: any) => {
    const res = await apiClient.post(`/matches/${matchId}/end`, data || {});
    return res.data;
  },

  savePlayerSelections: async (matchId: string, payload: PlayerSelectionPayload) => {
    const res = await apiClient.put(`/matches/${matchId}/players`, payload);
    return res.data;
  },

  // FIX #4: backend POST /matches/:id/bowler expects { playerId }, not { newBowler }
  changeBowler: async (matchId: string, playerId: string) => {
    const res = await apiClient.post(`/matches/${matchId}/bowler`, { playerId });
    return res.data;
  },

  updateStriker: async (matchId: string, playerId: string) => {
    const res = await apiClient.post(`/matches/${matchId}/striker`, { playerId });
    return res.data;
  },

  updateNonStriker: async (matchId: string, playerId: string) => {
    const res = await apiClient.post(`/matches/${matchId}/non-striker`, { playerId });
    return res.data;
  },

  undoBall: async (matchId: string) => {
    const res = await apiClient.put(`/matches/${matchId}/undo`);
    return res.data;
  },

  getTournamentStats: async (tournamentId: string) => {
    const res = await apiClient.get(`/matches/stats/${tournamentId}`);
    return res.data;
  },
};

export default matchApi;
