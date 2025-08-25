import { useState } from 'react';
import { register } from '../../services/authService';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', date_of_birth: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.name.trim()) return 'Name is required';
        if (form.password.length < 8) return 'Password must be at least 8 characters long';
        return null;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError(null);
        setMsg(null);
        const vErr = validate();
        if (vErr) {
            setError(vErr);
            return;
        }
        setLoading(true);
        try {
            const { name, email, password, date_of_birth } = form;
            const { status, body } = await register({
                name,
                email,
                password,
                date_of_birth: date_of_birth || undefined
            });

            // Do NOT store token; require explicit login
            if (status === 201) {
                // Optional: brief success message before redirect (could use toast instead)
                setMsg(body.message || 'User created successfully');
                navigate('/login', { replace: true });
                return;
            }

            setMsg(body.message || 'Registration completed');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const errorObj = err as { response?: { data?: { message?: string } } };
                setError(errorObj.response?.data?.message || 'Registration failed');
            } else {
                setError('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-20 bg-white dark:bg-[#171D25] p-6 rounded shadow">
            <h2 className="text-3xl font-bold mb-4">Register</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-md font-medium mb-1" htmlFor="name">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    />
                </div>
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
                <div>
                    <label className="block text-md font-medium mb-1" htmlFor="date_of_birth">Date of Birth (optional)</label>
                    <input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={form.date_of_birth}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {msg && <p className="text-sm text-green-600">{msg}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="p-button w-full"
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
}

export default Register;