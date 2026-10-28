import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
    baseURL,
});

api.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;
    if (userInfo && userInfo.token) {
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${userInfo.token}`);
        } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
    }
    return config;
});

export default api;
