import { useParams, useNavigate } from 'react-router-dom';
import games from '../../data/games';
import { useEffect } from 'react';

const GamesPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const game = games.find(g => g.steamAppId.toString() === id);

    useEffect(() => {
        if (!game) {
            navigate('/games', { replace: true });
        }
    }, [game, navigate]);

    if (!game) return null;

    return (
        <div className="games-page w-full max-w-4xl mx-auto mt-6 bg-white dark:bg-[#171D25] rounded-lg shadow-lg overflow-hidden">
            {/* Header with game image */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={`/images/${game.imageUrl}`}
                    alt={game.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                    <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
                    <p className="text-lg opacity-90">{game.developer}</p>
                </div>
            </div>

            {/* Game details */}
            <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column - Main info */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Description</h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {game.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Genres</h3>
                            <div className="flex flex-wrap gap-2">
                                {game.genre.map((g, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                                    >
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column - Game details */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Game Information</h3>
                            <div className="space-y-2 text-md">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Release Date:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{game.releaseDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Developer:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{game.developer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Publisher:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{game.publisher}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Steam App ID:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{game.steamAppId}</span>
                                </div>
                                {game.technologies && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Technologies:</span>
                                        <span className="text-gray-900 dark:text-white font-medium text-right">{game.technologies}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-4">
                            <a
                                href={`https://store.steampowered.com/app/${game.steamAppId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-button block w-full text-center cursor-pointer"
                            >
                                View on Steam
                            </a>
                            <button
                                onClick={() => {
                                    if (window.history.length > 2) {
                                        navigate(-1);
                                    } else {
                                        navigate('/games');
                                    }
                                }}
                                className="w-full py-2 px-4 border cursor-pointer border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamesPage;