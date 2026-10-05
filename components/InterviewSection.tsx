"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";

interface InterviewPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    category?: string;
    createdAt: string;
}

interface InterviewSectionProps {
    posts: InterviewPost[];
    title?: string;
    categorySlug?: string;
}

export default function InterviewSection({
    posts,
    title = "अन्तर्वार्ता",
    categorySlug = "interview"
}: InterviewSectionProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!posts || posts.length === 0) return null;

    // Main featured post (left)
    const mainPost = posts[0];

    // Grid posts (right, up to 8 posts)
    const gridPosts = posts.slice(1, 9);

    return (
        <section className="mb-8 p-4 md:p-6 rounded-2xl bg-[#FFF5F6] border border-red-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#e61e2b] rounded-full" />
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                </div>
                <Link
                    href={`/category/${categorySlug}`}
                    className="text-primary text-sm font-medium flex items-center hover:underline"
                >
                    सबै हेर्नुहोस्
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left side column: Main Featured Event (col-span 4 for 1/3 width) */}
                <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                    <Link href={`/post/${mainPost.slug}`} className="block flex-1 flex flex-col">
                        <div className="relative aspect-[4/3] w-full bg-gray-100">
                            {mainPost.imageUrl ? (
                                <Image
                                    src={mainPost.imageUrl}
                                    alt={mainPost.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 33vw"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                    🎤
                                </div>
                            )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
                                {mainPost.title}
                            </h3>
                            {mainPost.excerpt && (
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                    {stripHtmlTags(mainPost.excerpt)}
                                </p>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-auto">
                                <span>{mainPost.author || 'सम्पादक'}</span>
                                <span className="mx-2">•</span>
                                <span suppressHydrationWarning>{mounted ? new Date(mainPost.createdAt).toLocaleDateString('ne-NP') : ''}</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right side column: 2-Column Grid for smaller posts (col-span 8) */}
                {gridPosts.length > 0 && (
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            {gridPosts.map((post) => (
                                <Link
                                    key={post._id}
                                    href={`/post/${post.slug}`}
                                    className="flex items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group"
                                >
                                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                                        {post.imageUrl ? (
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition duration-300"
                                                sizes="96px"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xl">
                                                🎤
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {post.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
