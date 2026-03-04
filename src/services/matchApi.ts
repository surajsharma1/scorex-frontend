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

export const matchApi = {
  // Sync a single ball to the database
  scoreBall: async (matchId: string, payload: BallPayload) => {
    const response = await apiClient.post(`/matches/${matchId}/score`, payload);
    return response.data;
  },

  // Trigger the backend mathematically perfect undo
  undoBall: async (matchId: string) => {
    const response = await apiClient.post(`/matches/${matchId}/undo`);
    return response.data;
  },

  // Fetch match state on initial load/refresh
  getMatch: async (matchId: string) => {
    const response = await apiClient.get(`/matches/${matchId}`);
    return response.data;
  }
};