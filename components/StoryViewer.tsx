"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Share2, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { WebStory, StorySlide } from "@/models/WebStory";

interface StoryViewerProps {
    story: WebStory;
    allStories?: WebStory[];
}

export default function StoryViewer({ story, allStories = [] }: StoryViewerProps) {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const slide = story.slides[currentSlide];
    const slideDuration = (slide?.duration || 5) * 1000; // Convert to ms

    // Find previous and next stories
    const currentIndex = allStories.findIndex(s => s._id?.toString() === story._id?.toString());
    const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null;
    const nextStory = currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null;

    const goToSlide = useCallback((index: number) => {
        if (index >= 0 && index < story.slides.length) {
            setCurrentSlide(index);
            setProgress(0);
        }
    }, [story.slides.length]);

    const goToNextSlide = useCallback(() => {
        if (currentSlide < story.slides.length - 1) {
            goToSlide(currentSlide + 1);
        } else if (nextStory) {
            router.push(`/web-stories/${nextStory.slug}`);
        } else {
            router.push('/web-stories');
        }
    }, [currentSlide, story.slides.length, nextStory, router, goToSlide]);

    const goToPrevSlide = useCallback(() => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        } else if (prevStory) {
            router.push(`/web-stories/${prevStory.slug}`);
        }
    }, [currentSlide, prevStory, router, goToSlide]);

    // Auto-advance slides
    useEffect(() => {
        if (isPaused || slide?.type === 'video') return;

        const startTime = Date.now();
        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / slideDuration) * 100, 100);
            setProgress(newProgress);

            if (elapsed >= slideDuration) {
                goToNextSlide();
            }
        }, 50);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [currentSlide, isPaused, slideDuration, goToNextSlide, slide?.type]);

    // Handle video ended
    const handleVideoEnded = () => {
        goToNextSlide();
    };

    // Handle video progress
    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                    goToNextSlide();
                    break;
                case 'ArrowLeft':
                    goToPrevSlide();
                    break;
                case 'Escape':
                    router.push('/web-stories');
                    break;
                case ' ':
                    e.preventDefault();
                    setIsPaused(p => !p);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextSlide, goToPrevSlide, router]);

    // Touch/click navigation
    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x < width * 0.3) {
            goToPrevSlide();
        } else if (x > width * 0.7) {
            goToNextSlide();
        } else {
            setIsPaused(p => !p);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: story.title,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
            {/* Background Blur */}
            <div
                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
                style={{ backgroundImage: `url(${slide?.mediaUrl || story.coverImage})` }}
            />

            {/* Logo */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold">स</span>
                </div>
                <span className="text-white font-semibold hidden md:block">Stories</span>
            </div>

            {/* Close Button */}
            <button
                onClick={() => router.push('/web-stories')}
                className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
                <X size={24} />
            </button>

            {/* Main Story Container */}
            <div className="relative w-full max-w-md h-full max-h-[90vh] md:max-h-[85vh] mx-auto">
                {/* Story Card */}
                <div
                    className="relative w-full h-full bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                    onClick={handleClick}
                >
                    {/* Progress Bars */}
                    <div className="absolute top-0 left-0 right-0 z-40 px-3 pt-3 flex gap-1">
                        {story.slides.map((_, index) => (
                            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{
                                        width: index < currentSlide
                                            ? '100%'
                                            : index === currentSlide
                                                ? `${progress}%`
                                                : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-6 left-0 right-0 z-30 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                                <div className="w-full h-full rounded-full overflow-hidden relative">
                                    <Image
                                        src={story.coverImage}
                                        alt={story.title}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm truncate max-w-[150px] md:max-w-[200px]">
                                    {story.title}
                                </p>
                                {story.category && (
                                    <p className="text-white/60 text-xs">{story.category}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPaused(p => !p); }}
                                className="p-2 text-white/80 hover:text-white"
                            >
                                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                            </button>
                            {slide?.type === 'video' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
                                    className="p-2 text-white/80 hover:text-white"
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                                className="p-2 text-white/80 hover:text-white"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Media Content */}
                    <div className="absolute inset-0">
                        {slide?.type === 'video' ? (
                            <video
                                ref={videoRef}
                                src={slide.mediaUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted={isMuted}
                                playsInline
                                onEnded={handleVideoEnded}
                                onTimeUpdate={handleVideoTimeUpdate}
                            />
                        ) : (
                            <Image
                                src={slide?.mediaUrl || story.coverImage}
                                alt={story.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 448px"
                            />
                        )}
                    </div>

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

                    {/* Text Content */}
                    {slide?.text && (
                        <div
                            className={`absolute left-0 right-0 z-20 px-6 ${slide.textPosition === 'top' ? 'top-24' :
                                slide.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                                    'bottom-16'
                                }`}
                        >
                            <p
                                className="text-lg md:text-xl leading-relaxed"
                                style={{ color: slide.textColor || '#ffffff' }}
                            >
                                {slide.text}
                            </p>
                        </div>
                    )}

                    {/* Navigation Hints */}
                    <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
                        <div className="flex gap-2">
                            {story.slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                        ? 'bg-white w-6'
                                        : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Navigation Arrows */}
            {prevStory && (
                <button
                    onClick={() => router.push(`/web-stories/${prevStory.slug}`)}
                    className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition z-40"
                >
                    <ChevronLeft size={28} />
                </button>
            )}
            {nextStory && (
                <button
                    onClick={() => router.push(`/web-stories/${nextStory.slug}`)}
                    className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition z-40"
                >
                    <ChevronRight size={28} />
                </button>
            )}

            {/* Story Previews (Desktop) */}
            <div className="hidden lg:flex absolute left-8 bottom-8 gap-3 z-40">
                {prevStory && (
                    <button
                        onClick={() => router.push(`/web-stories/${prevStory.slug}`)}
                        className="w-16 h-24 rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition"
                    >
                        <Image src={prevStory.coverImage} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                )}
            </div>
            <div className="hidden lg:flex absolute right-8 bottom-8 gap-3 z-40">
                {nextStory && (
                    <button
                        onClick={() => router.push(`/web-stories/${nextStory.slug}`)}
                        className="w-16 h-24 rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition"
                    >
                        <Image src={nextStory.coverImage} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                )}
            </div>
        </div>
    );
}
