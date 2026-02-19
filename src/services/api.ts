import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scorex-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure Content-Type is set for POST/PUT requests with data
  if (config.data && (config.method === 'post' || config.method === 'put')) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});


api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!['/login', '/register'].includes(currentPath)) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  register: (data: { username: string; email: string; password: string; fullName?: string; dob?: string; googleId?: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const tournamentAPI = {
  getTournaments: (page: number = 1, limit: number = 10) => api.get('/api/v1/tournaments', { params: { page, limit } }),
  getTournament: (id: string) => api.get(`/api/v1/tournaments/${id}`),
  createTournament: (data: any) => api.post('/api/v1/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/api/v1/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/api/v1/tournaments/${id}`),
  goLive: (id: string) => api.post(`/api/v1/tournaments/${id}/live`),
  updateLiveScores: (id: string, scores: any) => api.put(`/api/v1/tournaments/${id}/scores`, { scores }),
};

export const matchAPI = {
  getMatches: (tournamentId?: string) => api.get('/api/v1/matches', { params: { tournament: tournamentId } }),
  getAllMatches: () => api.get('/api/v1/matches'),
  createMatch: (data: any) => api.post('/api/v1/matches', data),
  updateMatch: (id: string, data: any) => api.put(`/api/v1/matches/${id}`, data),
  updateMatchScore: (id: string, data: any) => api.put(`/api/v1/matches/${id}/score`, data),
  deleteMatch: (id: string) => api.delete(`/api/v1/matches/${id}`),
};

export const teamAPI = {
  getTeams: (tournamentId?: string, page: number = 1, limit: number = 10) => api.get('/api/v1/teams', { params: { tournament: tournamentId, page, limit } }),
  createTeam: (data: FormData) => api.post('/api/v1/teams', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTeam: (id: string, data: FormData) => api.put(`/api/v1/teams/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteTeam: (id: string) => api.delete(`/api/v1/teams/${id}`),
  addPlayer: (teamId: string, data: FormData) => api.post(`/api/v1/teams/${teamId}/players`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addPlayerByUsername: (teamId: string, userId: string) => api.post(`/api/v1/teams/${teamId}/players`, { userId }),
};

export const bracketAPI = {
  getBrackets: () => api.get('/api/v1/brackets'),
  createBracket: (data: any) => api.post('/api/v1/brackets', data),
  updateBracket: (id: string, data: any) => api.put(`/api/v1/brackets/${id}`, data),
  generateBracket: (id: string, data: any) => api.post(`/api/v1/brackets/${id}/generate`, data),
};

export const overlayAPI = {
  getOverlays: () => api.get('/api/v1/overlays'),
  getOverlay: (id: string) => api.get(`/api/v1/overlays/${id}`),
  getOverlayPublic: (publicId: string) => api.get(`/api/v1/overlays/public/${publicId}`, { responseType: 'text' }),
  createOverlay: (data: any) => api.post('/api/v1/overlays', data),
  updateOverlay: (id: string, data: any) => api.put(`/api/v1/overlays/${id}`, data),
  deleteOverlay: (id: string) => api.delete(`/api/v1/overlays/${id}`),
};

export const userAPI = {
  getUsers: () => api.get('/api/v1/users'),
  updateUserRole: (id: string, role: string) => api.put(`/api/v1/users/${id}`, { role }),
  updateMembership: (membership: string) => api.put('/api/v1/users/membership', { membership }),
  getNotificationPreferences: () => api.get('/api/v1/users/notifications/preferences'),
  updateNotificationPreferences: (preferences: any) => api.put('/api/v1/users/notifications/preferences', preferences),
  getProfile: () => api.get('/api/v1/users/profile'),
  updateProfile: (data: { username: string; email: string; profilePicture?: string; bio?: string; fullName?: string; dob?: string }) => api.put('/api/v1/users/profile', data),
  searchUsers: (query: string) => api.get('/api/v1/users/search', { params: { query } }),
};

export const friendAPI = {
  sendFriendRequest: (toUserId: string) => api.post('/api/v1/friends/request', { toUserId }),
  acceptFriendRequest: (requestId: string) => api.put(`/api/v1/friends/request/${requestId}/accept`),
  rejectFriendRequest: (requestId: string) => api.delete(`/api/v1/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/api/v1/friends'),
  getFriendRequests: () => api.get('/api/v1/friends/requests'),
  removeFriend: (friendId: string) => api.delete(`/api/v1/friends/${friendId}`),
};

export const clubAPI = {
  getClubs: () => api.get('/api/v1/clubs'),
  getClub: (clubId: string) => api.get(`/api/v1/clubs/${clubId}`),
  createClub: (data: { name: string; description?: string }) => api.post('/api/v1/clubs', data),
  joinClub: (clubId: string) => api.post(`/api/v1/clubs/${clubId}/join`),
  leaveClub: (clubId: string) => api.post(`/api/v1/clubs/${clubId}/leave`),
  updateClub: (clubId: string, data: { name?: string; description?: string }) => api.put(`/api/v1/clubs/${clubId}`, data),
  deleteClub: (clubId: string) => api.delete(`/api/v1/clubs/${clubId}`),
  addMember: (clubId: string, userId: string) => api.post(`/api/v1/clubs/${clubId}/members`, { userId }),
  removeMember: (clubId: string, userId: string) => api.delete(`/api/v1/clubs/${clubId}/members/${userId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/api/v1/notifications'),
  markAsRead: (id: string) => api.put(`/api/v1/notifications/${id}/read`),
};

export const statsAPI = {
  getTournamentStats: () => api.get('/api/v1/tournaments/stats'),
  getUserStats: () => api.get('/api/v1/users/stats'),
};

export const messageAPI = {
  getConversations: () => api.get('/api/v1/messages/conversations'),
  getMessages: (userId: string) => api.get(`/api/v1/messages/${userId}`),
  sendMessage: (toUserId: string, content: string) => api.post('/api/v1/messages', { toUserId, content }),
  markAsRead: (conversationId: string) => api.put(`/api/v1/messages/${conversationId}/read`),
  deleteMessage: (messageId: string) => api.delete(`/api/v1/messages/${messageId}`),
};

export const leaderboardAPI = {
  getPlayerLeaderboard: (tournamentId?: string) => api.get('/api/v1/leaderboard/players', { params: { tournament: tournamentId } }),
  getTeamLeaderboard: (tournamentId?: string) => api.get('/api/v1/leaderboard/teams', { params: { tournament: tournamentId } }),
  getBattingLeaderboard: (tournamentId?: string) => api.get('/api/v1/leaderboard/batting', { params: { tournament: tournamentId } }),
  getBowlingLeaderboard: (tournamentId?: string) => api.get('/api/v1/leaderboard/bowling', { params: { tournament: tournamentId } }),
};

export const liveMatchAPI = {
  getLiveMatches: () => api.get('/api/v1/matches/live'),
  getLiveMatch: (matchId: string) => api.get(`/api/v1/matches/${matchId}/live`),
  goLive: (matchId: string, liveStreamUrl?: string) => api.post(`/api/v1/matches/${matchId}/go-live`, { liveStreamUrl }),
  endLive: (matchId: string) => api.post(`/api/v1/matches/${matchId}/end-live`),
  updateStreamUrl: (matchId: string, liveStreamUrl: string) => api.put(`/api/v1/matches/${matchId}/stream-url`, { liveStreamUrl }),
};

export default api;
