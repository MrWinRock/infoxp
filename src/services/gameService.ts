import { apiClient } from './apiClient';
import { isAxiosError } from 'axios';

/**
 * Raw record shape as returned by the backend (Steam-like field names).
 */
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

/**
 * Server response shape for paginated game queries.
 */
export interface PaginatedSteamGamesResponse {
    games: SteamGameRecord[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

/**
 * UI-facing Game shape used by Home/Games/Genre pages.
 * Maps Steam fields to UI-friendly names.
 */
export type Game = {
    _id: string;
    title: string;
    image_url?: string;
    genre?: string[];
    developer?: string[];
    publisher?: string;
    releaseDate?: string;
    description?: string;
    appId?: number;
    steam_app_id?: number;
    technologies?: string[];
};

/**
 * Admin-facing shape, keeps original Steam fields plus a stable id.
 */
export type AdminGame = SteamGameRecord & { id: string };

/**
 * Transform a raw SteamGameRecord into an AdminGame (keeps Steam field names, adds id).
 */
const toAdminGame = (r: SteamGameRecord): AdminGame => ({
    ...r,
    id: r._id ?? String(r.AppID ?? '')
});

/**
 * Transform a raw SteamGameRecord into a UI Game (renames and formats fields).
 */
const toUiGame = (r: SteamGameRecord): Game => {
    const publisher =
        Array.isArray(r.Publishers) ? r.Publishers.join(', ') :
            typeof r.Publishers === 'string' ? r.Publishers :
                undefined;

    const releaseDate =
        typeof r['Release date'] === 'number'
            ? new Date(r['Release date']).toLocaleDateString()
            : undefined;

    return {
        _id: r._id ?? String(r.AppID ?? ''),
        title: r.Name,
        image_url: r['Header image'],
        genre: r.Genres,
        developer: r.Developers,
        publisher,
        releaseDate,
        description: r['About the game'],
        appId: r.AppID,
        steam_app_id: r.AppID,
        technologies: []
    };
};

/**
 * Fetch all games for UI pages.
 * Accepts optional pagination params and normalizes both array and paginated responses.
 * Returns UI-shaped Game[].
 */
export const fetchGames = async (params?: { page?: number; limit?: number }): Promise<Game[]> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 1000;
    const res = await apiClient.get('/api/games', { params: { page, limit } });
    const data = res.data as PaginatedSteamGamesResponse | SteamGameRecord[];
    const list: SteamGameRecord[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.games)
            ? data.games
            : [];
    return list.map(toUiGame);
};

/**
 * Fetch top games for UI (used on Home).
 * Returns UI-shaped Game[].
 */
export const fetchTopGames = async (limit = 10): Promise<Game[]> => {
    const res = await apiClient.get<SteamGameRecord[]>('/api/games/top', { params: { limit } });
    return (res.data ?? []).map(toUiGame);
};

/**
 * Fetch a single game by id (UI shape).
 * Returns null if not found (404).
 */
export const fetchGameById = async (id: string): Promise<Game | null> => {
    try {
        const res = await apiClient.get<SteamGameRecord>(`/api/games/${id}`);
        return res.data ? toUiGame(res.data) : null;
    } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
    }
};

/**
 * Import multiple SteamGameRecord items (admin bulk import).
 * Returns an import result summary.
 */
export interface ImportResult {
    success: number;
    errors: Array<{ game: string; error: string }>;
    duplicates: number;
    savedIds: string[];
}

/**
 * Send a bulk import payload to the server.
 */
export const insertGames = async (games: SteamGameRecord[]): Promise<ImportResult> => {
    const res = await apiClient.post<ImportResult>('/api/games/import/json', games);
    return res.data;
};

/**
 * Admin: fetch games with pagination.
 * Returns AdminGame[] plus pagination info for tables.
 */
export const getGames = async (page = 1, limit = 20): Promise<{ games: AdminGame[]; pagination: PaginatedSteamGamesResponse["pagination"] }> => {
    const res = await apiClient.get<PaginatedSteamGamesResponse>('/api/games', { params: { page, limit } });
    return {
        games: (res.data?.games ?? []).map(toAdminGame),
        pagination: res.data?.pagination ?? { page, limit, total: 0, pages: 1 }
    };
};

/**
 * Admin: create a new game entry.
 * Accepts partial Steam fields and returns the created AdminGame.
 */
export const createGame = async (payload: Partial<SteamGameRecord>): Promise<AdminGame> => {
    const res = await apiClient.post<SteamGameRecord>('/api/games', payload);
    return toAdminGame(res.data);
};

/**
 * Admin: update a game by id with partial fields.
 * Returns the updated AdminGame.
 */
export const updateGame = async (id: string, payload: Partial<SteamGameRecord>): Promise<AdminGame> => {
    const res = await apiClient.put<SteamGameRecord>(`/api/games/${id}`, payload);
    return toAdminGame(res.data);
};

/**
 * Admin: delete a game by id.
 */
export const deleteGame = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/games/${id}`);
};

/**
 * Admin: fetch top games for dashboard lists (AdminGame shape).
 */
export const getTopGames = async (limit = 10): Promise<AdminGame[]> => {
    const res = await apiClient.get<SteamGameRecord[]>('/api/games/top', { params: { limit } });
    return (res.data ?? []).map(toAdminGame);
};

/**
 * Admin: fetch games that are missing header images (AdminGame shape).
 * Endpoint may differ on backend; adjust if needed.
 */
export const getGamesWithoutImages = async (limit = 100): Promise<AdminGame[]> => {
    const res = await apiClient.get('/api/games/without-images', { params: { limit } });
    const data = res.data as SteamGameRecord[] | { games?: SteamGameRecord[] };
    const list: SteamGameRecord[] = Array.isArray(data) ? data : Array.isArray(data?.games) ? data.games! : [];
    return list.map(toAdminGame);
};

/**
 * Admin: get aggregate stats for dashboard (total count, genre counts).
 */
export const getGameStats = async (): Promise<{ total?: number; genreCounts?: { _id: string; count: number }[] }> => {
    const res = await apiClient.get<{ total?: number; genreCounts?: { _id: string; count: number }[] }>('/api/games/stats');
    return res.data ?? { total: 0, genreCounts: [] };
};

/**
 * UI convenience: alias for fetching a limited set of games for Home.
 */
export const getHomeGames = (limit = 12) => fetchTopGames(limit);