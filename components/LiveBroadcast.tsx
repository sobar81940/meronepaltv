"use client";

import { useState, useEffect } from "react";
import { Radio, Play, Calendar, ExternalLink, Facebook, Youtube, X, AlertCircle, Loader2 } from "lucide-react";
import { LiveBroadcastSettings } from "@/models/Settings";

interface LiveBroadcastProps {
    settings: LiveBroadcastSettings;
    position?: 'top' | 'sidebar' | 'section' | 'trigger';
}

// Extract YouTube video ID from various URL formats
export function extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Facebook video URL for embed
export function extractFacebookEmbedUrl(url: string): string | null {
    if (!url) return null;
    // Facebook live URLs need to be encoded for iframe embed
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
}

export function getLiveEmbedUrl(settings: LiveBroadcastSettings): string | null {
    switch (settings.activePlatform) {
        case 'youtube': {
            const ytId = extractYoutubeId(settings.youtubeLiveUrl);
            return ytId
                ? `https://www.youtube.com/embed/${ytId}?autoplay=${settings.autoplay ? 1 : 0}&rel=0`
                : null;
        }
        case 'facebook':
            return extractFacebookEmbedUrl(settings.facebookLiveUrl);
        case 'custom':
            return settings.customEmbedUrl || null;
        default:
            return null;
    }
}

function getPlatformLabel(platform: LiveBroadcastSettings['activePlatform']) {
    return platform === 'youtube' ? 'YouTube' : platform === 'facebook' ? 'Facebook' : 'Custom Embed';
}

interface LiveBroadcastModalProps {
    settings: LiveBroadcastSettings;
    open: boolean;
    onClose: () => void;
}

export function LiveBroadcastModal({ settings, open, onClose }: LiveBroadcastModalProps) {
    const embedUrl = getLiveEmbedUrl(settings);
    const [embedError, setEmbedError] = useState(false);
    const availableVideos = [
        { label: 'YouTube', url: settings.youtubeLiveUrl, icon: Youtube, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
        { label: 'Facebook', url: settings.facebookLiveUrl, icon: Facebook, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
        { label: 'Custom Embed', url: settings.customEmbedUrl, icon: ExternalLink, color: 'text-slate-700 bg-slate-100 hover:bg-slate-200' },
    ].filter((video) => video.url);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-broadcast-modal-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl bg-slate-900 shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex shrink-0 items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-red-400">
                            <Radio className="h-4 w-4 animate-pulse" />
                            <span className="text-sm font-bold">LIVE</span>
                        </div>
                        <h2 id="live-broadcast-modal-title" className="truncate font-semibold text-white">
                            {settings.title || 'लाइभ प्रसारण'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        aria-label="लाइभ बन्द गर्नुहोस्"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {settings.enabled && settings.activePlatform !== 'none' ? (
                    embedUrl && !embedError ? (
                        <div className="relative aspect-video bg-black">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin" aria-label="लोड हुँदैछ" />
                            </div>
                            <iframe
                                src={embedUrl}
                                title={settings.title || 'लाइभ प्रसारण'}
                                className="relative z-[1] h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                onError={() => setEmbedError(true)}
                            />
                        </div>
                    ) : (
                        <div className="flex min-h-56 items-center justify-center p-8 text-center text-slate-300">
                            <div>
                                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
                                <p className="font-medium">
                                    {embedError ? 'लाइभ भिडियो लोड हुन सकेन।' : 'लाइभ भिडियो लिङ्क मिलेन।'}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                    Admin बाट {getPlatformLabel(settings.activePlatform)} URL जाँच गर्नुहोस् वा नयाँ विन्डोमा खोल्नुहोस्।
                                </p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="p-5 sm:p-8">
                        <div className="mb-5 text-center">
                            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                            <h3 className="text-lg font-semibold text-white">हाल कुनै लाइभ प्रसारण छैन</h3>
                            <p className="mt-1 text-sm text-slate-400">पहिलेका वा उपलब्ध भिडियोहरू हेर्नुहोस्।</p>
                        </div>
                        {availableVideos.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                                {availableVideos.map(({ label, url, icon: Icon, color }) => (
                                    <a
                                        key={label}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${color}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label} भिडियो
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-slate-800 p-4 text-center text-sm text-slate-400">
                                अहिले देखाउनका लागि कुनै रेकर्ड गरिएको भिडियो छैन।
                            </p>
                        )}
                        <a href="/live" className="mt-5 block text-center text-sm text-blue-400 hover:text-blue-300">
                            लाइभ पेजमा जानुहोस्
                        </a>
                    </div>
                )}

                {settings.description && (
                    <div className="flex flex-col gap-3 border-t border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-400">{settings.description}</p>
                        {settings.enabled && settings.activePlatform !== 'none' && (
                            <a
                                href={settings.activePlatform === 'youtube' ? settings.youtubeLiveUrl : settings.activePlatform === 'facebook' ? settings.facebookLiveUrl : settings.customEmbedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex shrink-0 items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                <ExternalLink className="h-4 w-4" />
                                नयाँ विन्डोमा हेर्नुहोस्
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LiveBroadcast({ settings, position = 'section' }: LiveBroadcastProps) {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // No-op for now as we don't use isLive in JSX yet, 
        // but we'll keep the effect logic if needed for future schedule-based hiding.
    }, [settings]);

    const getEmbedUrl = () => getLiveEmbedUrl(settings);

    const getLiveUrl = () => {
        switch (settings.activePlatform) {
            case 'youtube':
                return settings.youtubeLiveUrl;
            case 'facebook':
                return settings.facebookLiveUrl;
            case 'custom':
                return settings.customEmbedUrl;
            default:
                return '';
        }
    };

    const embedUrl = getEmbedUrl();
    const liveUrl = getLiveUrl();

    if (position === 'trigger') {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 rounded-full bg-[#e61e2b] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    aria-label="लाइभ प्रसारण खोल्नुहोस्"
                >
                    <Radio size={16} aria-hidden="true" />
                    LIVE
                </button>
                <LiveBroadcastModal settings={settings} open={showModal} onClose={() => setShowModal(false)} />
            </>
        );
    }

    // Don't render non-trigger placements if not enabled or no active platform
    if (!settings.enabled || settings.activePlatform === 'none') {
        return null;
    }

    // Top banner style (compact)
    if (position === 'top') {
        return (
            <>
                <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white">
                    <div className="container mx-auto px-4 py-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Radio className="w-5 h-5 animate-pulse" />
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-wide">LIVE</span>
                                </div>
                                <span className="text-sm font-medium truncate">{settings.title}</span>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                            >
                                <Play className="w-4 h-4" fill="white" />
                                हेर्नुहोस्
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal for video */}
                {showModal && embedUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                        <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                                        <Radio className="w-4 h-4 animate-pulse" />
                                        <span className="text-sm font-bold">LIVE</span>
                                    </div>
                                    <h3 className="text-white font-semibold">{settings.title}</h3>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-400 hover:text-white transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="aspect-video">
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <p className="text-slate-400 text-sm">{settings.description}</p>
                                <a
                                    href={liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    नयाँ विन्डोमा हेर्नुहोस्
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Sidebar style (compact vertical)
    if (position === 'sidebar') {
        return (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 p-4">
                    <div className="flex items-center gap-2 text-white">
                        <div className="relative">
                            <Radio className="w-5 h-5" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wide">LIVE NOW</span>
                    </div>
                    <h3 className="text-white font-semibold mt-2">{settings.title}</h3>
                </div>

                {/* Video embed */}
                {embedUrl && (
                    <div className="aspect-video bg-gray-900">
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                {/* Platform links */}
                <div className="p-4 space-y-2">
                    <p className="text-gray-600 text-sm">{settings.description}</p>
                    <div className="flex items-center gap-2">
                        {settings.youtubeLiveUrl && (
                            <a
                                href={settings.youtubeLiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition"
                            >
                                <Youtube className="w-4 h-4" />
                                YouTube
                            </a>
                        )}
                        {settings.facebookLiveUrl && (
                            <a
                                href={settings.facebookLiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition"
                            >
                                <Facebook className="w-4 h-4" />
                                Facebook
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Full section style (default)
    return (
        <section className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/30">
                        <div className="relative">
                            <Radio className="w-5 h-5" />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wider">LIVE</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{settings.title}</h2>
                </div>

                {/* Platform quick links */}
                <div className="hidden md:flex items-center gap-2">
                    {settings.youtubeLiveUrl && (
                        <a
                            href={settings.youtubeLiveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium transition"
                        >
                            <Youtube className="w-4 h-4" />
                            YouTube मा हेर्नुहोस्
                        </a>
                    )}
                    {settings.facebookLiveUrl && (
                        <a
                            href={settings.facebookLiveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium transition"
                        >
                            <Facebook className="w-4 h-4" />
                            Facebook मा हेर्नुहोस्
                        </a>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="grid md:grid-cols-3 gap-0">
                    {/* Video Player */}
                    <div className="md:col-span-2 bg-slate-900 relative">
                        {embedUrl ? (
                            <div className="aspect-video">
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="aspect-video flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>लाइभ स्ट्रिम उपलब्ध छैन</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info panel */}
                    <div className="p-6 bg-gradient-to-br from-slate-50 to-white flex flex-col">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <Radio className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-bold uppercase">प्रत्यक्ष प्रसारण</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{settings.title}</h3>
                            <p className="text-gray-600 text-sm">{settings.description}</p>
                        </div>

                        {/* Schedule info */}
                        {settings.isScheduled && settings.scheduledStartTime && (
                            <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">तालिका</span>
                                </div>
                                <p className="text-blue-800 text-sm">
                                    {new Date(settings.scheduledStartTime).toLocaleString('ne-NP')}
                                </p>
                            </div>
                        )}

                        {/* Mobile platform links */}
                        <div className="mt-auto space-y-2 md:hidden">
                            {settings.youtubeLiveUrl && (
                                <a
                                    href={settings.youtubeLiveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium transition"
                                >
                                    <Youtube className="w-5 h-5" />
                                    YouTube मा हेर्नुहोस्
                                </a>
                            )}
                            {settings.facebookLiveUrl && (
                                <a
                                    href={settings.facebookLiveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition"
                                >
                                    <Facebook className="w-5 h-5" />
                                    Facebook मा हेर्नुहोस्
                                </a>
                            )}
                        </div>

                        {/* View on original platform */}
                        <a
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center justify-center gap-2 mt-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition"
                        >
                            <ExternalLink className="w-4 h-4" />
                            नयाँ विन्डोमा हेर्नुहोस्
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
