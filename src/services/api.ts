import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://scorex-backend-eq9iuv2oi-suraj-sharmas-projects-3413126b.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  create: (data: any) => api.post('/tournaments', data).then(res => res.data),
};

export const teamAPI = {
  getAll: () => api.get('/teams').then(res => res.data),
  create: (data: any) => api.post('/teams', data).then(res => res.data),
};

export const bracketAPI = {
  getAll: () => api.get('/brackets').then(res => res.data),
};

export const overlayAPI = {
  getAll: () => api.get('/overlays').then(res => res.data),
  create: (data: any) => api.post('/overlays', data).then(res => res.data),
};