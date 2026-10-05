"use client";

import { useState } from "react";
import { Star, Award, User, Film, Play, X, Music } from "lucide-react";
import Image from "next/image";

interface FilmEntry {
    title: string;
    year?: string;
    role?: string;
}

interface VideoEntry {
    youtubeId: string;
    title?: string;
}

interface CelebrityTabsProps {
    bio: string;
    shortBio?: string;
    knownFor?: string[];
    awards?: string[];
    filmography?: FilmEntry[];
    videos?: VideoEntry[];
    category?: string; // actor, singer, musician, etc.
}

type TabType = "bio" | "films" | "videos" | "awards";

export default function CelebrityTabs({
    bio,
    shortBio,
    knownFor,
    awards,
    filmography,
    videos,
    category
}: CelebrityTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>("bio");
    const [selectedVideo, setSelectedVideo] = useState<VideoEntry | null>(null);

    const hasFilms = filmography && filmography.length > 0;
    const hasVideos = videos && videos.length > 0;
    const hasAwards = awards && awards.length > 0;

    // Dynamic labels based on category
    const isMusicCategory = category === "singer" || category === "musician";
    const filmsLabel = isMusicCategory ? "संगीत" : "फिल्महरू";
    const filmsIcon = isMusicCategory ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />;
    const videosLabel = isMusicCategory ? "संगीत भिडियो" : "फिल्म भिडियो";

    const tabs: { key: TabType; label: string; icon: React.ReactNode; show: boolean }[] = [
        { key: "bio", label: "जीवनी", icon: <User className="w-4 h-4" />, show: true },
        { key: "films", label: filmsLabel, icon: filmsIcon, show: hasFilms ?? false },
        { key: "videos", label: videosLabel, icon: <Play className="w-4 h-4" />, show: hasVideos ?? false },
        { key: "awards", label: "पुरस्कार", icon: <Award className="w-4 h-4" />, show: hasAwards ?? false },
    ];

    return (
        <>
            {/* Video Popup Modal */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 p-2 text-white hover:text-red-400 transition-colors z-10"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div
                        className="relative w-full max-w-5xl aspect-video"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                            title={selectedVideo.title || "Video"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full rounded-xl"
                        />
                    </div>
                    {selectedVideo.title && (
                        <p className="absolute bottom-8 left-0 right-0 text-center text-white text-lg font-medium">
                            {selectedVideo.title}
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex overflow-x-auto">
                        {tabs.filter(t => t.show).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key
                                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fadeIn">
                    {/* Bio Tab */}
                    {activeTab === "bio" && (
                        <div className="space-y-6">
                            {/* Short Bio Quote */}
                            {shortBio && (
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                                    <p className="text-lg leading-relaxed font-medium">
                                        &quot;{shortBio}&quot;
                                    </p>
                                </div>
                            )}

                            {/* Known For */}
                            {knownFor && knownFor.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">चिनिएको कारण</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-3">
                                            {knownFor.map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full font-medium border border-purple-100 hover:border-purple-300 transition-colors"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Full Biography */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">जीवनी</h2>
                                </div>
                                <div className="p-6">
                                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {bio}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Films/Music Tab */}
                    {activeTab === "films" && filmography && filmography.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMusicCategory
                                    ? "bg-gradient-to-br from-pink-100 to-rose-100"
                                    : "bg-gradient-to-br from-indigo-100 to-purple-100"
                                    }`}>
                                    {isMusicCategory
                                        ? <Music className="w-5 h-5 text-pink-600" />
                                        : <Film className="w-5 h-5 text-indigo-600" />
                                    }
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isMusicCategory ? "संगीत सूची" : "फिल्मोग्राफी"}
                                </h2>
                                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${isMusicCategory
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-indigo-100 text-indigo-700"
                                    }`}>
                                    {filmography.length} {isMusicCategory ? "गीत" : "फिल्म"}
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filmography.map((film, i) => (
                                        <div
                                            key={i}
                                            className={`group p-4 rounded-xl border hover:shadow-md transition-all ${isMusicCategory
                                                ? "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100 hover:border-pink-300"
                                                : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 hover:border-indigo-300"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${isMusicCategory ? "bg-pink-600" : "bg-indigo-600"
                                                    }`}>
                                                    {isMusicCategory
                                                        ? <Music className="w-6 h-6 text-white" />
                                                        : <Film className="w-6 h-6 text-white" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{film.title}</h3>
                                                    {film.year && (
                                                        <p className="text-sm text-gray-500">{film.year}</p>
                                                    )}
                                                    {film.role && (
                                                        <p className={`text-xs mt-1 font-medium ${isMusicCategory ? "text-pink-600" : "text-indigo-600"
                                                            }`}>{film.role}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Videos Tab */}
                    {activeTab === "videos" && videos && videos.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                                    <Play className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">भिडियोहरू</h2>
                                <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                    {videos.length} भिडियो
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {videos.map((video, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                                            onClick={() => setSelectedVideo(video)}
                                        >
                                            <div className="relative aspect-video bg-black">
                                                {/* YouTube Thumbnail */}
                                                <Image
                                                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                                                    alt={video.title || `Video ${i + 1}`}
                                                    fill
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                                {/* Play Overlay */}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                            {video.title && (
                                                <div className="p-3 bg-gray-50">
                                                    <p className="font-medium text-gray-900">{video.title}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Awards Tab */}
                    {activeTab === "awards" && awards && awards.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">पुरस्कार र सम्मान</h2>
                                <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                    {awards.length} पुरस्कार
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {awards.map((award, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <Award className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-medium text-gray-800">{award}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
