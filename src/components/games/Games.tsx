import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";
import games from "../../data/games";

const Games = () => {
    const gameItems: React.ReactNode[] = games.map((game) => (
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
        <div className="games w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Games" name={gameItems} />
        </div>
    );
};

export default Games;