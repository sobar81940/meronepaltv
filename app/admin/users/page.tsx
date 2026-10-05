"use client";

import { useEffect, useState } from "react";
import {
    Users, Plus, Edit, Trash2, X, Shield, Lock,
    Check, AlertCircle, Eye, EyeOff
} from "lucide-react";

interface UserPermissions {
    canCreatePosts: boolean;
    canManageGallery: boolean;
    canManageCategories: boolean;
    canManageSettings: boolean;
    canManageUsers: boolean;
    postLimit?: number;
}

interface User {
    _id: string;
    email: string;
    name: string;
    role: "admin" | "editor" | "demo";
    permissions: UserPermissions;
    postCount: number;
    createdAt: string;
}

type ModalMode = "create" | "edit" | "password" | null;

const defaultPermissions: UserPermissions = {
    canCreatePosts: true,
    canManageGallery: true,
    canManageCategories: false,
    canManageSettings: false,
    canManageUsers: false,
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "editor" as "admin" | "editor" | "demo",
        permissions: { ...defaultPermissions },
        postLimit: "",
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            } else {
                setError(data.error || "Failed to fetch users");
            }
        } catch {
            setError("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            password: "",
            role: "editor",
            permissions: { ...defaultPermissions },
            postLimit: "",
        });
        setSelectedUser(null);
        setError("");
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode("create");
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            permissions: { ...user.permissions },
            postLimit: user.permissions.postLimit?.toString() || "",
        });
        setModalMode("edit");
    };

    const openPasswordModal = (user: User) => {
        setSelectedUser(user);
        setForm({ ...form, password: "" });
        setModalMode("password");
    };

    const closeModal = () => {
        setModalMode(null);
        resetForm();
    };

    const handleRoleChange = (role: "admin" | "editor" | "demo") => {
        // Set default permissions based on role
        const rolePermissions: Record<string, UserPermissions> = {
            admin: {
                canCreatePosts: true,
                canManageGallery: true,
                canManageCategories: true,
                canManageSettings: true,
                canManageUsers: true,
            },
            editor: {
                canCreatePosts: true,
                canManageGallery: true,
                canManageCategories: false,
                canManageSettings: false,
                canManageUsers: false,
            },
            demo: {
                canCreatePosts: true,
                canManageGallery: true,
                canManageCategories: false,
                canManageSettings: false,
                canManageUsers: false,
                postLimit: 2,
            },
        };

        setForm({
            ...form,
            role,
            permissions: rolePermissions[role],
            postLimit: role === "demo" ? "2" : "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const permissions = {
                ...form.permissions,
                postLimit: form.postLimit ? parseInt(form.postLimit) : undefined,
            };

            if (modalMode === "create") {
                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name,
                        email: form.email,
                        password: form.password,
                        role: form.role,
                        permissions,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setSuccess("User created successfully!");
            } else if (modalMode === "edit" && selectedUser) {
                const res = await fetch(`/api/users/${selectedUser._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name,
                        email: form.email,
                        role: form.role,
                        permissions,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setSuccess("User updated successfully!");
            } else if (modalMode === "password" && selectedUser) {
                const res = await fetch(`/api/users/${selectedUser._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: form.password }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setSuccess("Password updated successfully!");
            }

            closeModal();
            fetchUsers();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/users/${user._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setSuccess("User deleted successfully!");
            fetchUsers();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case "editor": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "demo": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-blue-400" />
                        User Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage users, roles, and permissions
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError("")} className="ml-auto">
                        <X size={18} />
                    </button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
                    <Check size={18} />
                    {success}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="text-left p-4 text-slate-300 font-medium">User</th>
                            <th className="text-left p-4 text-slate-300 font-medium">Role</th>
                            <th className="text-left p-4 text-slate-300 font-medium">Permissions</th>
                            <th className="text-left p-4 text-slate-300 font-medium">Post Limit</th>
                            <th className="text-right p-4 text-slate-300 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user.name}</p>
                                            <p className="text-slate-400 text-sm">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.permissions?.canCreatePosts && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Posts</span>
                                        )}
                                        {user.permissions?.canManageGallery && (
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Gallery</span>
                                        )}
                                        {user.permissions?.canManageCategories && (
                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Categories</span>
                                        )}
                                        {user.permissions?.canManageSettings && (
                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Settings</span>
                                        )}
                                        {user.permissions?.canManageUsers && (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Users</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.permissions?.postLimit !== undefined ? (
                                        <span className="text-amber-400">
                                            {user.postCount || 0} / {user.permissions.postLimit}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">Unlimited</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openPasswordModal(user)}
                                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                                            title="Reset Password"
                                        >
                                            <Lock size={18} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                            title="Edit User"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                {modalMode === "create" && <><Plus size={20} /> Add New User</>}
                                {modalMode === "edit" && <><Edit size={20} /> Edit User</>}
                                {modalMode === "password" && <><Lock size={20} /> Reset Password</>}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {modalMode === "password" ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        New Password for {selectedUser?.name}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Email <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {modalMode === "create" && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Password <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={form.password}
                                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white pr-10"
                                                    required
                                                    minLength={6}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Role
                                        </label>
                                        <div className="flex gap-2">
                                            {(["admin", "editor", "demo"] as const).map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => handleRoleChange(role)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition ${form.role === role
                                                            ? role === "admin"
                                                                ? "bg-purple-600 text-white"
                                                                : role === "editor"
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-amber-600 text-white"
                                                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                        }`}
                                                >
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Shield size={14} className="inline mr-1" />
                                            Permissions
                                        </label>
                                        <div className="space-y-2 bg-slate-700/30 rounded-lg p-3">
                                            {[
                                                { key: "canCreatePosts", label: "Create Posts" },
                                                { key: "canManageGallery", label: "Manage Gallery" },
                                                { key: "canManageCategories", label: "Manage Categories" },
                                                { key: "canManageSettings", label: "Manage Settings" },
                                                { key: "canManageUsers", label: "Manage Users" },
                                            ].map(({ key, label }) => (
                                                <label key={key} className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.permissions[key as keyof UserPermissions] as boolean}
                                                        onChange={(e) =>
                                                            setForm({
                                                                ...form,
                                                                permissions: {
                                                                    ...form.permissions,
                                                                    [key]: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                        className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-600"
                                                    />
                                                    <span className="text-slate-300">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Post Limit (leave empty for unlimited)
                                        </label>
                                        <input
                                            type="number"
                                            value={form.postLimit}
                                            onChange={(e) => setForm({ ...form, postLimit: e.target.value })}
                                            placeholder="e.g., 5"
                                            min="1"
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                        />
                                        <p className="text-slate-500 text-xs mt-1">
                                            Set a maximum number of posts this user can create
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                                >
                                    {modalMode === "create" ? "Create User" : modalMode === "edit" ? "Save Changes" : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
