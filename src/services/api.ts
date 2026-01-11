import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://scorex-backend-eq9iuv2oi-suraj-sharmas-projects-3413126b.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
};

export const tournamentAPI = {
  getAll: () => api.get('/tournaments').then(res => res.data),
  getById: (id: string) => api.get(`/tournaments/${id}`).then(res => res.data),
  create: (data: any) => api.post('/tournaments', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/tournaments/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
};

export const teamAPI = {
  getAll: () => api.get('/teams').then(res => res.data),
  getByTournament: (tournamentId: string) => api.get(`/teams?tournament=${tournamentId}`).then(res => res.data),
  create: (data: any) => api.post('/teams', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

export const bracketAPI = {
  getAll: () => api.get('/brackets').then(res => res.data),
  create: (data: any) => api.post('/brackets', data).then(res => res.data),
};

export const overlayAPI = {
  getAll: () => api.get('/overlays').then(res => res.data),
  getByTournament: (tournamentId: string) => api.get(`/overlays?tournament=${tournamentId}`).then(res => res.data),
  create: (data: any) => api.post('/overlays', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/overlays/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/overlays/${id}`),
  generateYouTubeLink: (id: string) => api.post(`/overlays/${id}/youtube-link`).then(res => res.data),
};