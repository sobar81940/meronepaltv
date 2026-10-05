"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Play, X, Images, Film, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface GalleryItem {
    _id: string;
    title: string;
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    category?: string;
    youtubeId?: string;
    videoSource?: "upload" | "youtube";
}

interface GallerySectionProps {
    images: Record<string, GalleryItem[]>;
    videos: Record<string, GalleryItem[]>;
}

// Modern Lightbox with navigation
function ModernLightbox({
    items,
    currentIndex,
    onClose,
    onNavigate,
}: {
    items: GalleryItem[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}) {
    const item = items[currentIndex];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            onNavigate(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
            onNavigate(currentIndex + 1);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-50 backdrop-blur-sm"
                aria-label="बन्द गर्नुहोस्"
            >
                <X size={24} aria-hidden="true" />
            </button>

            {/* Navigation buttons */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-50 backdrop-blur-sm"
                    aria-label="अघिल्लो तस्विर"
                >
                    <ChevronLeft size={28} aria-hidden="true" />
                </button>
            )}
            {currentIndex < items.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-50 backdrop-blur-sm"
                    aria-label="अर्को तस्विर"
                >
                    <ChevronRight size={28} aria-hidden="true" />
                </button>
            )}

            {/* Content */}
            <div
                className="max-w-6xl max-h-[85vh] w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {item.type === "image" ? (
                    <div className="flex items-center justify-center w-full">
                        <Image
                            src={item.url}
                            alt={item.title}
                            width={1600}
                            height={1000}
                            className="w-auto h-auto max-w-full max-h-[70vh] object-contain rounded-lg"
                            unoptimized
                        />
                    </div>
                ) : item.videoSource === "youtube" && item.youtubeId ? (
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                            src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <video
                        src={item.url}
                        controls
                        autoPlay
                        className="w-full h-full rounded-lg"
                    />
                )}

                {/* Info bar */}
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <p className="text-white text-lg font-medium">{item.title}</p>
                        {item.category && (
                            <span className="text-white/60 text-sm">{item.category}</span>
                        )}
                    </div>
                    <div className="text-white/60 text-sm">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>

                {/* Thumbnail strip */}
                <div className="mt-4 flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-none">
                    {items.slice(0, 10).map((thumb, index) => (
                        <button
                            key={thumb._id}
                            onClick={(e) => { e.stopPropagation(); onNavigate(index); }}
                            aria-label={`तस्विर ${index + 1} हेर्नुहोस्`}
                            className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${index === currentIndex
                                ? 'ring-2 ring-white scale-110'
                                : 'opacity-50 hover:opacity-100'
                                } relative`}
                        >
                            <Image
                                src={thumb.thumbnailUrl || thumb.url}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Modern Video Gallery Section
function VideoGallerySection({ videos }: { videos: Record<string, GalleryItem[]> }) {
    const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
    const allVideos = useMemo(() => Object.values(videos).flat(), [videos]);

    if (allVideos.length === 0) return null;

    const featuredVideo = allVideos[0];
    const sidebarVideos = allVideos.slice(1, 3);

    return (
        <section className="mb-10">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                        <Film className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">भिडियो ग्यालरी</h2>
                        <p className="text-sm text-gray-500">ताजा भिडियोहरू हेर्नुहोस्</p>
                    </div>
                </div>
                <a
                    href="/gallery?type=video"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors"
                >
                    सबै भिडियो →
                </a>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Featured Video */}
                <div
                    className="lg:col-span-9 relative group cursor-pointer"
                    onClick={() => setSelectedVideoIndex(0)}
                >
                    <div className="aspect-video relative rounded-2xl overflow-hidden shadow-xl">
                        <Image
                            src={featuredVideo.thumbnailUrl || featuredVideo.url}
                            alt={featuredVideo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            unoptimized
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-2xl">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                                    <Play className="text-white ml-1" size={32} fill="white" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* Category badge */}
                        {featuredVideo.category && (
                            <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                                <span className="text-white text-sm font-medium">{featuredVideo.category}</span>
                            </div>
                        )}

                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h3 className="text-white text-xl md:text-2xl font-bold line-clamp-2 drop-shadow-lg">
                                {featuredVideo.title}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Sidebar Videos */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                    {sidebarVideos.map((video, index) => (
                        <div
                            key={video._id}
                            className="group cursor-pointer"
                            onClick={() => setSelectedVideoIndex(index + 1)}
                        >
                            <div className="space-y-3">
                                <div className="aspect-video relative overflow-hidden rounded-2xl">
                                    <Image
                                        src={video.thumbnailUrl || video.url}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        unoptimized
                                    />
                                    {/* Play icon overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                                                <Play className="text-white ml-0.5" size={14} fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Subtle Duration label if needed - Placeholder for now */}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-bold tracking-tight">
                                        VIDEO
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-gray-900 text-sm font-bold leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                                {video.title}
                            </h3>
                            {video.category && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {video.category}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* Lightbox */}
            {
                selectedVideoIndex !== null && (
                    <ModernLightbox
                        items={allVideos}
                        currentIndex={selectedVideoIndex}
                        onClose={() => setSelectedVideoIndex(null)}
                        onNavigate={setSelectedVideoIndex}
                    />
                )
            }
        </section >
    );
}

// Modern Image Gallery Section with Horizontal Carousel
function ImageGallerySectionComponent({ images }: { images: Record<string, GalleryItem[]> }) {
    const allImages = useMemo(() => Object.values(images).flat(), [images]);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setScrollPosition(scrollLeft);
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320; // Card width + gap
            const newPosition = direction === 'left'
                ? scrollPosition - scrollAmount
                : scrollPosition + scrollAmount;
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
        }
    };

    if (allImages.length === 0) return null;

    return (
        <section className="mb-10 bg-[#1a1f2e] rounded-2xl py-8 px-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            {/* Section Header */}
            <div className="relative flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    फोटो ग्यालरी
                </h2>

                {/* Navigation Arrows - Top Right */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        aria-label="अघिल्लो स्क्रोल गर्नुहोस्"
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${canScrollLeft
                            ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft size={24} aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        aria-label="दायाँ स्क्रोल गर्नुहोस्"
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${canScrollRight
                            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight size={24} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Horizontal Carousel */}
            <div className="relative">
                {/* Left Navigation Arrow - Side */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        aria-label="अघिल्लो स्क्रोल गर्नुहोस्"
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 shadow-xl -ml-2"
                    >
                        <ChevronLeft size={28} aria-hidden="true" />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allImages.map((image, index) => (
                        <div
                            key={image._id}
                            className="flex-shrink-0 w-[280px] md:w-[300px] group cursor-pointer"
                            onClick={() => setLightboxIndex(index)}
                        >
                            <div className="relative h-[380px] md:h-[420px] rounded-xl overflow-hidden">
                                {/* Image */}
                                <Image
                                    src={image.thumbnailUrl || image.url}
                                    alt={image.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    unoptimized
                                />

                                {/* Red Badge Icon */}
                                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                                    <Images className="text-white" size={18} />
                                </div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                {/* Title Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white text-base md:text-lg font-semibold text-center leading-tight">
                                        {image.title}
                                    </h3>
                                    {image.category && (
                                        <p className="text-white/70 text-sm text-center mt-1">
                                            ({image.category})
                                        </p>
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Maximize2 className="text-white" size={28} aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Navigation Arrow - Side */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        aria-label="दायाँ स्क्रोल गर्नुहोस्"
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 shadow-xl -mr-2"
                    >
                        <ChevronRight size={28} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* View All Link */}
            {allImages.length > 4 && (
                <div className="mt-6 text-center">
                    <a
                        href="/gallery"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        सबै फोटोहरू हेर्नुहोस्
                        <ChevronRight size={18} />
                    </a>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <ModernLightbox
                    items={allImages}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </section>
    );
}

// Combined Gallery Section
export function GallerySection({ images, videos }: GallerySectionProps) {
    return (
        <>
            {/* Video Gallery */}
            {Object.keys(videos).length > 0 && (
                <VideoGallerySection videos={videos} />
            )}

            {/* Image Gallery */}
            {Object.keys(images).length > 0 && (
                <ImageGallerySectionComponent images={images} />
            )}
        </>
    );
}

// Legacy exports for backward compatibility
export function ImageGallerySection({ images }: { images: Record<string, GalleryItem[]> }) {
    return <ImageGallerySectionComponent images={images} />;
}
