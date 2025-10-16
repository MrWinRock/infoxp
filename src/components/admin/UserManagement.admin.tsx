import { useEffect, useState } from "react";
import { fetchUsers, User, deleteUser as deleteUserApi, promoteUserToAdmin, demoteAdminToUser } from "../../services/userService";

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [promotingId, setPromotingId] = useState<string | null>(null);
    const [demotingId, setDemotingId] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchUsers();
                if (alive) setUsers(data);
            } catch (e: unknown) {
                const message = e instanceof Error && e.message ? e.message : "Failed to load users";
                if (alive) setError(message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const handleDelete = async (id: string) => {
        console.log("Delete User ID:", id);
        if (!confirm("Delete this user? This cannot be undone.")) return;
        try {
            setDeletingId(id);
            await deleteUserApi(id);
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (e: unknown) {
            const message = e instanceof Error && e.message ? e.message : "Failed to delete user";
            alert(message);
        } finally {
            setDeletingId(null);
        }
    };

    const handlePromote = async (id: string) => {
        try {
            setPromotingId(id);
            console.log("Promoting User ID:", id);
            await promoteUserToAdmin(id);
            setUsers(prev => prev.map(user => user._id === id ? { ...user, role: "admin" } : user));
            alert("User promoted to admin");
        } catch (e: unknown) {
            const message = e instanceof Error && e.message ? e.message : "Failed to promote user";
            alert(message);
        } finally {
            setPromotingId(null);
        }
    };

    const handleDemote = async (id: string) => {
        try {
            setDemotingId(id);
            console.log("Demoting User ID:", id);
            await demoteAdminToUser(id);
            setUsers(prev => prev.map(user => user._id === id ? { ...user, role: "user" } : user));
            alert("Admin demoted to user");
        } catch (e: unknown) {
            const message = e instanceof Error && e.message ? e.message : "Failed to demote admin";
            alert(message);
        } finally {
            setDemotingId(null);
        }
    };

    if (loading) {
        return <div className="p-4">Loading users…</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Users ({users.length})</h1>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user._id} className="bg-white dark:bg-[#171D25]">
                                <td className="px-4 py-3">{user.name}</td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3 capitalize">{user.role || "user"}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50 cursor-pointer"
                                            onClick={() => handlePromote(user._id)}
                                            disabled={user.role === "admin" || promotingId === user._id}
                                            title={user.role === "admin" ? "Already admin" : "Promote to admin"}
                                        >
                                            {promotingId === user._id ? "Promoting…" : "Promote"}
                                        </button>
                                        <button
                                            className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm disabled:opacity-50 cursor-pointer"
                                            onClick={() => handleDemote(user._id)}
                                            disabled={user.role !== "admin" || demotingId === user._id}
                                            title={user.role !== "admin" ? "Only admins can be demoted" : "Demote to user"}
                                        >
                                            {demotingId === user._id ? "Demoting…" : "Demote"}
                                        </button>
                                        <button
                                            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm disabled:opacity-50 cursor-pointer"
                                            onClick={() => handleDelete(user._id)}
                                            disabled={deletingId === user._id}
                                        >
                                            {deletingId === user._id ? "Deleting…" : "Delete"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;