import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const tournamentAPI = {
  getTournaments: () => api.get('/tournaments'),
  getTournament: (id: string) => api.get(`/tournaments/${id}`),
  createTournament: (data: any) => api.post('/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  generateBracket: (id: string) => api.post(`/tournaments/${id}/bracket`),
  startTournament: (id: string) => api.post(`/tournaments/${id}/start`),
  getTournamentMatches: (id: string) => api.get(`/tournaments/${id}/matches`)
};

export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeamsByTournament: (id: string) => api.get(`/tournaments/${id}/teams`),
  createTeam: (data: any) => api.post('/teams', data),
  addPlayer: (id: string, data: any) => api.post(`/teams/${id}/players`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`)
};

export const matchAPI = {
  getMatches: () => api.get('/matches'),
  getMatch: (id: string) => api.get(`/matches/${id}`),
  createMatch: (data: any) => api.post('/matches', data),
  updateMatch: (id: string, data: any) => api.put(`/matches/${id}`, data),
  updateMatchStatus: (id: string, status: string) => api.put(`/matches/${id}`, { status }),
  startMatch: (id: string, data: any) => api.post(`/matches/${id}/start`, data),
  addBall: (id: string, data: any) => api.post(`/matches/${id}/score`, data),
  endInnings: (id: string) => api.post(`/matches/${id}/end-innings`),
  endMatch: (id: string, data: any) => api.post(`/matches/${id}/end`, data),
  getLiveMatches: () => api.get('/matches/live'),
  deleteMatch: (id: string) => api.delete(`/matches/${id}`)
};

export const authAPI = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  searchUsers: (query: string) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
};

export const messageAPI = {
  getMessages: (roomId: string) => api.get(`/messages/${roomId}`),
  sendMessage: (roomId: string, content: string) => api.post(`/messages/${roomId}`, { content }),
};

export const overlayAPI = {
  getOverlays: () => api.get('/overlays'),
  createOverlay: (data: any) => api.post('/overlays', data),
  getOverlay: (id: string) => api.get(`/overlays/${id}`),
  updateOverlay: (id: string, data: any) => api.put(`/overlays/${id}`, data),
};

export const paymentAPI = {
  createPayment: (data: any) => api.post('/payments', data),
  getPayments: () => api.get('/payments'),
};

export default api;
