"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Plus,
    Trash2,
    Edit2,
    Eye,
    EyeOff,
    Star,
    StarOff,
    Image as ImageIcon,
    Film,
    Layers,
    GripVertical,
    X,
    Upload,
    ChevronUp,
    ChevronDown,
    Save,
    ArrowLeft,
    Play
} from "lucide-react";
import { WebStory, StorySlide } from "@/models/WebStory";

interface WebStoryFormData {
    title: string;
    slug: string;
    coverImage: string;
    category: string;
    author: string;
    published: boolean;
    featured: boolean;
    slides: StorySlide[];
}

const defaultSlide: StorySlide = {
    id: "",
    type: "image",
    mediaUrl: "",
    text: "",
    textPosition: "bottom",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    duration: 5,
};

const defaultFormData: WebStoryFormData = {
    title: "",
    slug: "",
    coverImage: "",
    category: "",
    author: "",
    published: false,
    featured: false,
    slides: [],
};

export default function WebStoriesAdminPage() {
    const [stories, setStories] = useState<WebStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<WebStoryFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const slideFileInputRef = useRef<HTMLInputElement>(null);
    const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch("/api/webstories?published=false");
            const data = await res.json();
            if (data.success) {
                setStories(data.data);
            }
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File, callback: (url: string) => void) => {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success && data.data?.url) {
                callback(data.data.url);
            } else {
                setMessage({ type: 'error', text: 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file, (url) => setFormData(prev => ({ ...prev, coverImage: url })));
        }
    };

    const handleSlideMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeSlideIndex !== null) {
            handleUpload(file, (url) => {
                const newSlides = [...formData.slides];
                newSlides[activeSlideIndex].mediaUrl = url;
                // Detect type from file
                newSlides[activeSlideIndex].type = file.type.startsWith('video/') ? 'video' : 'image';
                setFormData(prev => ({ ...prev, slides: newSlides }));
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const url = editingId ? `/api/webstories/${editingId}` : "/api/webstories";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: editingId ? 'Story updated!' : 'Story created!' });
                setShowForm(false);
                setEditingId(null);
                setFormData(defaultFormData);
                fetchStories();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (story: WebStory) => {
        setFormData({
            title: story.title,
            slug: story.slug,
            coverImage: story.coverImage,
            category: story.category || "",
            author: story.author || "",
            published: story.published,
            featured: story.featured,
            slides: story.slides,
        });
        setEditingId(story._id!.toString());
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("के तपाईं यो स्टोरी मेटाउन चाहनुहुन्छ?")) return;

        try {
            const res = await fetch(`/api/webstories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Story deleted!' });
                fetchStories();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete' });
        }
    };

    const togglePublish = async (story: WebStory) => {
        try {
            await fetch(`/api/webstories/${story._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !story.published }),
            });
            fetchStories();
        } catch (error) {
            console.error("Error toggling publish:", error);
        }
    };

    const toggleFeatured = async (story: WebStory) => {
        try {
            await fetch(`/api/webstories/${story._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featured: !story.featured }),
            });
            fetchStories();
        } catch (error) {
            console.error("Error toggling featured:", error);
        }
    };

    // Slide management
    const addSlide = () => {
        const newSlide: StorySlide = {
            ...defaultSlide,
            id: `slide-${Date.now()}`,
        };
        setFormData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
        setActiveSlideIndex(formData.slides.length);
    };

    const removeSlide = (index: number) => {
        setFormData(prev => ({
            ...prev,
            slides: prev.slides.filter((_, i) => i !== index),
        }));
        setActiveSlideIndex(null);
    };

    const updateSlide = (index: number, updates: Partial<StorySlide>) => {
        const newSlides = [...formData.slides];
        newSlides[index] = { ...newSlides[index], ...updates };
        setFormData(prev => ({ ...prev, slides: newSlides }));
    };

    const moveSlide = (index: number, direction: 'up' | 'down') => {
        const newSlides = [...formData.slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSlides.length) return;
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        setFormData(prev => ({ ...prev, slides: newSlides }));
        setActiveSlideIndex(targetIndex);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Layers className="text-purple-400" />
                        वेबस्टोरिज
                    </h1>
                    <p className="text-slate-400 mt-1">Instagram-style web stories व्यवस्थापन</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData(defaultFormData); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition"
                >
                    <Plus size={18} />
                    नयाँ स्टोरी
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-5xl mx-4 border border-slate-700">
                        {/* Form Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'स्टोरी सम्पादन' : 'नयाँ स्टोरी'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Basic Info */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">आधारभूत जानकारी</h3>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">शीर्षक *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Cover Image */}
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">कभर इमेज *</label>
                                        <div className="flex gap-4">
                                            {formData.coverImage ? (
                                                <div className="w-24 h-36 rounded-lg overflow-hidden bg-slate-800 relative group">
                                                    <Image src={formData.coverImage} alt="Cover" width={96} height={144} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                                                    >
                                                        <X className="text-white" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-24 h-36 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-purple-500 hover:text-purple-400 transition"
                                                >
                                                    <Upload size={24} />
                                                    <span className="text-xs mt-1">Upload</span>
                                                </button>
                                            )}
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                                        </div>
                                    </div>

                                    {/* Category & Author */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">श्रेणी</label>
                                            <input
                                                type="text"
                                                value={formData.category}
                                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">लेखक</label>
                                            <input
                                                type="text"
                                                value={formData.author}
                                                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.published}
                                                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                                            />
                                            <span className="text-slate-300">प्रकाशित</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.featured}
                                                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-yellow-500 focus:ring-yellow-500"
                                            />
                                            <span className="text-slate-300">विशेष</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column - Slides */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">स्लाइडहरू ({formData.slides.length})</h3>
                                        <button
                                            type="button"
                                            onClick={addSlide}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition text-sm"
                                        >
                                            <Plus size={16} />
                                            स्लाइड थप्नुहोस्
                                        </button>
                                    </div>

                                    {/* Slides List */}
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {formData.slides.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                                <Layers size={40} className="mx-auto text-slate-600 mb-3" />
                                                <p className="text-slate-500">कुनै स्लाइड छैन</p>
                                                <button
                                                    type="button"
                                                    onClick={addSlide}
                                                    className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                                                >
                                                    + पहिलो स्लाइड थप्नुहोस्
                                                </button>
                                            </div>
                                        ) : (
                                            formData.slides.map((slide, index) => (
                                                <div
                                                    key={slide.id || index}
                                                    className={`p-4 rounded-xl border transition-all ${activeSlideIndex === index
                                                        ? 'bg-purple-900/30 border-purple-500'
                                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Thumbnail */}
                                                        <div
                                                            className="w-16 h-24 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0 cursor-pointer"
                                                            onClick={() => {
                                                                setActiveSlideIndex(index);
                                                                slideFileInputRef.current?.click();
                                                            }}
                                                        >
                                                            {slide.mediaUrl ? (
                                                                slide.type === 'video' ? (
                                                                    <div className="w-full h-full bg-purple-900/50 flex items-center justify-center">
                                                                        <Play className="text-purple-400" size={20} />
                                                                    </div>
                                                                ) : (
                                                                    <Image src={slide.mediaUrl} alt="" width={64} height={96} className="w-full h-full object-cover" />
                                                                )
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                                    <ImageIcon size={20} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Slide Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                                                                    #{index + 1}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${slide.type === 'video' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                    {slide.type === 'video' ? 'Video' : 'Image'}
                                                                </span>
                                                            </div>
                                                            <textarea
                                                                value={slide.text || ""}
                                                                onChange={(e) => updateSlide(index, { text: e.target.value })}
                                                                placeholder="स्लाइड टेक्स्ट..."
                                                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none h-16 focus:border-purple-500 focus:outline-none"
                                                            />
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1">
                                                            <button type="button" onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                                                                <ChevronUp size={16} />
                                                            </button>
                                                            <button type="button" onClick={() => moveSlide(index, 'down')} disabled={index === formData.slides.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                                                                <ChevronDown size={16} />
                                                            </button>
                                                            <button type="button" onClick={() => removeSlide(index)} className="p-1 text-red-500 hover:text-red-400">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <input ref={slideFileInputRef} type="file" accept="image/*,video/*" onChange={handleSlideMediaUpload} className="hidden" />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition"
                                >
                                    रद्द गर्नुहोस्
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !formData.title || !formData.coverImage || formData.slides.length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {saving ? 'सुरक्षित गर्दै...' : 'सुरक्षित गर्नुहोस्'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stories Grid */}
            {stories.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700">
                    <Layers size={60} className="mx-auto text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">कुनै स्टोरी छैन</h2>
                    <p className="text-slate-400 mb-4">पहिलो वेब स्टोरी बनाउन सुरु गर्नुहोस्</p>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData(defaultFormData); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus size={18} />
                        नयाँ स्टोरी बनाउनुहोस्
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {stories.map((story) => (
                        <div
                            key={story._id!.toString()}
                            className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all"
                        >
                            {/* Cover Image */}
                            <div className="aspect-[3/4] relative">
                                <Image
                                    src={story.coverImage}
                                    alt={story.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* Status Badges */}
                                <div className="absolute top-2 left-2 flex gap-1">
                                    {!story.published && (
                                        <span className="px-2 py-0.5 bg-yellow-500/80 text-yellow-900 text-xs font-medium rounded">
                                            Draft
                                        </span>
                                    )}
                                    {story.featured && (
                                        <span className="px-2 py-0.5 bg-purple-500/80 text-white text-xs font-medium rounded flex items-center gap-1">
                                            <Star size={10} /> Featured
                                        </span>
                                    )}
                                </div>

                                {/* Slide Count */}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                                    {story.slides.length} SLIDES
                                </div>

                                {/* Title */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white font-semibold line-clamp-2 text-sm">
                                        {story.title}
                                    </h3>
                                    {story.category && (
                                        <span className="text-purple-400 text-xs">{story.category}</span>
                                    )}
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleEdit(story)}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => togglePublish(story)}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
                                        title={story.published ? 'Unpublish' : 'Publish'}
                                    >
                                        {story.published ? (
                                            <EyeOff size={18} className="text-white" />
                                        ) : (
                                            <Eye size={18} className="text-white" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => toggleFeatured(story)}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
                                        title={story.featured ? 'Unfeature' : 'Feature'}
                                    >
                                        {story.featured ? (
                                            <StarOff size={18} className="text-yellow-400" />
                                        ) : (
                                            <Star size={18} className="text-white" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(story._id!.toString())}
                                        className="p-2 bg-red-500/50 backdrop-blur-sm rounded-full hover:bg-red-500/70 transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} className="text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
