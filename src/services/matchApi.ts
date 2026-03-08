import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for match operations
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
  wicketType: string;
}

export interface PlayerSelectionPayload {
  team1Players: { id: string; name: string }[];
  team2Players: { id: string; name: string }[];
  battingOrder: string[];
  bowlingOrder: string[];
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  nonStrikerName: string;
  bowlerId: string;
  bowlerName: string;
}

export const matchApi = {
  // Score a ball
  scoreBall: async (matchId: string, payload: BallPayload) => {
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
  savePlayerSelections: async (matchId: string, payload: PlayerSelectionPayload) => {
    // Transform payload to match backend format
    const backendPayload = {
      battingOrder: payload.battingOrder,
      bowlingOrder: payload.bowlingOrder,
      striker: payload.strikerId,
      nonStriker: payload.nonStrikerId,
      bowler: payload.bowlerId
    };
    const response = await apiClient.put(`/matches/${matchId}/players`, backendPayload);
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

export default matchApi;

