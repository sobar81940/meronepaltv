"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Youtube, Facebook } from "lucide-react";

interface ShortsPost {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    excerpt?: string;
    createdAt: string;
    socialShares?: {
        facebookReel?: boolean;
        youtube?: boolean;
    };
}

interface ShortsSectionProps {
    posts: ShortsPost[];
    title?: string;
}

export default function ShortsSection({ posts, title = "शर्ट्स" }: ShortsSectionProps) {
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
        if (!el) return;
        el.addEventListener("scroll", checkScroll);
        return () => el.removeEventListener("scroll", checkScroll);
    }, []);

    if (posts.length === 0) return null;

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -360 : 360,
            behavior: "smooth",
        });
    };

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white flex items-center gap-3">
                    <span className="w-2 h-8 rounded-full bg-gradient-to-b from-red-500 via-pink-500 to-fuchsia-500" />
                    {title}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={`p-2 rounded-full border transition ${canScrollLeft ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" : "border-gray-200 bg-white text-gray-300 cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white/30"}`}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={`p-2 rounded-full border transition ${canScrollRight ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" : "border-gray-200 bg-white text-gray-300 cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-white/30"}`}
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {posts.map((post) => {
                        const isYoutube = !!post.socialShares?.youtube;
                        const isFacebook = !!post.socialShares?.facebookReel;
                        return (
                            <Link
                                key={post._id}
                                href={`/post/${post.slug}`}
                                className="group relative flex-shrink-0 w-[250px] sm:w-[280px] md:w-[300px] aspect-[9/16] rounded-[28px] overflow-hidden shadow-2xl border border-white/10"
                                style={{ scrollSnapAlign: "start" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                                {post.imageUrl ? (
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                                )}

                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                    {isYoutube && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                                            <Youtube size={12} /> YouTube Shorts
                                        </span>
                                    )}
                                    {isFacebook && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                                            <Facebook size={12} /> Facebook Reel
                                        </span>
                                    )}
                                </div>

                                <div className="absolute inset-x-0 bottom-0 z-20 p-4">
                                    <div className="mb-3 flex items-center justify-between text-white/80">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 backdrop-blur-md border border-white/15">
                                            <Play size={18} fill="currentColor" />
                                        </span>
                                        <span className="text-xs font-medium uppercase tracking-[0.22em]">Short Post</span>
                                    </div>
                                    <h3 className="text-[17px] font-bold leading-snug text-white line-clamp-3 group-hover:text-white/90">
                                        {post.title}
                                    </h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}