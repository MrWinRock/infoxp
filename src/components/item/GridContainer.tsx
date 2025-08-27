import { Link } from "react-router-dom";

interface GridContainerProps {
    title: string;
    name: React.ReactNode[];
}

const GridContainer = (props: GridContainerProps) => {
    const isInHomePage = window.location.pathname === '/';

    const lower = props.title.toLowerCase();
    const seeMoreTarget =
        lower.includes('game') ? '/games'
            : lower.includes('genre') ? '/genre'
                : '/';

    const showSeeMore = isInHomePage && seeMoreTarget !== window.location.pathname;

    return (
        <div className="mt-12">
            <div className="flex flex-row justify-between items-center w-full">
                <h1 className="text-4xl font-bold mb-2">{props.title}</h1>
                {showSeeMore && (
                    <Link
                        to={seeMoreTarget}
                        className="text-blue-500 hover:underline"
                    >
                        See more
                    </Link>
                )}
            </div>
            <div className="border-b-2 border-gray-500 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4">
                {props.name.map((item, index) => (
                    <div key={index}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GridContainer;