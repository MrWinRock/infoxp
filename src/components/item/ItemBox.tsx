import { useNavigate } from 'react-router-dom';

interface ItemBoxProps {
    children: React.ReactNode;
    className?: string;
    image?: string;
    alt?: string;
    _id?: string;
    steam_app_id?: number;
    genreName?: string;
}

const ItemBox = ({ children, className = "", image, alt = "", _id, steam_app_id, genreName }: ItemBoxProps) => {
    const navigate = useNavigate();
    const isClickable = Boolean(steam_app_id || genreName);

    const handleClick = () => {
        console.log('ItemBox clicked:', { _id, steam_app_id, genreName });
        if (steam_app_id) {
            console.log('Navigating to game details for _id:', _id);
            navigate(`/games/${_id}`);
        } else if (genreName) {
            console.log('Navigating to genre page for genreName:', genreName);
            navigate(`/genre/${encodeURIComponent(genreName)}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isClickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <button
            className={`group relative rounded h-64 w-64 flex items-center justify-center max-w-full transition-all duration-300 ease-in-out hover:shadow-xl ${(steam_app_id || genreName) ? 'cursor-pointer' : ''} ${className}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            {/* Main image */}
            <img src={image || "/images/default.jpg"} alt={alt} className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black to-[#2880A6] opacity-70 rounded-xl pointer-events-none transition-opacity duration-300 ease-in-out group-hover:opacity-0" />
            {/* Content Wrapper */}
            <div className="relative z-10 m-2 flex my-auto items-center justify-center">
                {/* Text Background*/}
                <div className="bg-white text-[#0876c4] text-lg font-semibold mt-12 px-3 py-1 rounded-md backdrop-blur-sm transition-all duration-300 ease-in-out group-hover:mt-32">
                    {children}
                </div>
            </div>
        </button>
    );
}

export default ItemBox;