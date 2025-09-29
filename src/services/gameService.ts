import { apiClient } from './apiClient';

export interface Game {
    _id: string;
    title: string;
    steam_app_id: number;
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

export const fetchGameById = async (steamAppId: string): Promise<Game | null> => {
    const res = await apiClient.get<Game | null>(`/api/games/${steamAppId}`);
    return res.data;
}

export const insertGames = async (games: Game[]): Promise<Game[]> => {
    const res = await apiClient.post<Game[]>('/api/games/import/json', games);
    return res.data ?? [];
};