import { useParams, useNavigate } from 'react-router-dom';
import games from '../../data/games';
import { useEffect } from 'react';
import GridContainer from '../item/GridContainer';
import ItemBox from '../item/ItemBox';

const GenrePage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();

    const genreName = name ? decodeURIComponent(name) : '';

    const gamesInGenre = games.filter(game =>
        game.genre.some(g => g.toLowerCase() === genreName.toLowerCase())
    );

    useEffect(() => {
        if (!genreName || gamesInGenre.length === 0) {
            navigate('/genre', { replace: true });
        }
    }, [genreName, gamesInGenre.length, navigate]);

    if (!genreName || gamesInGenre.length === 0) return null;

    const gameItems: React.ReactNode[] = gamesInGenre.map((game) => (
        <ItemBox
            key={game.steamAppId}
            image={`/images/${game.imageUrl}`}
            alt={game.title}
            steamAppId={game.steamAppId}
        >
            {game.title}
        </ItemBox>
    ));

    return (
        <div className="genre-page w-full max-w-6xl mx-auto mt-6">
            {/* Back button */}
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

            {/* Use GridContainer for consistency */}
            <GridContainer
                title={`${genreName} (${gamesInGenre.length} game${gamesInGenre.length !== 1 ? 's' : ''})`}
                name={gameItems}
            />
        </div>
    );
};

export default GenrePage;