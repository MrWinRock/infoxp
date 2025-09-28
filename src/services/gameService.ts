import { apiClient } from './apiClient';

export interface Game {
    title: string;
    steamAppId: number;
    genre: string[];
    developer: string;
    publisher: string;
    technologies: string;
    releaseDate: string;
    description: string;
    image_url: string;
}

export const fetchGames = async (): Promise<Game[]> => {
    const res = await apiClient.get<Game[]>('/api/games');
    return res.data ?? [];
};

export const insertGames = async (games: Game[]): Promise<Game[]> => {
    const res = await apiClient.post<Game[]>('/api/games/import/json', games);
    return res.data ?? [];
};