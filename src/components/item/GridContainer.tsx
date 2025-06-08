import { Link } from 'react-router-dom';

interface GridContainerProps {
    title: string;
    name: React.ReactNode[];
}

const GridContainer = (props: GridContainerProps) => {
    return (
        <div className="mt-12">
            <h1 className="text-4xl font-bold mb-2">{props.title}</h1>
            <div className="border-b-2 border-gray-500 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 grid-rows-2 gap-4">
                {props.name.map((item, index) => (
                    <Link key={index} to="/">
                        {item}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default GridContainer;