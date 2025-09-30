import { apiClient } from "./apiClient";

export interface User {
    id: string;
    name: string;
    email: string;
    date_of_birth?: string;
    role?: string;
}

export const fetchUsers = async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/api/users');
    return res.data ?? [];
};