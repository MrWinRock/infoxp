import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsers } from "../../services/userService";
import { getGameStats, getTopGames, getGamesWithoutImages, AdminGame } from "../../services/gameService";

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [usersTotal, setUsersTotal] = useState(0);
    const [adminsTotal, setAdminsTotal] = useState(0);
    const [gamesTotal, setGamesTotal] = useState(0);
    const [topGenres, setTopGenres] = useState<{ _id: string; count: number }[]>([]);
    const [topGames, setTopGames] = useState<AdminGame[]>([]);
    const [noImageGames, setNoImageGames] = useState<AdminGame[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const [users, stats, top, missing] = await Promise.all([
                    fetchUsers(),
                    getGameStats(),
                    getTopGames(5),
                    getGamesWithoutImages()
                ]);
                if (!alive) return;
                setUsersTotal(users.length);
                setAdminsTotal(users.filter(u => u.role === "admin").length);
                setGamesTotal(stats.total ?? 0);
                setTopGenres((stats.genreCounts ?? []).slice(0, 6));
                setTopGames(top);
                setNoImageGames((missing ?? []).slice(0, 5));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Failed to load dashboard";
                if (alive) setError(msg);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    if (loading) return <div className="p-4">Loading dashboard…</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Total Games" value={gamesTotal} />
                <KpiCard label="Total Users" value={usersTotal} />
                <KpiCard label="Admins" value={adminsTotal} />
                <KpiCard label="Games w/o Images" value={noImageGames.length} />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
                <Link to="/admin/games" className="px-4 py-2 rounded bg-blue-600 text-white">Manage Games</Link>
                <Link to="/admin/users" className="px-4 py-2 rounded bg-indigo-600 text-white">Manage Users</Link>
            </div>

            {/* Top genres */}
            <section className="space-y-2">
                <h2 className="text-xl font-semibold">Top Genres</h2>
                <div className="flex flex-wrap gap-2">
                    {topGenres.map(g => (
                        <span key={g._id} className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-sm">
                            {g._id} ({g.count})
                        </span>
                    ))}
                </div>
            </section>

            {/* Latest games */}
            <section className="space-y-2">
                <h2 className="text-xl font-semibold">Latest Games</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded border border-gray-200 dark:border-gray-700">
                    {topGames.map(g => (
                        <li key={g.id} className="p-3 flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{g.Name}</div>
                                <div className="text-xs opacity-70">AppID: {g.AppID}</div>
                            </div>
                            {g["Header image"] ? (
                                <img src={g["Header image"]} alt={g.Name} className="h-10 w-auto rounded" />
                            ) : (
                                <span className="text-xs opacity-60">No image</span>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Fix missing images */}
            <section className="space-y-2">
                <h2 className="text-xl font-semibold">Needs Images</h2>
                {noImageGames.length === 0 ? (
                    <div className="text-sm opacity-70">All games have header images.</div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded border border-gray-200 dark:border-gray-700">
                        {noImageGames.map(g => (
                            <li key={g.id} className="p-3 flex items-center justify-between">
                                <span className="truncate">{g.Name}</span>
                                <Link to="/admin/games" className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm">Set Image</Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

const KpiCard = ({ label, value }: { label: string; value: number }) => (
    <div className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171D25]">
        <div className="text-sm opacity-70">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

export default AdminDashboard;