import { apiClient } from './apiClient';
import { isAxiosError } from 'axios';

export interface SteamGameRecord {
    _id?: string;
    AppID: number;
    Name: string;
    'Release date'?: number;
    'Required age'?: number;
    'About the game'?: string;
    'Header image'?: string;
    Windows?: boolean;
    Mac?: boolean;
    Linux?: boolean;
    Developers?: string[];
    Publishers?: string | string[];
    Categories?: string[];
    Genres?: string[];
}

export interface Game {
    _id?: string;
    title: string;
    appId?: number;
    genre?: string[];
    developer?: string[];
    publisher?: string;
    technologies?: string[];
    releaseDate?: string;
    requiredAge?: number;
    description?: string;
    image_url?: string;
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
    categories?: string[];
}

export interface PaginatedSteamGamesResponse {
    games: SteamGameRecord[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const transformSteamToGame = (steam: SteamGameRecord): Game => ({
    _id: steam._id,
    title: steam.Name,
    appId: steam.AppID,
    genre: steam.Genres ?? [],
    developer: steam.Developers ?? [],
    publisher: Array.isArray(steam.Publishers) ? steam.Publishers.join(', ') : steam.Publishers,
    technologies: [],
    releaseDate: steam['Release date'] ? new Date(steam['Release date']).toLocaleDateString() : undefined,
    requiredAge: steam['Required age'],
    description: steam['About the game'],
    image_url: steam['Header image'],
    windows: steam.Windows,
    mac: steam.Mac,
    linux: steam.Linux,
    categories: steam.Categories ?? [],
});

export const fetchGames = async (params?: { page?: number; limit?: number }): Promise<Game[]> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 1000;
    const res = await apiClient.get<PaginatedSteamGamesResponse>('/api/games', {
        params: { page, limit }
    });
    return (res.data?.games ?? []).map(transformSteamToGame);
};

export const fetchTopGames = async (limit = 10): Promise<Game[]> => {
    const res = await apiClient.get<SteamGameRecord[]>('/api/games/top', { params: { limit } });
    return (res.data ?? []).map(transformSteamToGame);
};

export const fetchGameById = async (id: string): Promise<Game | null> => {
    try {
        const res = await apiClient.get<SteamGameRecord>(`/api/games/${id}`);
        return res.data ? transformSteamToGame(res.data) : null;
    } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
    }
};

export interface ImportResult {
    success: number;
    errors: Array<{ game: string; error: string }>;
    duplicates: number;
    savedIds: string[];
}

export const insertGames = async (games: SteamGameRecord[]): Promise<ImportResult> => {
    const res = await apiClient.post<ImportResult>('/api/games/import/json', games);
    return res.data;
};