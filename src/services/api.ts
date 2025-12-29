import axios from 'axios';
// Fixed: Corrected base URL and added error handling
import axios from 'axios';

const API_BASE_URL = 'https://scorex-backend-live.vercel.app/';  // Fixed: Use your actual backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();  // Fixed: Reload instead of href
    }
    return Promise.reject(error);
  }
);

// ... (rest of your existing API functions)

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

export const tournamentAPI = {
  getTournaments: () => api.get('/tournaments'),
  createTournament: (data: any) => api.post('/tournaments', data),
  getTournament: (id: string) => api.get(`/tournaments/${id}`),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  goLive: (id: string) => api.post(`/tournaments/${id}/live`),
  updateLiveScores: (id: string, data: any) => api.put(`/tournaments/${id}/scores`, data),
};

export const teamAPI = {
  getTeams: (tournamentId?: string) =>
    api.get('/teams', { params: { tournament: tournamentId } }),
  createTeam: (data: FormData) => api.post('/teams', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateTeam: (id: string, data: FormData) => api.put(`/teams/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, data: FormData) => api.post(`/teams/${teamId}/players`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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

export default api;
