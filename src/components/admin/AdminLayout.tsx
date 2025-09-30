import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const adminNavLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/games', label: 'Game Management' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/', label: '← Back to Site' },
];

const readUser = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const AdminLayout = () => {
    const [user] = useState(() => readUser());
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex w-full max-w-[1200px] mx-auto mt-6">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#171D25] p-4 flex flex-col shadow-lg rounded-l-lg">
                <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-[#1A9FFF]">Admin Panel</h2>
                <nav className="flex flex-col gap-2">
                    {adminNavLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) =>
                                `px-4 py-3 rounded-md text-lg font-medium transition-colors duration-200 flex items-center ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-800'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-6 ml-4 bg-white dark:bg-[#171D25] rounded-r-lg shadow-lg">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;