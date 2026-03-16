/**
 * Match API Service
 * Provides methods for cricket match scoring and management
 */
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
// Create axios instance
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
// API Methods
export const matchApi = {
    // Start match (toss + batting order)
    startMatch: async (matchId, payload) => {
        const response = await apiClient.put(`/matches/${matchId}/start`, payload);
        return response.data;
    },
    // End innings
    endInnings: async (matchId) => {
        const response = await apiClient.put(`/matches/${matchId}/end-innings`);
        return response.data;
    },
    // Score a ball
    scoreBall: async (matchId, payload) => {
        const response = await apiClient.put(`/matches/${matchId}/score`, payload);
        return response.data;
    },
    // Backward compatibility alias
    updateMatchScore: async (matchId, payload) => {
        const response = await apiClient.put(`/matches/${matchId}/score`, payload);
        return response.data;
    },
    // Undo last ball
    undoBall: async (matchId) => {
        const response = await apiClient.put(`/matches/${matchId}/undo`);
        return response.data;
    },
    // Get match by ID
    getMatch: async (matchId) => {
        const response = await apiClient.get(`/matches/${matchId}`);
        return response.data;
    },
    // Get all matches
    getMatches: async (params) => {
        const response = await apiClient.get('/matches', { params });
        return response.data;
    },
    // Get matches by tournament
    getMatchesByTournament: async (tournamentId) => {
        const response = await apiClient.get('/matches', { params: { tournament: tournamentId } });
        return response.data;
    },
    // Save toss
    saveToss: async (matchId, tossWinnerId, decision, forceStart) => {
        const payload = {
            tossWinner: tossWinnerId,
            decision: decision.toLowerCase()
        };
        if (forceStart) {
            payload.forceStart = true;
        }
        const response = await apiClient.put(`/matches/${matchId}/toss`, payload);
        return response.data;
    },
    // Save player selections
    savePlayerSelections: async (matchId, payload) => {
        const response = await apiClient.put(`/matches/${matchId}/players`, payload);
        return response.data;
    },
    // Change bowler
    changeBowler: async (matchId, newBowlerId, newBowlerName) => {
        const response = await apiClient.put(`/matches/${matchId}/bowler`, {
            newBowler: newBowlerId
        });
        return response.data;
    },
    // Update striker
    updateStriker: async (matchId, newStrikerId, newStrikerName) => {
        const response = await apiClient.put(`/matches/${matchId}/striker`, {
            newStriker: newStrikerId
        });
        return response.data;
    },
    // Update non-striker
    updateNonStriker: async (matchId, newNonStrikerId, newNonStrikerName) => {
        const response = await apiClient.put(`/matches/${matchId}/nonstriker`, {
            newNonStriker: newNonStrikerId
        });
        return response.data;
    },
    // Get tournament statistics
    getTournamentStats: async (tournamentId) => {
        const response = await apiClient.get(`/matches/stats/${tournamentId}`);
        return response.data;
    },
    // Create match
    createMatch: async (data) => {
        const response = await apiClient.post('/matches', data);
        return response.data;
    },
    // Update match status
    updateMatchStatus: async (matchId, status) => {
        const response = await apiClient.put(`/matches/${matchId}/status`, { status });
        return response.data;
    },
    // Delete match
    deleteMatch: async (matchId) => {
        const response = await apiClient.delete(`/matches/${matchId}`);
        return response.data;
    }
};
export default matchApi;
