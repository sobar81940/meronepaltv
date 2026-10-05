"use client";

import { useState, useEffect } from "react";
import { Save, Layers, Plus, Trash2, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings, MegaMenuCategory, SubCategory } from "@/models/Settings";

// Mega Menu Category Component
function MegaMenuCategoryItem({
    category,
    categoryIndex,
    onUpdateCategory,
    onRemoveCategory,
    onAddSubcategory,
    onUpdateSubcategory,
    onRemoveSubcategory,
}: {
    category: MegaMenuCategory;
    categoryIndex: number;
    onUpdateCategory: (index: number, name: string) => void;
    onRemoveCategory: (index: number) => void;
    onAddSubcategory: (categoryIndex: number) => void;
    onUpdateSubcategory: (categoryIndex: number, subIndex: number, field: keyof SubCategory, value: string) => void;
    onRemoveSubcategory: (categoryIndex: number, subIndex: number) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="bg-slate-700/30 rounded-lg border border-slate-600 overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center gap-3 p-3 bg-slate-700/50">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 text-slate-400 hover:text-white transition"
                >
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <input
                    type="text"
                    placeholder="Category Name"
                    value={category.name}
                    onChange={(e) => onUpdateCategory(categoryIndex, e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500">
                    {category.subcategories.length} items
                </span>
                <button
                    onClick={() => onRemoveCategory(categoryIndex)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Subcategories */}
            {expanded && (
                <div className="p-3 pt-0 space-y-2">
                    {category.subcategories.map((sub, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-2 ml-6">
                            <span className="text-slate-500">→</span>
                            <input
                                type="text"
                                placeholder="Subcategory Name"
                                value={sub.name}
                                onChange={(e) => onUpdateSubcategory(categoryIndex, subIndex, "name", e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="URL"
                                value={sub.href}
                                onChange={(e) => onUpdateSubcategory(categoryIndex, subIndex, "href", e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => onRemoveSubcategory(categoryIndex, subIndex)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onAddSubcategory(categoryIndex)}
                        className="ml-6 flex items-center gap-1 px-3 py-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition text-sm"
                    >
                        <Plus size={14} />
                        Add Subcategory
                    </button>
                </div>
            )}
        </div>
    );
}

export default function MegaMenuSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // Check user access and fetch
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (!data.user) { router.push("/login"); return; }
                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;
                if (isAdmin || canManageSettings) { setHasAccess(true); fetchSettings(); }
                else setHasAccess(false);
            } catch (error) { setHasAccess(false); }
        };
        checkAccess();
    }, [router]);

    const fetchSettings = () => {
        fetch("/api/settings").then((res) => res.json()).then((data) => {
            if (data.success && data.data) setSettings(data.data);
        }).finally(() => setLoading(false));
    }

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if ((await res.json()).success) setMessage({ type: "success", text: "Mega Menu saved!" });
            else setMessage({ type: "error", text: "Failed to save" });
        } catch { setMessage({ type: "error", text: "Failed to save" }); }
        finally { setSaving(false); }
    };

    // Handlers
    const addMegaMenuCategory = () => {
        if (!settings) return;
        const newCategory: MegaMenuCategory = { name: "", subcategories: [] };
        setSettings({ ...settings, megaMenu: [...settings.megaMenu, newCategory] });
    };

    const updateMegaMenuCategory = (index: number, name: string) => {
        if (!settings) return;
        const updated = [...settings.megaMenu];
        updated[index] = { ...updated[index], name };
        setSettings({ ...settings, megaMenu: updated });
    };

    const removeMegaMenuCategory = (index: number) => {
        if (!settings) return;
        setSettings({ ...settings, megaMenu: settings.megaMenu.filter((_, i) => i !== index) });
    };

    const addSubcategory = (categoryIndex: number) => {
        if (!settings) return;
        const updated = [...settings.megaMenu];
        updated[categoryIndex] = { ...updated[categoryIndex], subcategories: [...updated[categoryIndex].subcategories, { name: "", href: "/" }] };
        setSettings({ ...settings, megaMenu: updated });
    };

    const updateSubcategory = (categoryIndex: number, subIndex: number, field: keyof SubCategory, value: string) => {
        if (!settings) return;
        const updated = [...settings.megaMenu];
        const updatedSubs = [...updated[categoryIndex].subcategories];
        updatedSubs[subIndex] = { ...updatedSubs[subIndex], [field]: value };
        updated[categoryIndex] = { ...updated[categoryIndex], subcategories: updatedSubs };
        setSettings({ ...settings, megaMenu: updated });
    };

    const removeSubcategory = (categoryIndex: number, subIndex: number) => {
        if (!settings) return;
        const updated = [...settings.megaMenu];
        updated[categoryIndex] = { ...updated[categoryIndex], subcategories: updated[categoryIndex].subcategories.filter((_, i) => i !== subIndex) };
        setSettings({ ...settings, megaMenu: updated });
    };

    if (hasAccess === null || loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (hasAccess === false) return <div className="text-center p-8 text-white">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Layers className="text-purple-400" />
                        Mega Menu
                    </h1>
                    <p className="text-slate-400 mt-1">Configure dropdown menus and subcategories</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (<div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{message.text}</div>)}

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Layers size={20} className="text-purple-400" />
                        Menu Categories
                    </h2>
                    <button onClick={addMegaMenuCategory} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
                        <Plus size={16} /> Add Category
                    </button>
                </div>
                <div className="space-y-4">
                    {settings.megaMenu.map((category, index) => (
                        <MegaMenuCategoryItem
                            key={index}
                            category={category}
                            categoryIndex={index}
                            onUpdateCategory={updateMegaMenuCategory}
                            onRemoveCategory={removeMegaMenuCategory}
                            onAddSubcategory={addSubcategory}
                            onUpdateSubcategory={updateSubcategory}
                            onRemoveSubcategory={removeSubcategory}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
