import GridContainer from '../item/GridContainer';
import ItemBox from '../item/ItemBox'

const Home = () => {
    const items: React.ReactNode[] = [...Array(16)].map((_, i) => (
        <ItemBox key={i}>
            Item {i + 1}
        </ItemBox>
    ));

    return (
        <div className="home w-full max-w-6xl mx-auto mt-6">
            <GridContainer title="Games" name={items} />
            <GridContainer title="Genre" name={items} />
        </div>
    );
}

export default Home;