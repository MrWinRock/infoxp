import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import GridContainer from '../item/GridContainer';
import ItemBox from '../item/ItemBox';
import { fetchGames, Game } from '../../services/gameService';

const toImageSrc = (imageUrl?: string) =>
    imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `/images/${imageUrl}` : '/images/default.jpg';

const GenrePage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [games, setGames] = useState<Game[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const genreName = name ? decodeURIComponent(name) : '';

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

    const gamesInGenre = useMemo(
        () =>
            (games || []).filter(game =>
                (game.genre || []).some(g => g.toLowerCase() === genreName.toLowerCase())
            ),
        [games, genreName]
    );

    useEffect(() => {
        if (games && (!genreName || gamesInGenre.length === 0)) {
            navigate('/genre', { replace: true });
        }
    }, [games, genreName, gamesInGenre.length, navigate]);

    if (error) return <div className="w-full max-w-6xl mx-auto mt-6 text-red-500">{error}</div>;
    if (!games) return <div className="w-full max-w-6xl mx-auto mt-6">Loading...</div>;
    if (!genreName || gamesInGenre.length === 0) return null;

    const gameItems: React.ReactNode[] = gamesInGenre.map((game) => (
        <ItemBox
            key={game.steamAppId}
            image={toImageSrc(game.imageUrl)}
            alt={game.title}
            steamAppId={game.steamAppId}
        >
            {game.title}
        </ItemBox>
    ));

    return (
        <div className="genre-page w-full max-w-6xl mx-auto mt-6">
            <div className="mb-6">
                <button
                    onClick={() => {
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            navigate('/games');
                        }
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                    ← Back to Genres
                </button>
            </div>

            <GridContainer
                title={`${genreName} (${gamesInGenre.length} game${gamesInGenre.length !== 1 ? 's' : ''})`}
                name={gameItems}
            />
        </div>
    );
};

export default GenrePage;