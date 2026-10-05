"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
}

export default function ImageUpload({
    value,
    onChange,
    onRemove,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleUpload(file);
        } else {
            setError("Please drop an image file");
        }
    }, []);

    const handleRemove = () => {
        onChange("");
        onRemove?.();
    };

    if (value) {
        return (
            <div className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                    <img
                        src={value}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
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
        </div>
    );
}
