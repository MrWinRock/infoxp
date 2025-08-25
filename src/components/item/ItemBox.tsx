import { useNavigate } from 'react-router-dom';

interface ItemBoxProps {
    children: React.ReactNode;
    className?: string;
    image?: string;
    alt?: string;
    steamAppId?: number;
    genreName?: string;
}

const ItemBox = ({ children, className = "", image, alt = "", steamAppId, genreName }: ItemBoxProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (steamAppId) {
            navigate(`/games/${steamAppId}`);
        } else if (genreName) {
            navigate(`/genre/${encodeURIComponent(genreName)}`);
        }
    };

    console.log(children);

    return (
        <div
            className={`group relative rounded h-64 w-64 flex items-center justify-center max-w-full transition-all duration-300 ease-in-out hover:shadow-xl ${(steamAppId || genreName) ? 'cursor-pointer' : ''} ${className}`}
            onClick={handleClick}
        >
            {/* Main image */}
            <img src={image || "/images/default.jpg"} alt={alt} className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black to-[#2880A6] opacity-70 rounded-xl pointer-events-none transition-opacity duration-300 ease-in-out group-hover:opacity-0" />
            {/* Content Wrapper */}
            <div className="relative z-10 m-2 flex my-auto items-center justify-center">
                {/* Text Background*/}
                <div className="bg-white text-[#1A9FFF] text-lg font-semibold px-3 py-1 rounded-md backdrop-blur-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default ItemBox;