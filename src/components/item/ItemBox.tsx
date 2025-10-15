import { useNavigate } from 'react-router-dom';

interface ItemBoxProps {
    children?: React.ReactNode;
    className?: string;
    image?: string;
    alt?: string;
    _id?: string;
    genreName?: string;
    to?: string;
}

const ItemBox = ({ children, className = "", image, alt = "", _id, genreName, to }: ItemBoxProps) => {
    const navigate = useNavigate();
    const isClickable = Boolean(to || _id || genreName);

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else if (_id) {
            navigate(`/games/${_id}`);
        } else if (genreName) {
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
            className={`group relative rounded h-64 w-64 flex items-center justify-center max-w-full transition-all duration-300 ease-in-out hover:shadow-xl ${isClickable ? 'cursor-pointer' : ''} ${className}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            {/* Main image */}
            <img src={image || "/images/default.jpg"} alt={alt} className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black to-[#2880A6] opacity-70 rounded-xl pointer-events-none transition-opacity duration-300 ease-in-out group-hover:opacity-0" />
            {/* Content Wrapper */}
            <div className="relative z-10 m-2 flex my-auto items-center justify-center">
                {/* Text Background */}
                <div className="bg-white text-[#0876c4] text-lg font-semibold mt-12 px-3 py-1 rounded-md backdrop-blur-sm transition-all duration-300 ease-in-out group-hover:mt-32">
                    {children}
                </div>
            </div>
        </button>
    );
};

export default ItemBox;