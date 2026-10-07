"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Play, Youtube, Facebook, ArrowRight } from "lucide-react";

interface ShortsPost {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    excerpt?: string;
    createdAt: string;
    contentBlocks?: {
        type: "text" | "image" | "video" | "quote" | "heading" | "embed";
        content: string;
        mediaUrl?: string;
        embedCode?: string;
        order: number;
    }[];
    socialShares?: {
        facebookReel?: boolean;
        youtube?: boolean;
    };
}

interface ShortsFeedProps {
    posts: ShortsPost[];
}

export default function ShortsFeed({ posts }: ShortsFeedProps) {
    const [selectedPost, setSelectedPost] = useState<ShortsPost | null>(null);

    const selectedVideoBlock = selectedPost?.contentBlocks?.find(block => block.type === "video" && block.mediaUrl);
    const selectedEmbedBlock = selectedPost?.contentBlocks?.find(block => block.type === "embed" && block.embedCode);

    useEffect(() => {
        if (!selectedPost) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedPost(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedPost]);

    if (posts.length === 0) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold text-foreground">Short Videos</h1>
                <p className="mt-3 text-muted-foreground">No short videos have been published yet.</p>
                <Link href="/" className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium">
                    Back to Home
                    <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Short Videos</h1>
                        <p className="text-muted-foreground mt-1">YouTube Shorts and Facebook Reels published from the admin panel</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {posts.map((post) => {
                        const isYoutube = !!post.socialShares?.youtube;
                        const isFacebook = !!post.socialShares?.facebookReel;

                        return (
                            <button
                                key={post._id}
                                onClick={() => setSelectedPost(post)}
                                className="group text-left rounded-[28px] overflow-hidden bg-background border border-border shadow-xl hover:shadow-2xl transition-all"
                            >
                                <div className="relative aspect-[9/16] bg-muted">
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

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
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

                                    <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                                        <div className="mb-3 flex items-center justify-between text-white/80">
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/15">
                                                <Play size={18} fill="currentColor" />
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-[0.22em]">Tap to open</span>
                                        </div>
                                        <h2 className="text-[17px] font-bold leading-snug text-white line-clamp-3">
                                            {post.title}
                                        </h2>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedPost(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                            aria-label="Close popup"
                        >
                            <X size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="relative min-h-[420px] bg-black">
                                {selectedVideoBlock?.mediaUrl ? (
                                    <video
                                        src={selectedVideoBlock.mediaUrl}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        controls
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                ) : selectedEmbedBlock?.embedCode ? (
                                    <div
                                        className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full"
                                        dangerouslySetInnerHTML={{ __html: selectedEmbedBlock.embedCode }}
                                    />
                                ) : selectedPost.imageUrl ? (
                                    <Image
                                        src={selectedPost.imageUrl}
                                        alt={selectedPost.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                                )}
                            </div>

                            <div className="p-6 md:p-8 flex flex-col justify-between bg-slate-950">
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {selectedPost.socialShares?.youtube && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-3 py-1 text-xs font-semibold text-red-300 border border-red-500/30">
                                                <Youtube size={12} /> YouTube Shorts
                                            </span>
                                        )}
                                        {selectedPost.socialShares?.facebookReel && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
                                                <Facebook size={12} /> Facebook Reel
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                                        {selectedPost.title}
                                    </h3>
                                    {selectedPost.excerpt && (
                                        <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed line-clamp-5">
                                            {selectedPost.excerpt}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-col gap-3">
                                    <Link
                                        href={`/post/${selectedPost.slug}`}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition"
                                    >
                                        Open Post
                                        <ArrowRight size={16} />
                                    </Link>
                                    <button
                                        onClick={() => setSelectedPost(null)}
                                        className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/5 transition"
                                    >
                                        Continue browsing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}