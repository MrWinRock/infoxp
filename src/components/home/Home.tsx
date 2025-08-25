import GridContainer from '../item/GridContainer';
import ItemBox from '../item/ItemBox';
import games from '../../data/games';

const Home = () => {
    // Get first 8 games for home page
    const gameItems: React.ReactNode[] = games.slice(0, 8).map((game) => (
        <ItemBox
            key={game.steamAppId}
            image={`/images/${game.imageUrl}`}
            alt={game.title}
            steamAppId={game.steamAppId}
        >
            {game.title}
        </ItemBox>
    ));

    // Extract unique genres and create genre items
    const allGenres = [...new Set(games.flatMap(game => game.genre))].filter(Boolean);
    const genreItems: React.ReactNode[] = allGenres.slice(0, 8).map((genre) => {
        // Find games that match this genre
        const matchingGames = games.filter(game => game.genre.includes(genre));
        // Pick a random game from matching games
        const randomGame = matchingGames[Math.floor(Math.random() * matchingGames.length)];

        return (
            <ItemBox
                key={genre}
                image={`/images/${randomGame.imageUrl}`}
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