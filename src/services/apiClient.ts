import axios, {
    InternalAxiosRequestConfig,
    AxiosResponse
} from 'axios';
import { API_BASE_URL } from '../config/api';
import { logEvent } from './logEvent';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
        const t = localStorage.getItem('auth_token');
        if (t) cfg.headers.Authorization = `Bearer ${t}`;

        cfg.metadata = { start: performance.now() };

        const method = (cfg.method || 'get').toUpperCase();
        const url = `${cfg.baseURL || ''}${cfg.url || ''}`;
        logEvent(`HTTP ${method} ${url}`);
        return cfg;
    },
    err => {
        logEvent(`HTTP REQUEST ERROR: ${String(err)}`);
        return Promise.reject(err);
    }
);

apiClient.interceptors.response.use(
    (res: AxiosResponse) => {
        const start = res.config.metadata?.start;
        const ms = typeof start === 'number' ? Math.round(performance.now() - start) : undefined;
        const method = (res.config.method || 'get').toUpperCase();
        const url = `${res.config.baseURL || ''}${res.config.url || ''}`;
        logEvent(`HTTP ${res.status} ${method} ${url}${ms !== undefined ? ` ${ms}ms` : ''}`);
        return res;
    },
    err => {
        const cfg: InternalAxiosRequestConfig | undefined = err.config;
        const method = cfg?.method?.toUpperCase?.() || 'GET';
        const url = `${cfg?.baseURL || ''}${cfg?.url || ''}`;
        const status = err.response?.status ?? 'ERR';
        logEvent(`HTTP ${status} ${method} ${url}`);
        return Promise.reject(err);
    }
);
