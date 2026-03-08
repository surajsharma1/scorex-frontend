/**
 * @deprecated This file is deprecated. All functionality has been merged into api.ts.
 * Please import from '../services/api' instead.
 * 
 * This file is kept for backward compatibility only.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create a simple axios instance for backward compatibility
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export BallPayload type for backward compatibility
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

// Export PlayerSelectionPayload type for backward compatibility
export interface PlayerSelectionPayload {
  battingOrder: string[];
  bowlingOrder: string[];
  striker: string;
  nonStriker: string;
  bowler: string;
}

// Re-export matchAPI functions for backward compatibility
const matchAPI = {
  // Score a ball (also exported as updateMatchScore for backward compatibility)
  scoreBall: async (matchId: string, payload: any) => {
    const response = await apiClient.put(`/matches/${matchId}/score`, payload);
    return response.data;
  },

  // Backward compatibility alias
  updateMatchScore: async (matchId: string, payload: any) => {
    const response = await apiClient.put(`/matches/${matchId}/score`, payload);
    return response.data;
  },

  // Undo last ball
  undoBall: async (matchId: string) => {
    const response = await apiClient.put(`/matches/${matchId}/undo`);
    return response.data;
  },

  // Get match by ID
  getMatch: async (matchId: string) => {
    const response = await apiClient.get(`/matches/${matchId}`);
    return response.data;
  },

  // Get all matches
  getMatches: async (params?: { tournament?: string; status?: string }) => {
    const response = await apiClient.get('/matches', { params });
    return response.data;
  },

  // Get matches by tournament
  getMatchesByTournament: async (tournamentId: string) => {
    const response = await apiClient.get('/matches', { params: { tournament: tournamentId } });
    return response.data;
  },

  // Save toss
  saveToss: async (matchId: string, tossWinnerId: string, decision: string) => {
    const formattedDecision = decision.charAt(0).toUpperCase() + decision.slice(1);
    const response = await apiClient.put(`/matches/${matchId}/toss`, {
      tossWinnerId,
      decision: formattedDecision
    });
    return response.data;
  },

  // Save player selections
  savePlayerSelections: async (matchId: string, payload: any) => {
    const response = await apiClient.put(`/matches/${matchId}/players`, payload);
    return response.data;
  },

  // Change bowler
  changeBowler: async (matchId: string, newBowlerId: string, newBowlerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/bowler`, {
      newBowler: newBowlerId
    });
    return response.data;
  },

  // Update striker
  updateStriker: async (matchId: string, newStrikerId: string, newStrikerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/striker`, {
      newStriker: newStrikerId
    });
    return response.data;
  },

  // Update non-striker
  updateNonStriker: async (matchId: string, newNonStrikerId: string, newNonStrikerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/nonstriker`, {
      newNonStriker: newNonStrikerId
    });
    return response.data;
  },

  // Get tournament statistics
  getTournamentStats: async (tournamentId: string) => {
    const response = await apiClient.get(`/matches/stats/${tournamentId}`);
    return response.data;
  },

  // Create match
  createMatch: async (data: any) => {
    const response = await apiClient.post('/matches', data);
    return response.data;
  },

  // Delete match
  deleteMatch: async (matchId: string) => {
    const response = await apiClient.delete(`/matches/${matchId}`);
    return response.data;
  }
};

// Export both matchAPI and matchApi for backward compatibility
export const matchApi = matchAPI;
export { matchAPI };

export default matchApi;
