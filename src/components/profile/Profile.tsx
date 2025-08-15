import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const readUser = () => {
    try {
        const raw = localStorage.getItem('user')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed?.name ? parsed : null
    } catch {
        return null
    }
}

const Profile = () => {
    const [user, setUser] = useState<{ name?: string; email?: string } | null | undefined>(() => readUser())
    const navigate = useNavigate()

    useEffect(() => {
        const handler = () => setUser(readUser())
        window.addEventListener('user-updated', handler)
        window.addEventListener('storage', handler)
        return () => {
            window.removeEventListener('user-updated', handler)
            window.removeEventListener('storage', handler)
        }
    }, [])

    useEffect(() => {
        if (user === null) {
            navigate('/', { replace: true })
        }
    }, [user, navigate])

    const logout = () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('user-updated'))
        navigate('/', { replace: true })
    }

    if (user === undefined) {
        return (
            <div className="w-full max-w-md mx-auto mt-24 bg-white dark:bg-[#171D25] p-6 rounded shadow">
                <p>Loading...</p>
            </div>
        )
    }

    if (user === null) return null

    return (
        <div className="w-full max-w-md mx-auto mt-24 bg-white dark:bg-[#171D25] p-6 rounded shadow space-y-6">
            <h1 className="text-3xl font-bold">Profile</h1>
            <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {user.name}</p>
                {user.email && <p><span className="font-semibold">Email:</span> {user.email}</p>}
            </div>
            <button onClick={logout} className="p-button w-full">
                Logout
            </button>
        </div>
    )
}

export default Profile;