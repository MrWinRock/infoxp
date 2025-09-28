import GridContainer from '../item/GridContainer';
import ItemBox from '../item/ItemBox';
import { fetchGames, Game } from '../../services/gameService';
import { useEffect, useState } from 'react';

const toImageSrc = (imageUrl?: string) =>
    imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `/images/${imageUrl}` : '/images/default.jpg';

const Home = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchGames()
            .then(data => mounted && setGames(data))
            .catch(err => {
                console.error(err);
                if (mounted) setError('Failed to load games');
            });
        return () => { mounted = false; };
    }, []);

    if (error) {
        return <div className="w-full max-w-6xl mx-auto mt-6 text-red-500">{error}</div>;
    }
    if (!games) {
        return <div className="w-full max-w-6xl mx-auto mt-6">Loading...</div>;
    }

    // Get first 8 games for home page
    const gameItems: React.ReactNode[] = games.slice(0, 8).map((game) => (
        <ItemBox
            key={game.steamAppId}
            image={toImageSrc(game.image_url)}
            alt={game.title}
            steamAppId={game.steamAppId}
        >
            {game.title}
        </ItemBox>
    ));

    // Extract unique genres and create genre items
    const allGenres = [...new Set(games.flatMap(game => game.genre || []))].filter(Boolean);
    const genreItems: React.ReactNode[] = allGenres.slice(0, 8).map((genre) => {
        const matchingGames = games.filter(game => (game.genre || []).includes(genre));
        const randomGame = matchingGames[Math.floor(Math.random() * matchingGames.length)];

        return (
            <ItemBox
                key={genre}
                image={toImageSrc(randomGame?.image_url)}
                alt={genre}
                genreName={genre}
            >
                {genre}
            </ItemBox>
        );
    });

    return (
        <div className="home w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Games" name={gameItems} />
            <GridContainer title="Genre" name={genreItems} />
        </div>
    );
};

export default Home;