import { useState } from 'react';
import { login } from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError(null);
        setLoading(true);
        try {
            const res = await login(form);
            if (res.token) localStorage.setItem('auth_token', res.token);
            if (res.user) {
                localStorage.setItem('user', JSON.stringify(res.user));
                window.dispatchEvent(new Event('user-updated'));
                navigate('/');
            }
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response?: { data?: { message?: string } } }).response;
                setError(response?.data?.message || 'Login failed');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-20">
            <h2 className="text-3xl font-bold mb-4 text-center">Sign in</h2>
            <div className="bg-white dark:bg-[#171D25] p-6 rounded shadow">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-md font-medium mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={onChange}
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-md font-medium" htmlFor="password">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="inline-flex items-center justify-center h-8 w-8 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                            >
                                {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                            </button>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={form.password}
                            onChange={onChange}
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="p-button w-full"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
            <div className="text-center mt-4 text-md">
                <span className="text-gray-600 dark:text-gray-300">No account? </span>
                <Link to="/register" className="font-semibold text-blue-600 dark:text-[#1A9FFF] hover:underline">
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default Login;