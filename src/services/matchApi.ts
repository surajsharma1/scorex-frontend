
import axios from 'axios';

// Assuming you use Vite, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create an Axios instance with an interceptor to always attach the Auth token
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Or wherever you store your JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  // Sync a single ball to the database - uses POST (deployed backend)
  scoreBall: async (matchId: string, payload: BallPayload) => {
    const response = await apiClient.post(`/matches/${matchId}/score`, payload);
    return response.data;
  },

  // Trigger the backend mathematically perfect undo - uses POST (deployed backend)
  undoBall: async (matchId: string) => {
    const response = await apiClient.post(`/matches/${matchId}/undo`);
    return response.data;
  },

  // Fetch match state on initial load/refresh
  getMatch: async (matchId: string) => {
    const response = await apiClient.get(`/matches/${matchId}`);
    return response.data;
  },

  // Save toss result - uses /start endpoint (deployed backend doesn't have /toss)
  saveToss: async (matchId: string, tossWinnerId: string, decision: string) => {
    const response = await apiClient.put(`/matches/${matchId}/start`, {
      tossWinnerId,
      decision
    });
    return response.data;
  },

  // Save player selections (batting order, bowling order, current on-field players)
  savePlayerSelections: async (matchId: string, payload: PlayerSelectionPayload) => {
    const response = await apiClient.put(`/matches/${matchId}/players`, payload);
    return response.data;
  },

  // Change bowler after each over
  changeBowler: async (matchId: string, newBowlerId: string, newBowlerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/bowler`, {
      newBowlerId,
      newBowlerName
    });
    return response.data;
  },

  // Update striker (for wicket or manual change)
  updateStriker: async (matchId: string, newStrikerId: string, newStrikerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/striker`, {
      newStrikerId,
      newStrikerName
    });
    return response.data;
  },

  // Update non-striker (for manual change)
  updateNonStriker: async (matchId: string, newNonStrikerId: string, newNonStrikerName: string) => {
    const response = await apiClient.put(`/matches/${matchId}/nonstriker`, {
      newNonStrikerId,
      newNonStrikerName
    });
    return response.data;
  },

  // Get tournament statistics
  getTournamentStats: async (tournamentId: string) => {
    const response = await apiClient.get(`/matches/stats/${tournamentId}`);
    return response.data;
  }
};

