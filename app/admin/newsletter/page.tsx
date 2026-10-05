"use client";

import { useEffect, useState } from "react";
import { Mail, Trash2, Search, Download, Users, UserCheck, UserX, AlertCircle, CheckCircle } from "lucide-react";

interface Subscriber {
    _id: string;
    email: string;
    name?: string;
    isActive: boolean;
    subscribedAt: string;
    unsubscribedAt?: string;
    source?: string;
}

export default function NewsletterPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/newsletter?limit=100${showActiveOnly ? "&active=true" : ""}`);
            const data = await res.json();
            if (data.success) {
                setSubscribers(data.data);
                // Calculate stats
                const total = data.pagination?.total || data.data.length;
                const active = data.data.filter((s: Subscriber) => s.isActive).length;
                setStats({ total, active, inactive: total - active });
            }
        } catch (error) {
            console.error("Failed to fetch subscribers:", error);
            setError("Failed to fetch subscribers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, [showActiveOnly]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subscriber?")) return;

        try {
            const res = await fetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setSubscribers(subscribers.filter((s) => s._id !== id));
                setSuccess("Subscriber deleted successfully");
            } else {
                setError(data.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Failed to delete:", error);
            setError("Failed to delete subscriber");
        }
    };

    const handleExport = () => {
        const activeEmails = subscribers
            .filter((s) => s.isActive)
            .map((s) => s.email)
            .join("\n");

        const blob = new Blob([activeEmails], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `newsletter-emails-${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess(`Exported ${subscribers.filter(s => s.isActive).length} emails`);
    };

    const filteredSubscribers = subscribers.filter(
        (s) =>
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.name?.toLowerCase().includes(search.toLowerCase())
    );

    // Auto-hide success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Mail className="text-blue-400" />
                        Newsletter Subscribers
                    </h1>
                    <p className="text-slate-400 mt-1">Manage newsletter subscriptions</p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                    <Download size={20} />
                    Export Emails
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Users className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Subscribers</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <UserCheck className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <UserX className="text-red-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Unsubscribed</p>
                            <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                    <p className="text-green-400">{success}</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                    <p className="text-red-400">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-sm">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <label className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">Active only</span>
                </label>
            </div>

            {/* Subscribers Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : filteredSubscribers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Mail className="mx-auto mb-4 text-slate-500" size={48} />
                        <p>No subscribers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Subscribed
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredSubscribers.map((subscriber) => (
                                    <tr key={subscriber._id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium">{subscriber.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {subscriber.name || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${subscriber.isActive
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {subscriber.isActive ? "Active" : "Unsubscribed"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {subscriber.source || "footer"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => handleDelete(subscriber._id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Delete subscriber"
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
                )}
            </div>
        </div>
    );
}
