"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Eye, EyeOff, ExternalLink, BarChart3, MousePointer } from "lucide-react";
import ImageUploadWithBrowser from "@/components/ImageUploadWithBrowser";

type AdPosition =
 | "home1"
    | "home2"
    | "home3"
    | "home4"
    | "home5"
    | "home6"
    | "home7"
    | "home8"
    | "home9"
    | "top-leaderboard"
    | "header-banner"
    | "sidebar-top"
    | "sidebar-bottom"
    | "in-article"
    | "footer-banner"
    | "popup"
    | "between-posts"
    | "headline-1"
    | "headline-2"
    | "headline-3";

interface Advertisement {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: AdPosition;
    positions?: AdPosition[];
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    clicks: number;
    impressions: number;
    priority: number;
    createdAt: string;
}

const POSITIONS: { value: AdPosition; label: string; group?: string }[] = [
    { value: "header-banner", label: "Header Banner" },
    { value: "top-leaderboard", label: "Top Leaderboard" },
    { value: "sidebar-top", label: "Sidebar Top" },
    { value: "sidebar-bottom", label: "Sidebar Bottom" },
    { value: "in-article", label: "In Article" },
    { value: "footer-banner", label: "Footer Banner" },
    { value: "popup", label: "Popup" },
    { value: "between-posts", label: "Between Posts" },
    { value: "headline-1", label: "Headline Ad 1", group: "headline" },
    { value: "headline-2", label: "Headline Ad 2", group: "headline" },
    { value: "headline-3", label: "Headline Ad 3", group: "headline" },
    { value: "home1", label: "Home 1" },
    { value: "home2", label: "Home 2" },
    { value: "home3", label: "Home 3" },
    { value: "home4", label: "Home 4" },
    { value: "home5", label: "Home 5" },
    { value: "home6", label: "Home 6" },
    { value: "home7", label: "Home 7" },
    { value: "home8", label: "Home 8" },
    { value: "home9", label: "Home 9" },
];

export default function AdvertisementsPage() {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        imageUrl: "",
        linkUrl: "",
        positions: [] as AdPosition[],
        isActive: true,
        startDate: "",
        endDate: "",
        priority: 0,
    });

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await fetch("/api/advertisements");
            const data = await res.json();
            if (data.success) {
                setAds(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch ads:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            imageUrl: "",
            linkUrl: "",
            positions: [],
            isActive: true,
            startDate: "",
            endDate: "",
            priority: 0,
        });
        setEditingAd(null);
        setShowForm(false);
    };

    const handleEdit = (ad: Advertisement) => {
        // Support both legacy position and new positions array
        const positions = ad.positions || (ad.position ? [ad.position] : []);
        setForm({
            title: ad.title,
            imageUrl: ad.imageUrl,
            linkUrl: ad.linkUrl,
            positions: positions,
            isActive: ad.isActive,
            startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
            endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
            priority: ad.priority,
        });
        setEditingAd(ad);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingAd
                ? `/api/advertisements/${editingAd._id}`
                : "/api/advertisements";
            const method = editingAd ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                fetchAds();
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save ad:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this advertisement?")) return;

        try {
            const res = await fetch(`/api/advertisements/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchAds();
            }
        } catch (error) {
            console.error("Failed to delete ad:", error);
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const res = await fetch(`/api/advertisements/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle" }),
            });
            if (res.ok) {
                fetchAds();
            }
        } catch (error) {
            console.error("Failed to toggle ad:", error);
        }
    };

    const getPositionLabel = (position: AdPosition) => {
        return POSITIONS.find(p => p.value === position)?.label || position;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Advertisements</h1>
                    <p className="text-slate-400 mt-1">Manage your website advertisements</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add New Ad
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editingAd ? "Edit Advertisement" : "Add New Advertisement"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                    placeholder="Ad title..."
                                    required
                                />
                            </div>

                            {/* Link URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Link URL *
                                </label>
                                <input
                                    type="url"
                                    value={form.linkUrl}
                                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            {/* Positions - Multiple Select */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                    Positions * (Select multiple)
                                </label>

                                {/* Headline Section Ads */}
                                <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg">
                                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">🎯 Headline Section Ads (Between Headline Posts)</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["headline-1", "headline-2", "headline-3"] as AdPosition[]).map((val, i) => (
                                            <label
                                                key={val}
                                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    form.positions.includes(val)
                                                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                                                        : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-amber-500"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.positions.includes(val)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setForm({ ...form, positions: [...form.positions, val] });
                                                        } else {
                                                            setForm({ ...form, positions: form.positions.filter(p => p !== val) });
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm font-semibold">Headline Ad {i + 1}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Other Positions */}
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Other Positions</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {([
                                            { value: "header-banner", label: "Header Banner" },
                                            { value: "top-leaderboard", label: "Top Leaderboard" },
                                            { value: "sidebar-top", label: "Sidebar Top" },
                                            { value: "sidebar-bottom", label: "Sidebar Bottom" },
                                            { value: "in-article", label: "In Article" },
                                            { value: "footer-banner", label: "Footer Banner" },
                                            { value: "popup", label: "Popup" },
                                            { value: "between-posts", label: "Between Posts" },
                                            { value: "home1", label: "Home 1" },
                                            { value: "home2", label: "Home 2" },
                                            { value: "home3", label: "Home 3" },
                                            { value: "home4", label: "Home 4" },
                                            { value: "home5", label: "Home 5" },
                                            { value: "home6", label: "Home 6" },
                                            { value: "home7", label: "Home 7" },
                                            { value: "home8", label: "Home 8" },
                                            { value: "home9", label: "Home 9" },
                                        ] as { value: AdPosition; label: string }[]).map((pos) => (
                                            <label
                                                key={pos.value}
                                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    form.positions.includes(pos.value)
                                                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                                        : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.positions.includes(pos.value)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setForm({ ...form, positions: [...form.positions, pos.value] });
                                                        } else {
                                                            setForm({ ...form, positions: form.positions.filter(p => p !== pos.value) });
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{pos.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {form.positions.length === 0 && (
                                    <p className="text-red-400 text-xs mt-2">Select at least one position</p>
                                )}
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Priority (Higher = More Important)
                                </label>
                                <input
                                    type="number"
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                    min="0"
                                />
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Start Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Ad Image *
                            </label>
                            <ImageUploadWithBrowser
                                value={form.imageUrl}
                                onChange={(url: string) => setForm({ ...form, imageUrl: url })}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-600"
                            />
                            <label htmlFor="isActive" className="text-slate-300">
                                Active (Show on website)
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editingAd ? "Update" : "Create"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ads List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Preview</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Title</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Position</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Stats</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {ads.map((ad) => (
                                <tr key={ad._id} className="hover:bg-slate-700/30">
                                    <td className="px-4 py-3">
                                        <div className="w-20 h-14 rounded overflow-hidden bg-slate-700">
                                            {ad.imageUrl && (
                                                <img
                                                    src={ad.imageUrl}
                                                    alt={ad.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-white font-medium">{ad.title}</div>
                                        <a
                                            href={ad.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {ad.linkUrl.substring(0, 30)}...
                                            <ExternalLink size={12} />
                                        </a>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(ad.positions || [ad.position]).map((pos) => (
                                                <span key={pos} className="px-2 py-1 bg-slate-600 rounded text-xs text-white">
                                                    {getPositionLabel(pos)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <BarChart3 size={14} />
                                                {ad.impressions}
                                            </span>
                                            <span className="flex items-center gap-1 text-green-400">
                                                <MousePointer size={14} />
                                                {ad.clicks}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${ad.isActive
                                            ? "bg-green-600/20 text-green-400"
                                            : "bg-red-600/20 text-red-400"
                                            }`}>
                                            {ad.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(ad._id)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition"
                                                title={ad.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {ad.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(ad)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded transition"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ad._id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {ads.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No advertisements yet. Click &quot;Add New Ad&quot; to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
