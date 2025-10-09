import 'axios';

declare module 'axios' {
    // Extend Axios request config with optional timing metadata.
    // Use unknown instead of any to satisfy linting, and omit unused generic parameter.
    interface InternalAxiosRequestConfig {
        // High-resolution timestamp (ms since epoch or performance.now value) marking request start
        metadata?: { start: number };
    }
}
