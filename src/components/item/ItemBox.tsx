const ItemBox = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative rounded h-32 w-32 flex items-center justify-center max-w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-black to-[#1A9FFF] opacity-50 rounded pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center text-lg font-semibold text-white">
                {children}
            </div>
        </div>
    );
}

export default ItemBox;