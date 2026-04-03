import api from './api';

export const friendAPI = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests'),
  sendRequest: (userId: string) => api.post(`/friends/request/${userId}`),
  acceptRequest: (id: string) => api.post(`/friends/accept/${id}`),
  rejectRequest: (id: string) => api.post(`/friends/reject/${id}`),
  removeFriend: (id: string) => api.delete(`/friends/${id}`)
};

