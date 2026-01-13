import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_URL = rawApiUrl.replace(/\/api$/, '');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const rfpService = {
    analyze: (text: string) => api.post('/api/rfps/analyze', { text }),
    create: (data: any) => api.post('/api/rfps', data),
    get: (id: string) => api.get(`/api/rfps/${id}`),
    assignVendors: (id: string, vendorIds: string[]) => api.post(`/api/rfps/${id}/vendors`, { vendorIds }),
    sync: () => api.post('/api/rfps/sync', {}),
    recommend: (id: string) => api.post(`/api/rfps/${id}/recommend`, {}),
};

export const vendorService = {
    create: (name: string, email: string) => api.post('/api/vendors', { name, email }),
    getAll: () => api.get('/api/vendors'),
};

export default api;
