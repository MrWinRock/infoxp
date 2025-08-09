import { useState } from 'react';
import { login } from '../../services/authService';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError(null);
        setMsg(null);
        setLoading(true);
        try {
            const res = await login(form);
            if (res.token) localStorage.setItem('auth_token', res.token);
            setMsg(res.message || (res.user ? `Welcome ${res.user.name}` : 'Login success'));
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
        <div className="w-full max-w-md mx-auto mt-20 bg-white dark:bg-[#171D25] p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
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
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {msg && <p className="text-sm text-green-600">{msg}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;