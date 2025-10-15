import { useEffect, useState } from "react";
import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";
import { fetchGames, Game } from "../../services/gameService";

const toImageSrc = (imageUrl?: string) =>
    imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `/images/${imageUrl}` : '/images/default.jpg';

const Genre = () => {
    const [games, setGames] = useState<Game[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [genreRepresentative, setGenreRepresentative] = useState<Record<string, Game | undefined>>({});

    useEffect(() => {
        let mounted = true;
        fetchGames()
            .then(data => {
                if (!mounted) return;
                setGames(data);
                const representatives: Record<string, Game | undefined> = {};
                const genres = [...new Set(data.flatMap(g => g.genre || []))].filter(Boolean) as string[];
                genres.forEach(genre => {
                    const matching = data.filter(g => (g.genre || []).includes(genre));
                    if (matching.length) {
                        representatives[genre] = matching[Math.floor(Math.random() * matching.length)];
                    }
                });
                setGenreRepresentative(representatives);
            })
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

    const allGenres = [...new Set(games.flatMap(game => game.genre || []))].filter(Boolean);

    const genreItems: React.ReactNode[] = allGenres.map((genre) => {
        const representative = genreRepresentative[genre];
        return (
            <ItemBox
                key={genre}
                image={toImageSrc(representative?.image_url)}
                alt={genre}
                genreName={genre}
            >
                {genre}
            </ItemBox>
        );
    });

    return (
        <div className="genre w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Genre" name={genreItems} />
        </div>
    );
};

export default Genre;