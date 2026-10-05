"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, X, Loader2, ImageIcon, FolderOpen, Search, Check } from "lucide-react";
import Image from "next/image";

interface GalleryImage {
    _id: string;
    title: string;
    url: string;
    thumbnailUrl?: string;
    category?: string;
    createdAt: string;
}

interface ImageUploadWithBrowserProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
}

export default function ImageUploadWithBrowser({
    value,
    onChange,
    onRemove,
}: ImageUploadWithBrowserProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gallery Browser State
    const [showGalleryBrowser, setShowGalleryBrowser] = useState(false);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchGalleryImages = useCallback(async (query: string) => {
        setLoadingGallery(true);
        try {
            // Fetch from both gallery database and DigitalOcean Spaces
            const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";

            const galleryRes = await fetch(`/api/gallery?type=image&limit=50${searchParam}`);
            const galleryData = await galleryRes.json();

            if (galleryData.success) {
                setGalleryImages(galleryData.data);
            } else {
                setGalleryImages([]);
            }
        } catch (error) {
            console.error("Failed to fetch gallery:", error);
        } finally {
            setLoadingGallery(false);
        }
    }, []);

    // Handle initial load and debounced search
    useEffect(() => {
        if (!showGalleryBrowser) return;

        // Fetch immediately on initial open or when search is cleared
        if (searchQuery === "") {
            fetchGalleryImages("");
            return;
        }

        // Debounce actual typing
        const timer = setTimeout(() => {
            fetchGalleryImages(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [showGalleryBrowser, searchQuery, fetchGalleryImages]);

    const handleUpload = async (file: File) => {
        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                onChange(data.data.url);
            } else {
                setError(data.error || "Upload failed");
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleUpload(file);
        } else {
            setError("Please drop an image file");
        }
    };

    const handleRemove = () => {
        onChange("");
        onRemove?.();
    };

    const handleSelectFromGallery = () => {
        if (selectedImage) {
            onChange(selectedImage);
            setShowGalleryBrowser(false);
            setSelectedImage(null);
            setSearchQuery("");
        }
    };

    const openGalleryBrowser = () => {
        setShowGalleryBrowser(true);
        // Pre-select the current image if one exists
        setSelectedImage(value || null);
        setSearchQuery("");
    };

    // If image is already set, show the preview
    if (value) {
        return (
            <div className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                    <img
                        src={value}
                        alt="Featured"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={openGalleryBrowser}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                            <FolderOpen size={16} />
                            Change
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                            <X size={16} />
                            Remove
                        </button>
                    </div>
                </div>

                {/* Gallery Browser Modal */}
                {showGalleryBrowser && (
                    <GalleryBrowserModal
                        images={galleryImages}
                        loading={loadingGallery}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedImage={selectedImage}
                        onSelectImage={setSelectedImage}
                        onConfirm={handleSelectFromGallery}
                        onClose={() => setShowGalleryBrowser(false)}
                        onUpload={handleUpload}
                        currentImage={value}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Upload / Browse Buttons */}
            <div className="flex gap-3 mb-3">
                <button
                    type="button"
                    onClick={openGalleryBrowser}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600"
                >
                    <FolderOpen size={20} />
                    Browse Gallery
                </button>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-8
                    flex flex-col items-center justify-center gap-3
                    cursor-pointer transition-colors
                    ${dragActive
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                    }
                    ${uploading ? "pointer-events-none opacity-50" : ""}
                `}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                {uploading ? (
                    <>
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-slate-400">Uploading...</p>
                    </>
                ) : (
                    <>
                        <div className="p-3 bg-slate-600/50 rounded-full">
                            {dragActive ? (
                                <Upload className="w-8 h-8 text-blue-500" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-slate-300">
                                <span className="text-blue-500 font-medium">
                                    Click to upload
                                </span>{" "}
                                or drag and drop
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                PNG, JPG, GIF or WebP (max 10MB)
                            </p>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}

            {/* Gallery Browser Modal */}
            {showGalleryBrowser && (
                <GalleryBrowserModal
                    images={galleryImages}
                    loading={loadingGallery}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedImage={selectedImage}
                    onSelectImage={setSelectedImage}
                    onConfirm={handleSelectFromGallery}
                    onClose={() => setShowGalleryBrowser(false)}
                    onUpload={handleUpload}
                    currentImage={value}
                />
            )}
        </div>
    );
}

// Gallery Browser Modal Component
interface GalleryBrowserModalProps {
    images: GalleryImage[];
    loading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedImage: string | null;
    onSelectImage: (url: string) => void;
    onConfirm: () => void;
    onClose: () => void;
    onUpload: (file: File) => void;
    currentImage?: string;
}

function GalleryBrowserModal({
    images,
    loading,
    searchQuery,
    onSearchChange,
    selectedImage,
    onSelectImage,
    onConfirm,
    onClose,
    onUpload,
    currentImage,
}: GalleryBrowserModalProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            await onUpload(file);
            setUploading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FolderOpen className="text-blue-400" size={24} />
                        Select Image from Gallery
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search and Upload */}
                <div className="p-4 border-b border-slate-700 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search images..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer flex items-center gap-2 transition-colors">
                        <Upload size={18} />
                        Upload New
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <ImageIcon size={48} className="opacity-50 mb-2" />
                            <p>No images found</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Upload new images to your gallery
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {images.map((image) => (
                                <button
                                    key={image._id}
                                    type="button"
                                    onClick={() => onSelectImage(image.url)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${selectedImage === image.url
                                        ? "border-blue-500 ring-2 ring-blue-500/50"
                                        : "border-slate-600 hover:border-slate-500"
                                        }`}
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Selection Indicator */}
                                    {selectedImage === image.url && (
                                        <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                            <div className="p-2 bg-blue-600 rounded-full">
                                                <Check size={24} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                    {/* Hover Overlay */}
                                    {selectedImage !== image.url && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">Select</span>
                                        </div>
                                    )}
                                    {/* Current Image Badge */}
                                    {currentImage === image.url && (
                                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-600 rounded text-xs text-white font-medium">
                                            Current
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    {image.category && (
                                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white truncate max-w-[90%]">
                                            {image.category}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/80">
                    <p className="text-sm text-slate-400">
                        {selectedImage ? "1 image selected" : "Click an image to select it"}
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={!selectedImage}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Check size={18} />
                            Use Selected Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
