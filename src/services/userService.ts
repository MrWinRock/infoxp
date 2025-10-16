import { apiClient } from "./apiClient";

export interface User {
    _id: string;
    name: string;
    email: string;
    date_of_birth?: string;
    role?: string;
}

export const fetchUsers = async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/api/users');
    return res.data ?? [];
};

export const getUserById = async (id: string): Promise<User> => {
    const res = await apiClient.get<User>(`/api/users/${id}`);
    return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
};

export const promoteUserToAdmin = async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>(`/api/users/${id}/promote`);
    return res.data;
};

export const demoteAdminToUser = async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>(`/api/users/${id}/demote`);
    return res.data;
}