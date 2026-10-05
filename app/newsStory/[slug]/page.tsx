"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronUp, ChevronDown, Share2, Facebook, MessageCircle, ExternalLink } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";

interface StoryPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    category?: string;
    author?: string;
    createdAt: string;
}

export default function NewsStoryViewer() {
    const router = useRouter();
    const params = useParams();
    const currentSlug = params.slug as string;

    const [stories, setStories] = useState<StoryPost[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Calculate relative time in Nepali
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins} मिनेट अघि`;
        if (diffHours < 24) return `${diffHours} घण्टा अघि`;
        return `${diffDays} दिन अघि`;
    };

    // Fetch stories from News Bulletin category
    useEffect(() => {
        async function fetchStories() {
            try {
                // First try to fetch posts from "समाचार बुलेटिन" category
                let res = await fetch("/api/posts?category=समाचार बुलेटिन&limit=20");
                let data = await res.json();

                // If no posts in bulletin category, fallback to general posts
                if (!data.success || !data.data || data.data.length === 0) {
                    res = await fetch("/api/posts?limit=20");
                    data = await res.json();
                }

                if (data.success && data.data) {
                    // @ts-expect-error - p is an any from API response
                    const storyPosts = data.data.map((p) => ({
                        _id: p._id,
                        title: p.title,
                        slug: p.slug,
                        excerpt: p.excerpt,
                        content: p.content,
                        imageUrl: p.imageUrl,
                        category: p.category,
                        author: p.author,
                        createdAt: p.createdAt,
                    }));
                    setStories(storyPosts);

                    // Find current story index
                    const index = storyPosts.findIndex((s: StoryPost) => s.slug === currentSlug);
                    if (index !== -1) {
                        setCurrentIndex(index);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch stories:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStories();
    }, [currentSlug]);

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            const prevStory = stories[currentIndex - 1];
            setCurrentIndex(currentIndex - 1);
            router.replace(`/newsStory/${prevStory.slug}`, { scroll: false });
        }
    }, [currentIndex, stories, router]);

    const goToNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            const nextStory = stories[currentIndex + 1];
            setCurrentIndex(currentIndex + 1);
            router.replace(`/newsStory/${nextStory.slug}`, { scroll: false });
        } else {
            router.push("/");
        }
    }, [currentIndex, stories, router]);

    const handleClose = () => {
        router.push("/");
    };

    const handleShare = async () => {
        const currentStory = stories[currentIndex];
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentStory.title,
                    url: window.location.href,
                });
            } catch (e) {
                console.log("Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("लिंक कपी भयो!");
        }
    };

    const shareToFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    };

    const shareToMessenger = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`fb-messenger://share/?link=${url}`, '_blank');
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") goToPrevious();
            if (e.key === "ArrowDown") goToNext();
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToPrevious, goToNext]);

    if (loading) {
        return (
            <div className="min-h-fullbg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const currentStory = stories[currentIndex];

    if (!currentStory) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8">
                    <p className="text-xl mb-4 text-gray-800 dark:text-white">समाचार भेटिएन</p>
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    >
                        गृहपृष्ठमा फर्कनुहोस्
                    </button>
                </div>
            </div>
        );
    }

    // Strip HTML tags from content for plain text display
    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').substring(0, 500);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col lg:flex-row">
            {/* Close Button - Fixed position */}
            <button
                onClick={handleClose}
                className="fixed top-4 right-4 z-50 w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                aria-label="बन्द गर्नुहोस्"
            >
                <X size={20} className="text-gray-700 dark:text-white" />
            </button>

            {/* Left Navigation Panel - Desktop Only */}
            <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col items-center justify-center gap-4 shadow-lg z-40">
                <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${currentIndex === 0
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    aria-label="अघिल्लो"
                >
                    <ChevronUp size={24} />
                    <span className="text-xs">अघिल्लो</span>
                </button>

                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    {currentIndex + 1}/{stories.length}
                </div>

                <button
                    onClick={goToNext}
                    disabled={currentIndex === stories.length - 1}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${currentIndex === stories.length - 1
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    aria-label="अर्को"
                >
                    <span className="text-xs">अर्को</span>
                    <ChevronDown size={24} />
                </button>
            </div>

            {/* Main Content - Centered Card */}
            <main className="flex-1 lg:ml-16 flex items-start justify-center py-4 px-4 lg:py-8">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">

                    {/* Image Section */}
                    <div className="relative aspect-video">
                        {currentStory.imageUrl ? (
                            <Image
                                src={currentStory.imageUrl}
                                alt={currentStory.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400">No Image</span>
                            </div>
                        )}

                        {/* Source Badge */}
                        {currentStory.category && (
                            <div className="absolute bottom-3 left-3">
                                <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded">
                                    {currentStory.category}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 lg:p-8">
                        {/* Title */}
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                            {currentStory.title}
                        </h1>

                        {/* Time */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {getRelativeTime(currentStory.createdAt)}
                        </p>

                        {/* Excerpt/Content */}
                        <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
                            {currentStory.excerpt || stripHtml(currentStory.content || '')}
                        </div>

                        {/* Read Full News Link */}
                        <Link
                            href={`/post/${currentStory.slug}`}
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-6 transition-colors"
                        >
                            <ExternalLink size={18} />
                            Read full news
                        </Link>

                        {/* Share Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <ShareButtons slug={currentStory.slug} url={typeof window !== 'undefined' ? window.location.href : ''} title={currentStory.title} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 safe-area-bottom">
                <div className="flex items-stretch">
                    <button
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 border-r border-gray-200 dark:border-gray-700 ${currentIndex === 0
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <ChevronUp size={18} />
                        <span className="text-sm font-medium">Jump to previous</span>
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={currentIndex === stories.length - 1}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 ${currentIndex === stories.length - 1
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <ChevronDown size={18} />
                        <span className="text-sm font-medium">Jump to next</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
