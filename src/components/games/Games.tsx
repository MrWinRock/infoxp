import GridContainer from "../item/GridContainer";
import ItemBox from "../item/ItemBox";

const Games = () => {
    const items: React.ReactNode[] = [...Array(32)].map((_, i) => (
        <ItemBox key={i}>
            Item {i + 1}
        </ItemBox>
    ));

    return (
        <div className="games w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Games" name={items} />
        </div>
    );
}

export default Games;
