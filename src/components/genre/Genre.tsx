import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";
import games from "../../data/games";

const Genre = () => {
    const allGenres = [...new Set(games.flatMap(game => game.genre))].filter(Boolean);

    const genreItems: React.ReactNode[] = allGenres.map((genre) => {

        const matchingGames = games.filter(game => game.genre.includes(genre));
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
        <div className="genre w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Genre" name={genreItems} />
        </div>
    );
};

export default Genre;