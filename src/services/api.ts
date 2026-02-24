import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scorex-backend.onrender.com/api/v1';

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
  getTournaments: (page: number = 1, limit: number = 10) => api.get('/tournaments', { params: { page, limit } }),
  getTournament: (id: string) => api.get(`/tournaments/${id}`),
  createTournament: (data: any) => api.post('/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  goLive: (id: string) => api.post(`/tournaments/${id}/live`),
  updateLiveScores: (id: string, scores: any) => api.put(`/tournaments/${id}/scores`, { scores }),
};

export const matchAPI = {
  getMatches: (tournamentId?: string) => api.get('/matches', { params: { tournament: tournamentId } }),
  getAllMatches: () => api.get('/matches'),
  createMatch: (data: any) => api.post('/matches', data),
  updateMatch: (id: string, data: any) => api.put(`/matches/${id}`, data),
  updateMatchScore: (id: string, data: any) => api.put(`/matches/${id}/score`, data),
  deleteMatch: (id: string) => api.delete(`/matches/${id}`),
};

export const teamAPI = {
  getTeams: (tournamentId?: string, page: number = 1, limit: number = 10) => api.get('/teams', { params: { tournament: tournamentId, page, limit } }),
  createTeam: (data: FormData) => api.post('/teams', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTeam: (id: string, data: FormData) => api.put(`/teams/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, data: FormData) => api.post(`/teams/${teamId}/players`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addPlayerByUsername: (teamId: string, userId: string) => api.post(`/teams/${teamId}/players`, { userId }),
};

export const bracketAPI = {
  getBrackets: () => api.get('/brackets'),
  createBracket: (data: any) => api.post('/brackets', data),
  updateBracket: (id: string, data: any) => api.put(`/brackets/${id}`, data),
  generateBracket: (id: string, data: any) => api.post(`/brackets/${id}/generate`, data),
};

export const overlayAPI = {
  getOverlays: () => api.get('/overlays'),
  getOverlay: (id: string) => api.get(`/overlays/${id}`),
  getOverlayPublic: (publicId: string) => api.get(`/overlays/public/${publicId}`, { responseType: 'text' }),
  createOverlay: (data: any) => api.post('/overlays', data),
  updateOverlay: (id: string, data: any) => api.put(`/overlays/${id}`, data),
  deleteOverlay: (id: string) => api.delete(`/overlays/${id}`),
  getOverlayTemplates: () => api.get('/overlays/templates'),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  updateUserRole: (id: string, role: string) => api.put(`/users/${id}`, { role }),
  updateMembership: (membership: string) => api.put('/users/membership', { membership }),
  getNotificationPreferences: () => api.get('/users/notifications/preferences'),
  updateNotificationPreferences: (preferences: any) => api.put('/users/notifications/preferences', preferences),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { username: string; email: string; profilePicture?: string; bio?: string; fullName?: string; dob?: string }) => api.put('/users/profile', data),
  searchUsers: (query: string) => api.get('/users/search', { params: { query } }),
};

export const friendAPI = {
  sendFriendRequest: (toUserId: string) => api.post('/friends/request', { toUserId }),
  acceptFriendRequest: (requestId: string) => api.put(`/friends/request/${requestId}/accept`),
  rejectFriendRequest: (requestId: string) => api.delete(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
  getFriendRequests: () => api.get('/friends/requests'),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

export const clubAPI = {
  getClubs: () => api.get('/clubs'),
  getClub: (clubId: string) => api.get(`/clubs/${clubId}`),
  createClub: (data: { name: string; description?: string }) => api.post('/clubs', data),
  joinClub: (clubId: string) => api.post(`/clubs/${clubId}/join`),
  leaveClub: (clubId: string) => api.post(`/clubs/${clubId}/leave`),
  updateClub: (clubId: string, data: { name?: string; description?: string }) => api.put(`/clubs/${clubId}`, data),
  deleteClub: (clubId: string) => api.delete(`/clubs/${clubId}`),
  addMember: (clubId: string, userId: string) => api.post(`/clubs/${clubId}/members`, { userId }),
  removeMember: (clubId: string, userId: string) => api.delete(`/clubs/${clubId}/members/${userId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const statsAPI = {
  getTournamentStats: () => api.get('/tournaments/stats'),
  getUserStats: () => api.get('/users/stats'),
};

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: string) => api.get(`/messages/${userId}`),
  sendMessage: (toUserId: string, content: string) => api.post('/messages', { toUserId, content }),
  markAsRead: (conversationId: string) => api.put(`/messages/${conversationId}/read`),
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
};

export const leaderboardAPI = {
  getPlayerLeaderboard: (tournamentId?: string) => api.get('/leaderboard/players', { params: { tournament: tournamentId } }),
  getTeamLeaderboard: (tournamentId?: string) => api.get('/leaderboard/teams', { params: { tournament: tournamentId } }),
  getBattingLeaderboard: (tournamentId?: string) => api.get('/leaderboard/batting', { params: { tournament: tournamentId } }),
  getBowlingLeaderboard: (tournamentId?: string) => api.get('/leaderboard/bowling', { params: { tournament: tournamentId } }),
};

export const liveMatchAPI = {
  getLiveMatches: () => api.get('/matches/live'),
  getLiveMatch: (matchId: string) => api.get(`/matches/${matchId}/live`),
  goLive: (matchId: string, liveStreamUrl?: string) => api.post(`/matches/${matchId}/go-live`, { liveStreamUrl }),
  endLive: (matchId: string) => api.post(`/matches/${matchId}/end-live`),
  updateStreamUrl: (matchId: string, liveStreamUrl: string) => api.put(`/matches/${matchId}/stream-url`, { liveStreamUrl }),
};

export default api;
