"use client";

import { useEffect, useState } from "react";
import {
    Plus, Trash2, Edit, Eye, EyeOff, Star, User, Award, Film, Play,
    Facebook, Twitter, Instagram, Youtube, Globe
} from "lucide-react";
import ImageUploadWithBrowser from "@/components/ImageUploadWithBrowser";

interface SocialLinks {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
}

interface FilmEntry {
    title: string;
    year?: string;
    role?: string;
}

interface VideoEntry {
    youtubeId: string;
    title?: string;
}

interface Celebrity {
    _id: string;
    name: string;
    slug: string;
    title: string;
    bio: string;
    shortBio?: string;
    imageUrl: string;
    coverImageUrl?: string;
    category: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    knownFor?: string[];
    awards?: string[];
    filmography?: FilmEntry[];
    videos?: VideoEntry[];
    socialLinks?: SocialLinks;
    isFeatured: boolean;
    isPublished: boolean;
    order: number;
    viewCount: number;
}

const CATEGORIES = [
    { value: "actor", label: "अभिनेता/अभिनेत्री (Actor)" },
    { value: "singer", label: "गायक/गायिका (Singer)" },
    { value: "musician", label: "संगीतकार (Musician)" },
    { value: "politician", label: "राजनीतिज्ञ (Politician)" },
    { value: "sports", label: "खेलाडी (Sports)" },
    { value: "writer", label: "लेखक (Writer)" },
    { value: "business", label: "व्यापारी (Business)" },
    { value: "social", label: "सामाजिक व्यक्तित्व (Social)" },
    { value: "other", label: "अन्य (Other)" },
];

export default function CelebritiesPage() {
    const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Celebrity>>({
        name: "",
        title: "",
        bio: "",
        shortBio: "",
        imageUrl: "",
        coverImageUrl: "",
        category: "actor",
        birthDate: "",
        birthPlace: "",
        nationality: "नेपाली",
        knownFor: [],
        awards: [],
        filmography: [],
        videos: [],
        socialLinks: {
            facebook: "",
            twitter: "",
            instagram: "",
            youtube: "",
            website: "",
        },
        isFeatured: false,
        isPublished: true,
        order: 0,
    });

    const [knownForInput, setKnownForInput] = useState("");
    const [awardInput, setAwardInput] = useState("");
    const [filmInput, setFilmInput] = useState({ title: "", year: "", role: "" });
    const [videoInput, setVideoInput] = useState({ youtubeId: "", title: "" });

    useEffect(() => {
        fetchCelebrities();
    }, []);

    const fetchCelebrities = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/celebrities");
            if (res.ok) {
                const data = await res.json();
                setCelebrities(data);
            }
        } catch (error) {
            console.error("Failed to fetch celebrities:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingId ? `/api/celebrities/${editingId}` : "/api/celebrities";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchCelebrities();
                setShowForm(false);
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save celebrity");
            }
        } catch (error) {
            console.error("Error saving celebrity:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("के तपाईं यो सेलिब्रिटी हटाउन चाहनुहुन्छ?")) return;

        try {
            const res = await fetch(`/api/celebrities/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCelebrities(celebrities.filter(c => c._id !== id));
            }
        } catch (error) {
            console.error("Error deleting celebrity:", error);
        }
    };

    const handleEdit = (celebrity: Celebrity) => {
        setFormData({
            ...celebrity,
            birthDate: celebrity.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : "",
        });
        setEditingId(celebrity._id);
        setShowForm(true);
    };

    const handleToggleStatus = async (id: string, action: "toggleFeatured" | "togglePublished") => {
        try {
            const res = await fetch(`/api/celebrities/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                const updatedCelebrity = await res.json();
                setCelebrities(celebrities.map(c => c._id === id ? updatedCelebrity : c));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            title: "",
            bio: "",
            shortBio: "",
            imageUrl: "",
            coverImageUrl: "",
            category: "actor",
            birthDate: "",
            birthPlace: "",
            nationality: "नेपाली",
            knownFor: [],
            awards: [],
            filmography: [],
            videos: [],
            socialLinks: {
                facebook: "",
                twitter: "",
                instagram: "",
                youtube: "",
                website: "",
            },
            isFeatured: false,
            isPublished: true,
            order: 0,
        });
        setEditingId(null);
        setKnownForInput("");
        setAwardInput("");
        setFilmInput({ title: "", year: "", role: "" });
        setVideoInput({ youtubeId: "", title: "" });
    };

    const handleAddKnownFor = () => {
        if (knownForInput.trim() && !formData.knownFor?.includes(knownForInput.trim())) {
            setFormData({
                ...formData,
                knownFor: [...(formData.knownFor || []), knownForInput.trim()]
            });
            setKnownForInput("");
        }
    };

    const handleRemoveKnownFor = (item: string) => {
        setFormData({
            ...formData,
            knownFor: formData.knownFor?.filter(k => k !== item)
        });
    };

    const handleAddAward = () => {
        if (awardInput.trim() && !formData.awards?.includes(awardInput.trim())) {
            setFormData({
                ...formData,
                awards: [...(formData.awards || []), awardInput.trim()]
            });
            setAwardInput("");
        }
    };

    const handleRemoveAward = (item: string) => {
        setFormData({
            ...formData,
            awards: formData.awards?.filter(a => a !== item)
        });
    };

    const handleAddFilm = () => {
        if (filmInput.title.trim()) {
            setFormData({
                ...formData,
                filmography: [...(formData.filmography || []), {
                    title: filmInput.title.trim(),
                    year: filmInput.year.trim() || undefined,
                    role: filmInput.role.trim() || undefined
                }]
            });
            setFilmInput({ title: "", year: "", role: "" });
        }
    };

    const handleRemoveFilm = (index: number) => {
        setFormData({
            ...formData,
            filmography: formData.filmography?.filter((_, i) => i !== index)
        });
    };

    const handleAddVideo = () => {
        if (videoInput.youtubeId.trim()) {
            // Extract video ID from URL if full URL is pasted
            let videoId = videoInput.youtubeId.trim();
            const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = videoId.match(youtubeRegex);
            if (match) {
                videoId = match[1];
            }

            setFormData({
                ...formData,
                videos: [...(formData.videos || []), {
                    youtubeId: videoId,
                    title: videoInput.title.trim() || undefined
                }]
            });
            setVideoInput({ youtubeId: "", title: "" });
        }
    };

    const handleRemoveVideo = (index: number) => {
        setFormData({
            ...formData,
            videos: formData.videos?.filter((_, i) => i !== index)
        });
    };

    if (showForm) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">
                        {editingId ? "सेलिब्रिटी सम्पादन" : "नयाँ सेलिब्रिटी थप्नुहोस्"}
                    </h1>
                    <button
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        रद्द गर्नुहोस्
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Details */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">आधारभूत जानकारी</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">नाम *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="सेलिब्रिटीको नाम"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">पद/उपाधि *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="जस्तै: अभिनेता, गायिका"
                                        />
                                    </div>
                                </div>

                                {/* Slug - only show when editing */}
                                {editingId && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">
                                            Slug (URL)
                                            <span className="text-xs text-slate-500 ml-2">- URL मा प्रयोग हुने नाम</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">/wiki/</span>
                                            <input
                                                type="text"
                                                value={formData.slug || ""}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                                placeholder="rajesh-hamal"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            केवल lowercase अक्षर, संख्या र dash (-) प्रयोग गर्नुहोस्
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">वर्ग</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">क्रम</label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">छोटो परिचय</label>
                                    <textarea
                                        rows={2}
                                        value={formData.shortBio}
                                        onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="कार्डमा देखिने छोटो परिचय..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">पूर्ण जीवनी *</label>
                                    <textarea
                                        rows={6}
                                        required
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="विस्तृत जीवनी..."
                                    />
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">व्यक्तिगत विवरण</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">जन्म मिति</label>
                                        <input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">जन्मस्थान</label>
                                        <input
                                            type="text"
                                            value={formData.birthPlace}
                                            onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="जस्तै: काठमाडौं"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">राष्ट्रियता</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="नेपाली"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Known For & Awards */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">उल्लेखनीय कार्य र पुरस्कार</h3>

                                {/* Known For */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">चिनिएको कारण</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={knownForInput}
                                            onChange={(e) => setKnownForInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKnownFor())}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="जस्तै: छक्का पन्जा"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddKnownFor}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            थप्नुहोस्
                                        </button>
                                    </div>
                                    {formData.knownFor && formData.knownFor.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.knownFor.map((item, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-700 text-white text-sm rounded-full flex items-center gap-2">
                                                    {item}
                                                    <button type="button" onClick={() => handleRemoveKnownFor(item)} className="text-slate-400 hover:text-red-400">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Awards */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">पुरस्कार</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={awardInput}
                                            onChange={(e) => setAwardInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAward())}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="जस्तै: राष्ट्रिय चलचित्र पुरस्कार"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddAward}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            थप्नुहोस्
                                        </button>
                                    </div>
                                    {formData.awards && formData.awards.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.awards.map((item, i) => (
                                                <span key={i} className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-sm rounded-full flex items-center gap-2">
                                                    <Award size={12} />
                                                    {item}
                                                    <button type="button" onClick={() => handleRemoveAward(item)} className="text-yellow-400 hover:text-red-400">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filmography */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Film size={20} className="text-indigo-400" /> फिल्मोग्राफी
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <input
                                        type="text"
                                        value={filmInput.title}
                                        onChange={(e) => setFilmInput({ ...filmInput, title: e.target.value })}
                                        className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="फिल्मको नाम *"
                                    />
                                    <input
                                        type="text"
                                        value={filmInput.year}
                                        onChange={(e) => setFilmInput({ ...filmInput, year: e.target.value })}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="वर्ष (जस्तै: 2023)"
                                    />
                                    <input
                                        type="text"
                                        value={filmInput.role}
                                        onChange={(e) => setFilmInput({ ...filmInput, role: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFilm())}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="भूमिका (जस्तै: मुख्य)"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddFilm}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    फिल्म थप्नुहोस्
                                </button>

                                {formData.filmography && formData.filmography.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        {formData.filmography.map((film, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Film size={16} className="text-indigo-400" />
                                                    <div>
                                                        <span className="text-white font-medium">{film.title}</span>
                                                        {film.year && <span className="text-slate-400 ml-2">({film.year})</span>}
                                                        {film.role && <span className="text-indigo-400 text-sm ml-2">• {film.role}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFilm(i)}
                                                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* YouTube Videos */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Play size={20} className="text-red-400" /> YouTube भिडियोहरू
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={videoInput.youtubeId}
                                        onChange={(e) => setVideoInput({ ...videoInput, youtubeId: e.target.value })}
                                        className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="YouTube URL वा Video ID *"
                                    />
                                    <input
                                        type="text"
                                        value={videoInput.title}
                                        onChange={(e) => setVideoInput({ ...videoInput, title: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVideo())}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="भिडियो शीर्षक (वैकल्पिक)"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    YouTube URL (जस्तै: https://youtube.com/watch?v=xxxxx) वा Video ID पेस्ट गर्नुहोस्
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddVideo}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    भिडियो थप्नुहोस्
                                </button>

                                {formData.videos && formData.videos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {formData.videos.map((video, i) => (
                                            <div key={i} className="relative bg-slate-800 rounded-lg overflow-hidden">
                                                <div className="aspect-video">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                                        title={video.title || `Video ${i + 1}`}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <div className="p-2 flex items-center justify-between">
                                                    <span className="text-sm text-white truncate">{video.title || video.youtubeId}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVideo(i)}
                                                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Social Links */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">सामाजिक सञ्जाल</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                            <Facebook size={14} className="text-blue-500" /> Facebook
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.socialLinks?.facebook || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                            <Twitter size={14} className="text-sky-400" /> Twitter
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.socialLinks?.twitter || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="https://twitter.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                            <Instagram size={14} className="text-pink-500" /> Instagram
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.socialLinks?.instagram || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                            <Youtube size={14} className="text-red-500" /> YouTube
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.socialLinks?.youtube || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                            <Globe size={14} className="text-green-500" /> Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.socialLinks?.website || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, website: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Profile Image */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">प्रोफाइल फोटो *</h3>
                                <div className="aspect-square bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative group">
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <User size={48} />
                                            <p className="text-sm mt-2">फोटो छान्नुहोस्</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <ImageUploadWithBrowser
                                        value={formData.imageUrl}
                                        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                        onRemove={() => setFormData({ ...formData, imageUrl: "" })}
                                    />
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">कभर फोटो</h3>
                                <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative group">
                                    {formData.coverImageUrl ? (
                                        <>
                                            <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, coverImageUrl: "" })}
                                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <p className="text-sm">कभर फोटो (वैकल्पिक)</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <ImageUploadWithBrowser
                                        value={formData.coverImageUrl}
                                        onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                                        onRemove={() => setFormData({ ...formData, coverImageUrl: "" })}
                                    />
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-400">प्रकाशित</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.isPublished ? "bg-green-500" : "bg-slate-700"
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isPublished ? "translate-x-6" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-400">विशेष</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.isFeatured ? "bg-yellow-500" : "bg-slate-700"
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isFeatured ? "translate-x-6" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                            >
                                {editingId ? "अपडेट गर्नुहोस्" : "सेलिब्रिटी थप्नुहोस्"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-2">
                            सेलिब्रिटी व्यवस्थापन
                        </h1>
                        <p className="text-slate-400">सेलिब्रिटी जीवनी थप्नुहोस् र व्यवस्थापन गर्नुहोस्</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                    >
                        <Plus size={20} />
                        नयाँ सेलिब्रिटी थप्नुहोस्
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-3xl font-bold text-white">{celebrities.length}</div>
                        <div className="text-sm text-slate-400">कुल सेलिब्रिटी</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-3xl font-bold text-green-400">{celebrities.filter(c => c.isPublished).length}</div>
                        <div className="text-sm text-slate-400">प्रकाशित</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-3xl font-bold text-yellow-400">{celebrities.filter(c => c.isFeatured).length}</div>
                        <div className="text-sm text-slate-400">विशेष</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-3xl font-bold text-purple-400">{celebrities.reduce((sum, c) => sum + (c.viewCount || 0), 0).toLocaleString()}</div>
                        <div className="text-sm text-slate-400">कुल हेराइ</div>
                    </div>
                </div>
            </div>

            {/* Celebrities List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : celebrities.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center backdrop-blur-sm">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <User size={40} className="text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">कुनै सेलिब्रिटी छैन</h3>
                    <p className="text-slate-400 mb-6">पहिलो सेलिब्रिटी थपेर सुरु गर्नुहोस्।</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
                    >
                        सेलिब्रिटी थप्नुहोस्
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {celebrities.map((celebrity) => (
                        <div
                            key={celebrity._id}
                            className="group bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm"
                        >
                            {/* Card Image */}
                            <div className="relative aspect-[4/5] bg-slate-800">
                                {celebrity.imageUrl ? (
                                    <img
                                        src={celebrity.imageUrl}
                                        alt={celebrity.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                        <User size={64} className="text-slate-600" />
                                    </div>
                                )}

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                {/* Top badges */}
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                    <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-medium">
                                        {CATEGORIES.find(c => c.value === celebrity.category)?.label.split('(')[0]}
                                    </span>
                                    {celebrity.isFeatured && (
                                        <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/80 to-amber-500/80 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                                            <Star size={12} fill="currentColor" /> विशेष
                                        </div>
                                    )}
                                </div>

                                {/* Bottom info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 drop-shadow-lg">
                                        {celebrity.name}
                                    </h3>
                                    <p className="text-sm text-white/80">{celebrity.title}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                                        <span className="flex items-center gap-1">
                                            <Eye size={12} /> {(celebrity.viewCount || 0).toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${celebrity.isPublished
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                            {celebrity.isPublished ? 'प्रकाशित' : 'ड्राफ्ट'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-3 flex items-center justify-between bg-slate-900/50 border-t border-slate-700/50">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggleStatus(celebrity._id, "togglePublished")}
                                        className={`p-2.5 rounded-xl transition-all ${celebrity.isPublished
                                                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                : "bg-slate-700/50 text-slate-500 hover:bg-slate-700"
                                            }`}
                                        title={celebrity.isPublished ? "प्रकाशित" : "अप्रकाशित"}
                                    >
                                        {celebrity.isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(celebrity._id, "toggleFeatured")}
                                        className={`p-2.5 rounded-xl transition-all ${celebrity.isFeatured
                                                ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                                : "bg-slate-700/50 text-slate-500 hover:bg-slate-700"
                                            }`}
                                        title="विशेष"
                                    >
                                        <Star size={18} fill={celebrity.isFeatured ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(celebrity)}
                                        className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"
                                        title="सम्पादन"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(celebrity._id)}
                                        className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                                        title="हटाउनुहोस्"
                                    >
                                        <Trash2 size={18} />
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
