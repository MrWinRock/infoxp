import 'axios';

declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: { start: number };
    }
}
