import { useEffect, useState } from "react";
import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";
import { fetchGames, Game } from "../../services/gameService";

const toImageSrc = (imageUrl?: string) =>
    imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `/images/${imageUrl}` : '/images/default.jpg';

const toArray = (v?: string | string[] | null): string[] =>
    Array.isArray(v) ? v : v ? [v] : [];

const Games = () => {
    const [games, setGames] = useState<Game[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // search state + debounce
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedQuery(query.trim().toLowerCase());
        }, 200);
        return () => window.clearTimeout(t);
    }, [query]);

    useEffect(() => {
        let mounted = true;
        fetchGames()
            .then(data => mounted && setGames(data))
            .catch(err => {
                console.error(err);
                if (mounted) setError('Failed to load games');
            });
        return () => {
            mounted = false;
        };
    }, []);

    if (error) {
        return <div className="w-full max-w-6xl mx-auto mt-6 text-red-500">{error}</div>;
    }
    if (!games) {
        return <div className="w-full max-w-6xl mx-auto mt-6">Loading...</div>;
    }

    // filter by search
    const filteredGames = games.filter((g) => {
        if (debouncedQuery) {
            const haystack = [
                g.title ?? '',
                ...toArray(g.genre),
                g.publisher ?? ''
            ].join(' ').toLowerCase();
            if (!haystack.includes(debouncedQuery)) return false;
        }
        return true;
    });

    const gameItems: React.ReactNode[] = filteredGames.map((game) => {
        return (
            <ItemBox
                key={game._id}
                image={toImageSrc(game.image_url)}
                alt={game.title ?? ''}
                _id={game._id}
            >
                {game.title}
            </ItemBox>
        );
    });

    return (
        <div className="games w-full max-w-6xl mx-auto mt-6">
            {/* search input + result count */}
            <div className="mb-4 flex items-center gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search games…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#171D25] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredGames.length} / {games.length}
                </span>
            </div>

            <GridContainer title="Games" name={gameItems} />

            {filteredGames.length === 0 && (
                <div className="mt-6 text-gray-600 dark:text-gray-400">
                    No games match your search.
                </div>
            )}
        </div>
    );
};

export default Games;