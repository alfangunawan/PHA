import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const breathingAPI = {
  getTechniques: () => api.get('/breathing/techniques'),
  getTechnique: (id) => api.get(`/breathing/techniques/${id}`),
  saveLog: (data) => api.post('/breathing/logs', data),
  getHistory: () => api.get('/breathing/logs'),
};

export const meditationAPI = {
  getSessions: (category) => api.get('/meditation/sessions', { params: category ? { category } : {} }),
  getSession: (id) => api.get(`/meditation/sessions/${id}`),
  saveLog: (data) => api.post('/meditation/logs', data),
  getHistory: () => api.get('/meditation/logs'),
};

export const educationAPI = {
  getContents: (params) => api.get('/education-contents', { params }),
  getContent: (id) => api.get(`/education-contents/${id}`),
  createContent: (data) => api.post('/education-contents', data),
  updateContent: (id, data) => api.put(`/education-contents/${id}`, data),
  deleteContent: (id) => api.delete(`/education-contents/${id}`),
};

export const audioAPI = {
  getAudios: () => api.get('/audio-contents'),
  createAudio: (formData) =>
    api.post('/audio-contents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAudio: (id) => api.delete(`/audio-contents/${id}`),
};
