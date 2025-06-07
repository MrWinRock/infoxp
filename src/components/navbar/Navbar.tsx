import { Link, useLocation } from 'react-router-dom'
import { IoChatbubbleOutline } from "react-icons/io5"

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/genre', label: 'Genre' },
    { to: '/games', label: 'Games' },
    {
        to: '/chat',
        label: (
            <span className="flex items-center justify-center w-[36px] h-[40px]">
                <IoChatbubbleOutline size={36} className="font-extrabold" />
            </span>
        )
    },
]

const Navbar = () => {
    const location = useLocation()

    return (
        <nav className="w-full fixed top-0 left-0 z-40 bg-white dark:bg-[#171D25] border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between w-full max-w-6xl mx-auto px-6 py-3">
                {/* Logo */}
                <div className="text-[32px] flex-shrink-0">
                    <Link to="/" className="font text-blue-700 dark:text-[#1A9FFF]">
                        INFO<strong>XP</strong>
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex gap-6 items-center flex-1 justify-center">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`text-[26px] font-semibold px-4 py-2 rounded transition-colors duration-200 border-b-4 flex items-center justify-center
                                ${location.pathname === link.to
                                    ? 'border-blue-600 text-blue-700 dark:text-[#1A9FFF]'
                                    : 'border-transparent text-gray-800 dark:text-gray-200 hover:border-blue-400 hover:text-blue-700 dark:hover:text-[#1A9FFF]'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Login/Register Buttons */}
                <div className="flex gap-4 flex-shrink-0">
                    <Link
                        to="/login"
                        className="text-[18px] font-medium px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 text-blue-700 dark:text-[#1A9FFF]"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="text-[18px] font-medium px-3 py-1 rounded border border-blue-500 text-blue-700 dark:text-[#1A9FFF] hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;