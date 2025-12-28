import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://scorex-backend.vercel.app/api';  // Updated: Use env var, default to your backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';  // Redirect to login
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const tournamentAPI = {
  getTournaments: () => api.get('/tournaments'),
  createTournament: (data: any) => api.post('/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  goLive: (id: string) => api.post(`/tournaments/${id}/live`),
  updateLiveScores: (id: string, data: any) => api.put(`/tournaments/${id}/scores`, data),
};

export const teamAPI = {
  getTeams: () => api.get('/teams'),
  createTeam: (data: FormData) => api.post('/teams', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTeam: (id: string, data: any) => api.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (id: string, data: FormData) => api.post(`/teams/${id}/players`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const bracketAPI = {
  getBrackets: () => api.get('/brackets'),
  createBracket: (data: any) => api.post('/brackets', data),
  updateBracket: (id: string, data: any) => api.put(`/brackets/${id}`, data),
  generateBracket: (id: string, data: any) => api.post(`/brackets/${id}/generate`, data),
};

export const overlayAPI = {
  getOverlays: () => api.get('/overlays'),
  createOverlay: (data: any) => api.post('/overlays', data),
  updateOverlay: (id: string, data: any) => api.put(`/overlays/${id}`, data),
  deleteOverlay: (id: string) => api.delete(`/overlays/${id}`),
};