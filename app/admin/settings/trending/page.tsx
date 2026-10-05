"use client";

import { useState, useEffect } from "react";
import { Save, Hash, Plus, Trash2, GripVertical, ShieldAlert, Upload, X, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings, TrendingTopic } from "@/models/Settings";
import Image from "next/image";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Trending Topic Component
function SortableTrendingItem({
    topic,
    index,
    onUpdate,
    onUpdateImage,
    onRemove,
}: {
    topic: TrendingTopic;
    index: number;
    onUpdate: (index: number, tag: string) => void;
    onUpdateImage: (index: number, imageUrl: string) => void;
    onRemove: (index: number) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `trend-${index}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            console.log("Upload response:", data);
            if (data.success && data.data?.url) {
                console.log("Setting image URL:", data.data.url);
                onUpdateImage(index, data.data.url);
            } else {
                console.error("Upload failed:", data.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = "";
        }
    };

    const handleRemoveImage = () => {
        onUpdateImage(index, "");
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                <GripVertical className="text-slate-500 hover:text-slate-300" size={16} />
            </button>
            
            {/* Image Upload */}
            <div className="flex-shrink-0">
                {topic.imageUrl ? (
                    <div className="relative group">
                        <Image
                            src={topic.imageUrl}
                            alt={topic.tag}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded-full border-2 border-slate-500"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <label className="cursor-pointer">
                        <div className="w-10 h-10 bg-slate-600 hover:bg-slate-500 border-2 border-dashed border-slate-500 rounded-full flex items-center justify-center transition">
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ImageIcon size={16} className="text-slate-400" />
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            <input
                type="text"
                placeholder="#hashtag"
                value={topic.tag}
                onChange={(e) => onUpdate(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={() => onRemove(index)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition flex-shrink-0"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export default function TrendingSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [popularTags, setPopularTags] = useState<{ tag: string; count: number; totalViews?: number }[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Check user access and fetch settings
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (!data.user) { router.push("/login"); return; }

                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;

                if (isAdmin || canManageSettings) {
                    setHasAccess(true);
                    fetchSettings();
                } else {
                    setHasAccess(false);
                }
            } catch (error) { setHasAccess(false); }
        };
        checkAccess();
    }, [router]);

    const fetchSettings = () => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    console.log("Admin: Fetched trending data:", data.data.trending);
                    setSettings(data.data);
                }
            })
            .finally(() => setLoading(false));
    };

    const fetchPopularTags = () => {
        setLoadingTags(true);
        // sort=views&period=week → tags from most-viewed posts published this week
        fetch("/api/tags?sort=views&limit=30&period=week")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setPopularTags(data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingTags(false));
    };

    const addTagFromSuggestion = (tag: string) => {
        if (!settings) return;
        // Check if already in trending
        const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
        const alreadyExists = settings.trending.some(
            (t) => t.tag.toLowerCase() === cleanTag.toLowerCase() || t.tag.toLowerCase() === tag.toLowerCase()
        );
        if (alreadyExists) return;
        const newTopic: TrendingTopic = { tag: cleanTag, order: settings.trending.length };
        setSettings({ ...settings, trending: [...settings.trending, newTopic] });
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);
        
        console.log("Saving settings with trending:", settings.trending);
        
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const result = await res.json();
            console.log("Save response:", result);
            if (result.success) setMessage({ type: "success", text: "Trending topics saved!" });
            else setMessage({ type: "error", text: "Failed to save" });
        } catch (error) { 
            console.error("Save error:", error);
            setMessage({ type: "error", text: "Failed to save" }); 
        }
        finally { setSaving(false); }
    };

    // Handlers
    const addTrendingTopic = () => {
        if (!settings) return;
        const newTopic: TrendingTopic = { tag: "#", order: settings.trending.length };
        setSettings({ ...settings, trending: [...settings.trending, newTopic] });
    };

    const updateTrendingTopic = (index: number, tag: string) => {
        if (!settings) return;
        const updated = [...settings.trending];
        updated[index] = { ...updated[index], tag };
        setSettings({ ...settings, trending: updated });
    };

    const updateTrendingImage = (index: number, imageUrl: string) => {
        if (!settings) return;
        console.log("Updating trending image at index", index, "with URL:", imageUrl);
        const updated = [...settings.trending];
        updated[index] = { ...updated[index], imageUrl };
        console.log("Updated trending array:", updated);
        setSettings({ ...settings, trending: updated });
    };

    const removeTrendingTopic = (index: number) => {
        if (!settings) return;
        const updated = settings.trending.filter((_, i) => i !== index);
        setSettings({ ...settings, trending: updated.map((item, i) => ({ ...item, order: i })) });
    };

    const handleTrendingDragEnd = (event: DragEndEvent) => {
        if (!settings) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = parseInt(String(active.id).split("-")[1]);
        const newIndex = parseInt(String(over.id).split("-")[1]);

        const reordered = arrayMove(settings.trending, oldIndex, newIndex);
        setSettings({ ...settings, trending: reordered.map((item, i) => ({ ...item, order: i })) });
    };

    if (hasAccess === null || loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (hasAccess === false) return <div className="text-center p-8 text-white">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Hash className="text-orange-400" />
                        Trending Topics
                    </h1>
                    <p className="text-slate-400 mt-1">Manage trending hashtags displayed below the header</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (<div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{message.text}</div>)}

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Hash size={20} className="text-orange-400" />
                        Topics
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (!settings) return;
                                if (confirm("सबै trending topics हटाउने? (Header मा post tags auto-show हुनेछ)")) {
                                    setSettings({ ...settings, trending: [] });
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-700/60 hover:bg-red-700 text-red-200 hover:text-white rounded-lg transition text-sm"
                            title="Clear all — header will auto-show popular post tags"
                        >
                            <Trash2 size={16} /> Clear All
                        </button>
                        <button onClick={addTrendingTopic} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
                            <Plus size={16} /> Add Topic
                        </button>
                    </div>
                </div>

                <p className="text-slate-400 text-xs mb-4">
                    Use <span className="text-orange-300 font-mono">#tag</span> format for hashtag pages (e.g. <span className="font-mono text-orange-300">#नेप्से</span>), or plain text for search phrases (e.g. <span className="font-mono text-blue-300">त्रिभुवन विमानस्थल</span>).
                </p>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTrendingDragEnd}>
                    <SortableContext items={settings.trending.map((_, i) => `trend-${i}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {settings.trending.map((topic, index) => (
                                <SortableTrendingItem
                                    key={`trend-${index}`}
                                    topic={topic}
                                    index={index}
                                    onUpdate={updateTrendingTopic}
                                    onUpdateImage={updateTrendingImage}
                                    onRemove={removeTrendingTopic}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Popular Post Tags Suggestions */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Hash size={20} className="text-blue-400" />
                            Popular Post Tags
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Click any tag to add it to trending. Sorted by most viewed posts.</p>
                    </div>
                    <button
                        onClick={fetchPopularTags}
                        disabled={loadingTags}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition text-sm disabled:opacity-50"
                    >
                        {loadingTags ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Plus size={16} />
                        )}
                        {loadingTags ? "Loading..." : "Load Suggestions"}
                    </button>
                </div>

                {popularTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {popularTags.map((t, i) => {
                            const tagName = t.tag.startsWith('#') ? t.tag.substring(1) : t.tag;
                            const cleanTag = `#${tagName}`;
                            const alreadyAdded = settings.trending.some(
                                (tr) => tr.tag.toLowerCase() === cleanTag.toLowerCase() || tr.tag.toLowerCase() === t.tag.toLowerCase()
                            );
                            return (
                                <button
                                    key={i}
                                    onClick={() => addTagFromSuggestion(tagName)}
                                    disabled={alreadyAdded}
                                    title={alreadyAdded ? "Already in trending" : `Add "${cleanTag}" to trending`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                                        alreadyAdded
                                            ? "bg-green-900/40 text-green-400 border border-green-700 cursor-not-allowed"
                                            : "bg-slate-700 hover:bg-blue-600 text-slate-200 border border-slate-600 hover:border-blue-500 cursor-pointer"
                                    }`}
                                >
                                    <span>{cleanTag}</span>
                                    <span className="text-xs opacity-60">
                                        {t.totalViews ? `👁 ${t.totalViews.toLocaleString()}` : `${t.count} posts`}
                                    </span>
                                    {alreadyAdded ? (
                                        <span className="text-green-400 text-xs">✓</span>
                                    ) : (
                                        <Plus size={12} className="opacity-70" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {popularTags.length === 0 && !loadingTags && (
                    <p className="text-slate-500 text-sm text-center py-4">
                        Click &quot;Load Suggestions&quot; to see popular tags from your posts.
                    </p>
                )}
            </div>
        </div>
    );
}
