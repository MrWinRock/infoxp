import { useEffect, useState } from "react";
import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";
import { fetchGames, Game } from "../../services/gameService";

const toImageSrc = (imageUrl?: string) =>
    imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `/images/${imageUrl}` : '/images/default.jpg';

const Games = () => {
    const [games, setGames] = useState<Game[] | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const gameItems: React.ReactNode[] = games.map((game) => {
        return (
            <ItemBox
                key={game._id}
                image={toImageSrc(game.image_url)}
                alt={game.title}
                _id={game._id}
            >
                {game.title}
            </ItemBox>
        );
    });

    return (
        <div className="games w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Games" name={gameItems} />
        </div>
    );
};

export default Games;