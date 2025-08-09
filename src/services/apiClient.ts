import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(cfg => {
    const t = localStorage.getItem('auth_token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

apiClient.interceptors.response.use(r => r, e => Promise.reject(e));