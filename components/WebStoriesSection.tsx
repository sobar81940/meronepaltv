"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { WebStory } from "@/models/WebStory";

interface WebStoriesCarouselProps {
    stories: WebStory[];
    title?: string;
}

export function WebStoriesCarousel({ stories, title = "वेबस्टोरिज" }: WebStoriesCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            return () => el.removeEventListener('scroll', checkScroll);
        }
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 300;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    if (stories.length === 0) return null;

    return (
        <section className="py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                    {title}
                </h2>
                <div className="flex items-center gap-2">
                    <Link
                        href="/web-stories"
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                        सबै हेर्नुहोस् →
                    </Link>
                    <div className="hidden md:flex gap-1 ml-4">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            aria-label="अघिल्लो स्क्रोल गर्नुहोस्"
                            className={`p-2 rounded-full transition ${canScrollLeft
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <ChevronLeft size={20} aria-hidden="true" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            aria-label="दायाँ स्क्रोल गर्नुहोस्"
                            className={`p-2 rounded-full transition ${canScrollRight
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <ChevronRight size={20} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stories Carousel */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {stories.map((story) => (
                        <Link
                            key={story._id?.toString()}
                            href={`/web-stories/${story.slug}`}
                            className="flex-shrink-0 group"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <div className="relative w-40 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                                {/* Cover Image */}
                                <Image
                                    src={story.coverImage}
                                    alt={story.title}
                                    fill
                                    sizes="(max-width: 768px) 160px, 192px"
                                    className="object-cover"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                {/* Ring Animation on Hover */}
                                <div className="absolute inset-0 border-4 border-transparent group-hover:border-purple-500 rounded-2xl transition-colors duration-300" />

                                {/* Category Badge */}
                                {story.category && (
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                                            {story.category}
                                        </span>
                                    </div>
                                )}

                                {/* Story Count Badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                                        {story.slides.length} STORIES
                                    </span>
                                </div>

                                {/* Title */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                    <h3 className="text-white font-bold text-sm md:text-base line-clamp-3 leading-tight">
                                        {story.title}
                                    </h3>
                                </div>

                                {/* Play indicator on hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <Play className="text-white ml-1" size={24} fill="white" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Gradient Fades */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                )}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                )}
            </div>
        </section>
    );
}

// Server Component Wrapper
export function WebStoriesSection({ stories }: { stories: WebStory[] }) {
    return <WebStoriesCarousel stories={stories} />;
}
