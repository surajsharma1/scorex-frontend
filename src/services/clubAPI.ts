import api from './api';

export const clubAPI = {
  getClubs: (params?: any) => api.get('/clubs', { params }),
  getMyClubs: (params?: any) => api.get('/clubs/my', { params }),
  getClub: (id: string) => api.get(`/clubs/${id}`),
  createClub: (data: any) => api.post('/clubs', data),
  joinClub: (clubId: string) => api.post(`/clubs/${clubId}/join`),
  deleteClub: (clubId: string) => api.delete(`/clubs/${clubId}`),
  approveJoinRequest: (clubId: string, userId: string) => api.post(`/clubs/${clubId}/approve-join/${userId}`),
  addViceLeader: (clubId: string, userId: string) => api.post(`/clubs/${clubId}/vice-leader/${userId}`),
  removeMember: (clubId: string, userId: string) => api.delete(`/clubs/${clubId}/members/${userId}`),
  uploadLogo: (clubId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post(`/clubs/${clubId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadBanner: (clubId: string, file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post(`/clubs/${clubId}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

