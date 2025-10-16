import { useEffect, useMemo, useState } from "react";
import { createGame, deleteGame, getGames, AdminGame, updateGame } from "../../services/gameService";

type NewGameForm = {
    AppID: string;
    Name: string;
    releaseDate: string;
    requiredAge: string;
    about: string;
    headerImage: string;
    windows: boolean;
    mac: boolean;
    linux: boolean;
    developers: string;
    publishers: string;
    categories: string;
    genres: string;
};

const emptyNewGame: NewGameForm = {
    AppID: "",
    Name: "",
    releaseDate: "",
    requiredAge: "",
    about: "",
    headerImage: "",
    windows: true,
    mac: false,
    linux: false,
    developers: "",
    publishers: "",
    categories: "",
    genres: ""
};

const GameManagement = () => {
    const [games, setGames] = useState<AdminGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    // create form
    const [newGame, setNewGame] = useState<NewGameForm>(emptyNewGame);
    const [creating, setCreating] = useState(false);

    // edit inline
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPublishers, setEditPublishers] = useState("");
    const [editHeaderImage, setEditHeaderImage] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const canCreate = useMemo(() => !!newGame.AppID && !!newGame.Name, [newGame.AppID, newGame.Name]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const { games, pagination } = await getGames(page, limit);
                if (!alive) return;
                setGames(games);
                setTotalPages(pagination.pages || 1);
                setError(null);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Failed to load games";
                if (alive) setError(message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [page, limit]);

    const parseList = (value: string): string[] =>
        value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreate) return;

        try {
            setCreating(true);
            const payload = {
                AppID: Number(newGame.AppID),
                Name: newGame.Name,
                "Release date": newGame.releaseDate ? new Date(newGame.releaseDate).getTime() : undefined,
                "Required age": newGame.requiredAge ? Number(newGame.requiredAge) : undefined,
                "About the game": newGame.about || undefined,
                "Header image": newGame.headerImage || undefined,
                Windows: newGame.windows,
                Mac: newGame.mac,
                Linux: newGame.linux,
                Developers: parseList(newGame.developers),
                // If publishers has commas, send array; else send string
                Publishers: (() => {
                    const list = parseList(newGame.publishers);
                    if (list.length === 0) return undefined;
                    if (list.length === 1) return list[0];
                    return list;
                })(),
                Categories: parseList(newGame.categories),
                Genres: parseList(newGame.genres)
            } as const;

            const created = await createGame(payload);
            setGames(prev => [created, ...prev]);
            setNewGame(emptyNewGame);
            alert("Game created");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to create game";
            alert(msg);
        } finally {
            setCreating(false);
        }
    };

    const startEdit = (g: AdminGame) => {
        setEditId(g.id);
        setEditName(g.Name);
        const pubs = Array.isArray(g.Publishers) ? g.Publishers.join(", ") : (g.Publishers ?? "");
        setEditPublishers(pubs as string);
        setEditHeaderImage(g["Header image"] ?? "");
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditName("");
        setEditPublishers("");
        setEditHeaderImage("");
    };

    const onSave = async (id: string) => {
        try {
            setSavingId(id);
            const pubsList = parseList(editPublishers);
            const payload = {
                Name: editName,
                Publishers: pubsList.length <= 1 ? pubsList[0] ?? "" : pubsList,
                "Header image": editHeaderImage
            };
            const updated = await updateGame(id, payload);
            setGames(prev => prev.map(g => (g.id === id ? updated : g)));
            cancelEdit();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to update game";
            alert(msg);
        } finally {
            setSavingId(null);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm("Delete this game? This cannot be undone.")) return;
        try {
            setDeletingId(id);
            await deleteGame(id);
            setGames(prev => prev.filter(g => g.id !== id));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to delete game";
            alert(msg);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div className="p-4">Loading games…</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Game Management</h1>

            {/* Create new game */}
            <form onSubmit={onCreate} className="grid gap-3 p-4 rounded border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Add New Game</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm">AppID*</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" type="number" value={newGame.AppID} onChange={e => setNewGame(s => ({ ...s, AppID: e.target.value }))} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm">Name*</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.Name} onChange={e => setNewGame(s => ({ ...s, Name: e.target.value }))} required />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm">Release date</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" type="date" value={newGame.releaseDate} onChange={e => setNewGame(s => ({ ...s, releaseDate: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm">Required age</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" type="number" value={newGame.requiredAge} onChange={e => setNewGame(s => ({ ...s, requiredAge: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">Header image (URL)</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.headerImage} onChange={e => setNewGame(s => ({ ...s, headerImage: e.target.value }))} />
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newGame.windows} onChange={e => setNewGame(s => ({ ...s, windows: e.target.checked }))} />
                        <span>Windows</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newGame.mac} onChange={e => setNewGame(s => ({ ...s, mac: e.target.checked }))} />
                        <span>Mac</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newGame.linux} onChange={e => setNewGame(s => ({ ...s, linux: e.target.checked }))} />
                        <span>Linux</span>
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">Developers (comma-separated)</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.developers} onChange={e => setNewGame(s => ({ ...s, developers: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">Publishers (comma-separated for multiple)</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.publishers} onChange={e => setNewGame(s => ({ ...s, publishers: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">Categories (comma-separated)</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.categories} onChange={e => setNewGame(s => ({ ...s, categories: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">Genres (comma-separated)</span>
                        <input className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" value={newGame.genres} onChange={e => setNewGame(s => ({ ...s, genres: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm">About the game</span>
                        <textarea className="px-3 py-2 rounded border bg-white dark:bg-[#0B0F14]" rows={3} value={newGame.about} onChange={e => setNewGame(s => ({ ...s, about: e.target.value }))} />
                    </label>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                        disabled={!canCreate || creating}
                    >
                        {creating ? "Creating…" : "Create game"}
                    </button>
                </div>
            </form>

            {/* List + inline edit */}
            <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">AppID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Publishers</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Genres</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {games.map(g => {
                            const isEditing = editId === g.id;
                            const publishersText = Array.isArray(g.Publishers) ? g.Publishers.join(", ") : (g.Publishers ?? "");
                            const genresText = (g.Genres ?? []).join(", ");

                            return (
                                <tr key={g.id} className="bg-white dark:bg-[#171D25]">
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input className="px-2 py-1 rounded border bg-white dark:bg-[#0B0F14]" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" title="Name" aria-label="Name" />
                                        ) : (
                                            g.Name
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{g.AppID}</td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input className="px-2 py-1 rounded border bg-white dark:bg-[#0B0F14]" value={editPublishers} onChange={e => setEditPublishers(e.target.value)} placeholder="Publishers" title="Publishers" aria-label="Publishers" />
                                        ) : (
                                            publishersText as string
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{genresText}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 justify-end">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        className="px-3 py-1.5 rounded bg-green-600 text-white text-sm disabled:opacity-50"
                                                        onClick={() => onSave(g.id)}
                                                        disabled={savingId === g.id}
                                                    >
                                                        {savingId === g.id ? "Saving…" : "Save"}
                                                    </button>
                                                    <button
                                                        className="px-3 py-1.5 rounded bg-gray-600 text-white text-sm"
                                                        onClick={cancelEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm"
                                                        onClick={() => startEdit(g)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm"
                                                        onClick={() => {
                                                            // quick header image tweak inline
                                                            setEditId(g.id);
                                                            setEditName(g.Name);
                                                            const pubs = Array.isArray(g.Publishers) ? g.Publishers.join(", ") : (g.Publishers ?? "");
                                                            setEditPublishers(pubs as string);
                                                            setEditHeaderImage(g["Header image"] ?? "");
                                                        }}
                                                        title="Edit header image"
                                                    >
                                                        Edit Img
                                                    </button>
                                                    <button
                                                        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm disabled:opacity-50"
                                                        onClick={() => onDelete(g.id)}
                                                        disabled={deletingId === g.id}
                                                    >
                                                        {deletingId === g.id ? "Deleting…" : "Delete"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <div className="mt-3 grid gap-2">
                                                <label className="flex flex-col gap-1">
                                                    <span className="text-xs opacity-75">Header image URL</span>
                                                    <input className="px-2 py-1 rounded border bg-white dark:bg-[#0B0F14]" value={editHeaderImage} onChange={e => setEditHeaderImage(e.target.value)} />
                                                </label>
                                                {editHeaderImage ? (
                                                    <img src={editHeaderImage} alt="Header preview" className="h-20 w-auto rounded border" />
                                                ) : null}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <button
                    className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                >
                    Prev
                </button>
                <div className="text-sm">
                    Page {page} / {totalPages}
                </div>
                <button
                    className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default GameManagement;