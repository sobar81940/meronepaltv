"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, Play, X } from "lucide-react";

interface GalleryItem {
    _id: string;
    title: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    category?: string;
    width?: number;
    height?: number;
    duration?: number;
    videoSource?: string;
    youtubeId?: string;
}

interface VideoPlayerModalProps {
    item: GalleryItem;
    onClose: () => void;
}

function VideoPlayerModal({ item, onClose }: VideoPlayerModalProps) {
    const isYouTube = item.videoSource === "youtube";

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                aria-label="Close"
            >
                <X size={24} />
            </button>

            <div
                className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {isYouTube && item.youtubeId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                ) : (
                    <video
                        src={item.url}
                        controls
                        autoPlay
                        className="w-full h-full"
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>

            {/* Title */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
                <h3 className="text-white text-xl font-semibold">{item.title}</h3>
                {item.category && (
                    <p className="text-white/70 text-sm mt-1">{item.category}</p>
                )}
            </div>
        </div>
    );
}

export default function GalleryVideoCard({ item, index }: { item: GalleryItem; index: number }) {
    const [showPlayer, setShowPlayer] = useState(false);

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const isYouTube = item.videoSource === "youtube";

    return (
        <>
            <div
                className="break-inside-avoid mb-6 group cursor-pointer"
                onClick={() => setShowPlayer(true)}
            >
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 aspect-video">
                    {/* Video Thumbnail */}
                    {item.thumbnailUrl ? (
                        <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            unoptimized={isYouTube}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Film size={48} className="text-gray-400" />
                        </div>
                    )}

                    {/* Video Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isYouTube ? 'bg-red-600' : 'bg-gradient-to-r from-primary to-purple-600'}`}>
                                <Play className="text-white ml-1" size={24} fill="white" />
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${isYouTube ? 'bg-red-600' : 'bg-purple-600'}`}>
                            {isYouTube ? 'YouTube' : 'Video'}
                        </span>
                    </div>

                    {/* Duration */}
                    {item.duration && !isYouTube && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs text-white font-medium">
                            {formatDuration(item.duration)}
                        </div>
                    )}

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold line-clamp-2 drop-shadow-lg">
                            {item.title}
                        </h3>
                        {item.category && (
                            <span className="text-white/70 text-sm">{item.category}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Player Modal */}
            {showPlayer && (
                <VideoPlayerModal item={item} onClose={() => setShowPlayer(false)} />
            )}
        </>
    );
}
