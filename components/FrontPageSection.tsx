"use client";

import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface FrontPagePost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    category?: string;
    createdAt: string;
}

interface FrontPageSectionProps {
    posts: FrontPagePost[];
    title?: string;
    categorySlug?: string;
}

export default function FrontPageSection({ posts, title = "राजनीति", categorySlug = "front-page" }: FrontPageSectionProps) {
    // Hydration fix: Ensure client and server match
    if (posts.length === 0) return null;

    // Main featured post (center)
    const mainPost = posts[0];
    // Left sidebar posts (3 posts)
    const leftPosts = posts.slice(1, 5);
    // Right sidebar posts (4 posts)
    const rightPosts = posts.slice(5, 9);

    return (
        <section className="mb-6 border border-gray-200 bg-gradient-to-br from-rose-50/80 to-pink-50/50 shadow-lg rounded-2xl p-4 md:p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {title}
                    </h2>
                </div>
                <Link
                    href={`/category/${categorySlug}`}
                    className="flex items-center gap-1 hover:text-primary font-bold text-sm transition-colors"
                    style={{ color: '#374151' }}
                >
                    सबै <ChevronRight size={16} />
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Sidebar - Small Posts (Image on Left) */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {leftPosts.map((post) => (
                        <Link key={post._id} href={`/post/${post.slug}`} className="group flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
                            {post.imageUrl && (
                                <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="100px"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            )}
                            <div className="space-y-1 flex-1 min-w-0">
                                <h3 className="font-bold text-[16px] line-clamp-2 leading-tight group-hover:text-primary transition-colors" style={{ color: '#111827' }}>
                                    {post.title}
                                </h3>
                                {post.author && (
                                    <p className="text-[11px] font-medium text-gray-400">
                                        {post.author}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Center - Styled Large Card */}
                <div className="lg:col-span-6">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-pink-100/50 flex flex-col h-full border border-pink-50">
                        {/* Image area with title overlay */}
                        <Link href={`/post/${mainPost.slug}`} className="relative aspect-[16/10] block group overflow-hidden">
                            {mainPost.imageUrl && (
                                <Image
                                    src={mainPost.imageUrl}
                                    alt={mainPost.title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 800px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                                    {mainPost.title}
                                </h2>
                            </div>
                        </Link>

                        {/* Content area below image */}
                        <div className="p-6 md:p-8 pt-6 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">
                                    {mainPost.author?.[0] || 'A'}
                                </div>
                                <span className="text-sm font-bold text-gray-400">{mainPost.author || 'Admin'}</span>
                            </div>

                            {mainPost.excerpt && (
                                <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2 mb-6">
                                    {stripHtmlTags(mainPost.excerpt)}
                                </p>
                            )}

                            <Link
                                href={`/post/${mainPost.slug}`}
                                className="inline-flex items-center font-bold text-base hover:text-primary transition-colors mt-auto"
                                style={{ color: '#111827' }}
                            >
                                पुरा पढ्नुहोस् →
                            </Link>
                        </div>
                    </article>
                </div>

                {/* Right Sidebar - Small Posts (Image on Right) */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {rightPosts.map((post) => (
                        <Link
                            key={post._id}
                            href={`/post/${post.slug}`}
                            className="group flex items-start gap-4 border-b border-gray-100/50 pb-6 last:border-0 last:pb-0 rounded-xl bg-white p-3"
                        >
                            <div className="flex flex-col flex-1 gap-2 pt-1 min-w-0">
                                <div className="flex items-start gap-1.5">
                                    <CheckCircle2 size={14} className="text-gray-500 mt-1 flex-shrink-0" />
                                    <h3 className="font-bold text-[15px] line-clamp-2 leading-tight group-hover:text-primary transition-colors" style={{ color: '#111827' }}>
                                        {post.title}
                                    </h3>
                                </div>
                                {post.author && (
                                    <p className="text-[11px] font-medium text-gray-400 pl-5">
                                        {post.author}
                                    </p>
                                )}
                            </div>
                            {post.imageUrl && (
                                <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="100px"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
