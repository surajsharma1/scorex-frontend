import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://scorex-backend-live.vercel.app/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    if (response?.status === 429 && !config._retry) {
      config._retry = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

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