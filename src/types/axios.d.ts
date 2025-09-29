import 'axios';

declare module 'axios' {
    interface InternalAxiosRequestConfig<D = any> {
        metadata?: { start: number };
    }
}
