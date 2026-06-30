import client from './client';

export const breathingAPI = {
    getTechniques: () => client.get('/api/breathing/techniques').then(r => r.data),
    getTechniqueById: (id: string) => client.get(`/api/breathing/techniques/${id}`).then(r => r.data),
    createTechnique: (data: object) => client.post('/api/breathing/techniques', data).then(r => r.data),
    updateTechnique: (id: string, data: object) => client.put(`/api/breathing/techniques/${id}`, data).then(r => r.data),
    deleteTechnique: (id: string) => client.delete(`/api/breathing/techniques/${id}`).then(r => r.data),
    saveLog: (data: { techniqueId: string; duration: number; cyclesCompleted?: number }) =>
        client.post('/api/breathing/logs', data).then(r => r.data),
    getLogs: () => client.get('/api/breathing/logs').then(r => r.data),
};

export const meditationAPI = {
    getSessions: (category?: string) =>
        client.get('/api/meditation/sessions', { params: category ? { category } : undefined }).then(r => r.data),
    getSessionById: (id: string) => client.get(`/api/meditation/sessions/${id}`).then(r => r.data),
    createSession: (data: object) => client.post('/api/meditation/sessions', data).then(r => r.data),
    updateSession: (id: string, data: object) => client.put(`/api/meditation/sessions/${id}`, data).then(r => r.data),
    deleteSession: (id: string) => client.delete(`/api/meditation/sessions/${id}`).then(r => r.data),
    saveLog: (data: { sessionId: string; duration: number; completed?: boolean }) =>
        client.post('/api/meditation/logs', data).then(r => r.data),
    getLogs: () => client.get('/api/meditation/logs').then(r => r.data),
};

export const educationAPI = {
    getContents: (params?: { page?: number; limit?: number; category?: string; source?: string; format?: string }) =>
        client.get('/api/education-contents', { params }).then(r => r.data),
    getContentById: (id: string) => client.get(`/api/education-contents/${id}`).then(r => r.data),
    createContent: (data: object) => client.post('/api/education-contents', data).then(r => r.data),
    updateContent: (id: string, data: object) => client.put(`/api/education-contents/${id}`, data).then(r => r.data),
    deleteContent: (id: string) => client.delete(`/api/education-contents/${id}`).then(r => r.data),
    completeContent: (id: string) => client.post(`/api/education-contents/${id}/complete`).then(r => r.data),
    saveLog: (data: { contentId: string; completed: boolean }) =>
        client.post('/api/education-contents/logs', data).then(r => r.data),
    getLogs: () => client.get('/api/education-contents/logs').then(r => r.data),
};

export const audioAPI = {
    getAudios: () => client.get('/api/audio-contents').then(r => r.data),
    getAvailableAudios: () => client.get('/api/audio-contents/available').then(r => r.data),
    getAudioById: (id: string) => client.get(`/api/audio-contents/${id}`).then(r => r.data),
    uploadAudio: (formData: FormData) =>
        client.post('/api/audio-contents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    deleteAudio: (id: string) => client.delete(`/api/audio-contents/${id}`).then(r => r.data),
    saveLog: (data: { audioId: string; duration: number; completed: boolean }) =>
        client.post('/api/audio-contents/logs', data).then(r => r.data),
    getLogs: () => client.get('/api/audio-contents/logs').then(r => r.data),
};

export const journalAPI = {
    getEntries: () => client.get('/api/journals').then(r => r.data),
    getEntryById: (id: string) => client.get(`/api/journals/${id}`).then(r => r.data),
    createEntry: (data: { title?: string; content: string }) => client.post('/api/journals', data).then(r => r.data),
    updateEntry: (id: string, data: { title?: string; content: string }) => client.put(`/api/journals/${id}`, data).then(r => r.data),
    deleteEntry: (id: string) => client.delete(`/api/journals/${id}`).then(r => r.data),
};

export const gamificationAPI = {
    getMe: () => client.get('/api/gamification/me').then(r => r.data),
    getRules: () => client.get('/api/gamification/rules').then(r => r.data),
    updateRule: (activityType: string, data: { xp: number; points: number; isActive: boolean }) =>
        client.put(`/api/gamification/rules/${activityType}`, data).then(r => r.data),
};

export const gamesAPI = {
    startWordPuzzle: (data?: { maxWords?: number }) => client.post('/api/games/word-puzzle/start', data || {}).then(r => r.data),
    completeWordPuzzle: (sessionId: string, data: { answers: Array<{ id: string; answer: string }>; durationSec: number }) =>
        client.post(`/api/games/word-puzzle/${sessionId}/complete`, data).then(r => r.data),
    startTetris: () => client.post('/api/games/tetris/start').then(r => r.data),
    completeTetris: (sessionId: string, data: { score: number; lines: number; level: number; durationSec: number }) =>
        client.post(`/api/games/tetris/${sessionId}/complete`, data).then(r => r.data),
};

export const mindfulnessAPI = {
    getRecommendations: () => client.get('/api/mindfulness/recommendations').then(r => r.data),
    getDashboard: () => client.get('/api/mindfulness/dashboard').then(r => r.data),
};
