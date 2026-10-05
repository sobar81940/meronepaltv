"use client";

import { useEffect, useState, useRef } from "react";
import {
    Trash2, Edit, X, Upload, Image as ImageIcon,
    Video, Search, Play, Eye, Youtube, Link2, FolderOpen,
    CheckSquare, Square, Tag, XCircle
} from "lucide-react";
import Image from "next/image";

interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface GalleryItem {
    _id: string;
    title: string;
    description?: string;
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    category?: string;
    tags: string[];
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    videoSource?: "upload" | "youtube";
    youtubeId?: string;
    isPublished?: boolean;
    showOnHome?: boolean;
    createdAt: string;
}

type ActiveTab = "images" | "videos";

export default function GalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("images");

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showYoutubeModal, setShowYoutubeModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // State
    const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // Multi-select state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
    const [bulkCategory, setBulkCategory] = useState("");
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // Upload form
    const [uploadForm, setUploadForm] = useState({
        title: "",
        category: "",
        tags: "",
        isPublished: true,
        showOnHome: true,
    });

    // YouTube form
    const [youtubeForm, setYoutubeForm] = useState({
        youtubeUrl: "",
        title: "",
        description: "",
        category: "",
        tags: "",
    });
    const [youtubeError, setYoutubeError] = useState("");

    // Edit form
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        category: "",
        tags: "",
        isPublished: true,
        showOnHome: true,
    });

    const fetchItems = async () => {
        try {
            const typeParam = `&type=${activeTab === "images" ? "image" : "video"}`;
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
            // admin=true so the admin panel sees drafts/unpublished and all items.
            const res = await fetch(`/api/gallery?limit=50&admin=true${typeParam}${searchParam}`);
            const data = await res.json();
            if (data.success) setItems(data.data);
        } catch (error) {
            console.error("Failed to fetch gallery:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchItems();
    }, [activeTab, searchQuery]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                if (data.success) setCategories(data.data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Handle file upload (images only now)
    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const totalFiles = files.length;
        let uploaded = 0;

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", uploadForm.title || file.name.replace(/\.[^/.]+$/, ""));
            if (uploadForm.category) formData.append("category", uploadForm.category);
            if (uploadForm.tags) formData.append("tags", uploadForm.tags);
            formData.append("isPublished", String(uploadForm.isPublished));
            formData.append("showOnHome", String(uploadForm.showOnHome));

            try {
                const res = await fetch("/api/gallery", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    uploaded++;
                    setUploadProgress(Math.round((uploaded / totalFiles) * 100));
                }
            } catch (error) {
                console.error("Upload failed:", error);
            }
        }

        setUploading(false);
        setUploadProgress(0);
        setShowUploadModal(false);
        setUploadForm({ title: "", category: "", tags: "", isPublished: true, showOnHome: true });
        fetchItems();
    };

    // Handle YouTube video submission
    const handleYoutubeSubmit = async () => {
        if (!youtubeForm.youtubeUrl) {
            setYoutubeError("Please enter a YouTube URL");
            return;
        }

        setYoutubeError("");
        setUploading(true);

        try {
            const res = await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeUrl: youtubeForm.youtubeUrl,
                    title: youtubeForm.title,
                    description: youtubeForm.description,
                    category: youtubeForm.category,
                    tags: youtubeForm.tags,
                    isPublished: true,
                    showOnHome: true,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setShowYoutubeModal(false);
                setYoutubeForm({ youtubeUrl: "", title: "", description: "", category: "", tags: "" });
                setActiveTab("videos");
                fetchItems();
            } else {
                setYoutubeError(data.error || "Failed to add video");
            }
        } catch (error) {
            setYoutubeError("Failed to add video");
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (item: GalleryItem) => {
        setEditingItem(item);
        setEditForm({
            title: item.title,
            description: item.description || "",
            category: item.category || "",
            tags: item.tags.join(", "),
            isPublished: item.isPublished ?? true,
            showOnHome: item.showOnHome ?? true,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            const res = await fetch(`/api/gallery/${editingItem._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editForm,
                    tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
                    isPublished: editForm.isPublished,
                    showOnHome: editForm.showOnHome,
                }),
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditingItem(null);
                fetchItems();
            }
        } catch (error) {
            console.error("Failed to update:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this media item? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
            if (res.ok) {
                setItems(items.filter(item => item._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const handlePreview = (item: GalleryItem) => {
        setPreviewItem(item);
        setShowPreviewModal(true);
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Multi-select functions
    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedItems(new Set());
    };

    const toggleItemSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const selectAll = () => {
        setSelectedItems(new Set(items.map(item => item._id)));
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
    };

    const handleBulkCategoryUpdate = async () => {
        if (selectedItems.size === 0) return;

        setBulkUpdating(true);
        try {
            const res = await fetch("/api/gallery", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: Array.from(selectedItems),
                    updates: { category: bulkCategory || undefined },
                }),
            });

            const data = await res.json();
            if (data.success) {
                setShowBulkCategoryModal(false);
                setBulkCategory("");
                setSelectedItems(new Set());
                setSelectMode(false);
                fetchItems();
            }
        } catch (error) {
            console.error("Bulk update failed:", error);
        } finally {
            setBulkUpdating(false);
        }
    };

    const imageCount = items.filter(i => i.type === "image").length;
    const videoCount = items.filter(i => i.type === "video").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Media Gallery</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your images and videos
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Select Mode Toggle */}
                    <button
                        onClick={toggleSelectMode}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectMode
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            }`}
                    >
                        {selectMode ? <XCircle size={20} /> : <CheckSquare size={20} />}
                        {selectMode ? "Cancel" : "Select"}
                    </button>

                    {activeTab === "images" ? (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            <Upload size={20} />
                            Upload Images
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowYoutubeModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                            <Youtube size={20} />
                            Add YouTube Video
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar - Shows when items are selected */}
            {selectMode && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-purple-600/20 border border-purple-500/50 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-300">
                        <CheckSquare size={20} />
                        <span className="font-medium">
                            {selectedItems.size} {selectedItems.size === 1 ? "item" : "items"} selected
                        </span>
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                        <button
                            onClick={selectAll}
                            className="px-3 py-1.5 text-sm bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition"
                        >
                            Select All ({items.length})
                        </button>
                        {selectedItems.size > 0 && (
                            <button
                                onClick={clearSelection}
                                className="px-3 py-1.5 text-sm text-purple-300 hover:text-white transition"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {selectedItems.size > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkCategoryModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                            >
                                <Tag size={18} />
                                Set Category
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-slate-700">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab("images")}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 -mb-px ${activeTab === "images"
                            ? "text-blue-400 border-blue-400"
                            : "text-slate-400 border-transparent hover:text-white"
                            }`}
                    >
                        <ImageIcon size={20} />
                        Images
                        <span className="ml-1 px-2 py-0.5 text-xs bg-slate-700 rounded-full">
                            {activeTab === "images" ? items.length : "—"}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("videos")}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 -mb-px ${activeTab === "videos"
                            ? "text-purple-400 border-purple-400"
                            : "text-slate-400 border-transparent hover:text-white"
                            }`}
                    >
                        <Video size={20} />
                        Videos
                        <span className="ml-1 px-2 py-0.5 text-xs bg-slate-700 rounded-full">
                            {activeTab === "videos" ? items.length : "—"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {loading ? (
                    <div className="col-span-full text-center text-slate-400 py-12">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="col-span-full text-center text-slate-400 py-12">
                        <div className="flex flex-col items-center gap-4">
                            {activeTab === "images" ? (
                                <>
                                    <ImageIcon size={48} className="opacity-50" />
                                    <p>No images yet</p>
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                                    >
                                        Upload your first image
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Video size={48} className="opacity-50" />
                                    <p>No videos yet</p>
                                    <button
                                        onClick={() => setShowYoutubeModal(true)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                                    >
                                        Add your first YouTube video
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item._id}
                            onClick={() => selectMode && toggleItemSelection(item._id)}
                            className={`group relative bg-slate-800 rounded-xl overflow-hidden border transition ${selectMode
                                ? "cursor-pointer " + (selectedItems.has(item._id)
                                    ? "border-purple-500 ring-2 ring-purple-500/50"
                                    : "border-slate-700 hover:border-purple-400")
                                : "border-slate-700 hover:border-slate-600"
                                }`}
                        >
                            {/* Selection Checkbox - Shows in select mode */}
                            {selectMode && (
                                <div className="absolute top-2 left-2 z-20">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition ${selectedItems.has(item._id)
                                        ? "bg-purple-600 text-white"
                                        : "bg-black/50 text-white/70 hover:bg-black/70"
                                        }`}>
                                        {selectedItems.has(item._id) ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Thumbnail */}
                            <div className="aspect-square relative">
                                {item.type === "video" ? (
                                    <>
                                        {item.thumbnailUrl ? (
                                            <Image
                                                src={item.thumbnailUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                unoptimized={item.videoSource === "youtube"}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                                <Video size={32} className="text-slate-500" />
                                            </div>
                                        )}
                                        {/* Video indicators */}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded text-xs text-white">
                                            {item.videoSource === "youtube" ? (
                                                <Youtube size={12} className="text-red-500" />
                                            ) : (
                                                <Play size={12} />
                                            )}
                                            {item.videoSource === "youtube" ? "YouTube" : formatDuration(item.duration)}
                                        </div>
                                    </>
                                ) : (
                                    <Image
                                        src={item.url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}

                                {/* Overlay with actions - Only show when NOT in select mode */}
                                {!selectMode && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handlePreview(item)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-full text-white transition"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}

                                {/* Type badge */}
                                {item.videoSource === "youtube" && (
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-red-600/90 text-white flex items-center gap-1">
                                        <Youtube size={12} />
                                    </div>
                                )}

                                {/* Category badge - shows if category exists */}
                                {item.category && (
                                    <div className={`absolute ${item.videoSource === "youtube" ? "top-9" : "top-2"} right-2 px-2 py-1 rounded text-xs font-medium bg-green-600/90 text-white`}>
                                        {item.category}
                                    </div>
                                )}

                                {/* Draft badge - shows when item is not published */}
                                {item.isPublished === false && (
                                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium bg-amber-500/90 text-black">
                                        Draft
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h3 className="text-white font-medium text-sm truncate">{item.title}</h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    {item.videoSource === "youtube" ? "YouTube Video" : formatFileSize(item.size)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Image Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Upload Images</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-slate-400 hover:text-white"
                                disabled={uploading}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Category and Title Fields */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FolderOpen size={14} className="inline mr-1" />
                                    Category
                                </label>
                                <select
                                    value={uploadForm.category}
                                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.tags}
                                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                    placeholder="tag1, tag2..."
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Visibility toggles */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={uploadForm.isPublished}
                                    onChange={(e) => setUploadForm({ ...uploadForm, isPublished: e.target.checked })}
                                    className="w-4 h-4 rounded accent-blue-500"
                                />
                                Published (show in gallery)
                            </label>
                            <label className={`flex items-center gap-2 text-sm cursor-pointer ${uploadForm.isPublished ? "text-slate-300" : "text-slate-500"}`}>
                                <input
                                    type="checkbox"
                                    checked={uploadForm.showOnHome}
                                    disabled={!uploadForm.isPublished}
                                    onChange={(e) => setUploadForm({ ...uploadForm, showOnHome: e.target.checked })}
                                    className="w-4 h-4 rounded accent-blue-500"
                                />
                                Show on homepage
                            </label>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${uploading
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-slate-600 hover:border-slate-500"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleUpload(e.target.files)}
                                className="hidden"
                            />

                            {uploading ? (
                                <div className="space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                                    <p className="text-slate-300">Uploading... {uploadProgress}%</p>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon size={48} className="mx-auto text-blue-400 mb-4" />
                                    <p className="text-slate-300 mb-2">
                                        Drag and drop images here, or click to select
                                    </p>
                                    <p className="text-slate-500 text-sm mb-4">
                                        Formats: JPEG, PNG, GIF, WebP (max 10MB)
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                                    >
                                        Select Images
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* YouTube Video Modal */}
            {showYoutubeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Youtube className="text-red-500" size={24} />
                                Add YouTube Video
                            </h2>
                            <button
                                onClick={() => setShowYoutubeModal(false)}
                                className="text-slate-400 hover:text-white"
                                disabled={uploading}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {youtubeError && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {youtubeError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    YouTube URL <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={youtubeForm.youtubeUrl}
                                        onChange={(e) => setYoutubeForm({ ...youtubeForm, youtubeUrl: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={youtubeForm.title}
                                    onChange={(e) => setYoutubeForm({ ...youtubeForm, title: e.target.value })}
                                    placeholder="Video title (optional)"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={youtubeForm.description}
                                    onChange={(e) => setYoutubeForm({ ...youtubeForm, description: e.target.value })}
                                    rows={2}
                                    placeholder="Brief description (optional)"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <FolderOpen size={14} className="inline mr-1" />
                                        Category
                                    </label>
                                    <select
                                        value={youtubeForm.category}
                                        onChange={(e) => setYoutubeForm({ ...youtubeForm, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        value={youtubeForm.tags}
                                        onChange={(e) => setYoutubeForm({ ...youtubeForm, tags: e.target.value })}
                                        placeholder="tag1, tag2"
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowYoutubeModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleYoutubeSubmit}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Youtube size={18} />
                                            Add Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">Edit Media</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Events, News, Sports"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                                <input
                                    type="text"
                                    value={editForm.tags}
                                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Comma separated tags"
                                />
                            </div>

                            {/* Visibility toggles */}
                            <div className="flex flex-wrap gap-4 pt-1">
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isPublished}
                                        onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                                        className="w-4 h-4 rounded accent-blue-500"
                                    />
                                    Published (show in gallery)
                                </label>
                                <label className={`flex items-center gap-2 text-sm cursor-pointer ${editForm.isPublished ? "text-slate-300" : "text-slate-500"}`}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.showOnHome}
                                        disabled={!editForm.isPublished}
                                        onChange={(e) => setEditForm({ ...editForm, showOnHome: e.target.checked })}
                                        className="w-4 h-4 rounded accent-blue-500"
                                    />
                                    Show on homepage
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewItem && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                    onClick={() => setShowPreviewModal(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full z-10"
                        onClick={() => setShowPreviewModal(false)}
                    >
                        <X size={32} />
                    </button>

                    <div
                        className="max-w-5xl max-h-[90vh] p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewItem.type === "video" ? (
                            previewItem.videoSource === "youtube" && previewItem.youtubeId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${previewItem.youtubeId}?autoplay=1`}
                                    className="w-full aspect-video rounded-lg"
                                    style={{ minWidth: "800px" }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={previewItem.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[80vh] rounded-lg"
                                />
                            )
                        ) : (
                            <Image
                                src={previewItem.url}
                                alt={previewItem.title}
                                width={previewItem.width || 1200}
                                height={previewItem.height || 800}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                        )}
                        <div className="mt-4 text-center">
                            <h3 className="text-white text-lg font-medium">{previewItem.title}</h3>
                            {previewItem.description && (
                                <p className="text-slate-400 mt-1">{previewItem.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Category Modal */}
            {showBulkCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Tag className="text-green-400" size={24} />
                                Set Category
                            </h2>
                            <button
                                onClick={() => setShowBulkCategoryModal(false)}
                                className="text-slate-400 hover:text-white"
                                disabled={bulkUpdating}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                                <p className="text-purple-300 text-sm">
                                    Setting category for <span className="font-bold">{selectedItems.size}</span> selected {selectedItems.size === 1 ? "item" : "items"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FolderOpen size={14} className="inline mr-1" />
                                    Category
                                </label>
                                <select
                                    value={bulkCategory}
                                    onChange={(e) => setBulkCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">No Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <p className="text-slate-500 text-xs mt-2">
                                    Select &quot;No Category&quot; to clear the category from selected items
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowBulkCategoryModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white"
                                    disabled={bulkUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkCategoryUpdate}
                                    disabled={bulkUpdating}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {bulkUpdating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Tag size={18} />
                                            Apply Category
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
