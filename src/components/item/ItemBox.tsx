// import portal2Image from '../../assets/game-icon/portal2.jpg';
import cs2Image from '../../assets/game-icon/cs2.jpg';

const ItemBox = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="group relative rounded h-32 w-32 flex items-center justify-center max-w-full transition-all duration-300 ease-in-out hover:shadow-xl">
            {/* Main image */}
            <img src={cs2Image} alt="Counter-Strike 2 game icon" className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black to-[#2880A6] opacity-80 rounded-xl pointer-events-none transition-opacity duration-300 ease-in-out group-hover:opacity-0" />
            {/* Content Wrapper */}
            <div className="relative z-10 flex items-center justify-center">
                {/* Text Background*/}
                <div className="bg-white text-[#1A9FFF] text-lg font-semibold px-3 py-1 rounded-md backdrop-blur-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default ItemBox;