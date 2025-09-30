import { apiClient } from './apiClient';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    date_of_birth?: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    date_of_birth?: string;
    role?: string;
}

export interface AuthResult {
    token?: string;
    user?: AuthUser;
    message?: string;
}

export const login = async (data: LoginPayload): Promise<AuthResult> => {
    const res = await apiClient.post<AuthResult>('/api/users/login', data);
    return res.data;
};

export const register = async (data: RegisterPayload): Promise<{ status: number; body: AuthResult }> => {
    const res = await apiClient.post<AuthResult>('/api/users/register', data);
    return { status: res.status, body: res.data };
};