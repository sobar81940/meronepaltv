"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PROVINCES } from "@/lib/types";
import { stripHtmlTags } from "@/lib/utils";

interface Post {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    province?: string;
    category?: string;
    createdAt: string;
}

interface ProvinceNewsSectionProps {
    posts: Post[];
}

export default function ProvinceNewsSection({ posts }: ProvinceNewsSectionProps) {
    // Default to "Bagmati Pradesh" or "all" depending on preference. 
    // Given the extensive list, "Bagmati" is often a sensible default for Nepali portals, 
    // or just the first province in the list. Let's stick to "all" or the first one.
    const [activeProvince, setActiveProvince] = useState<string>("all");

    // A post counts as "province news" if it has a Province assigned OR it
    // belongs to the "प्रदेश" category (how legacy/migrated data classifies it).
    const provincePosts = posts.filter((p) => p.province || p.category === "प्रदेश");

    // Filter based on selected province tab. The named-province tabs match on
    // the province field; "सबै" (all) shows every province post.
    const filteredPosts =
        activeProvince === "all"
            ? provincePosts
            : provincePosts.filter((p) => p.province === activeProvince);

    // 1. Featured Post (Left, Big)
    const featuredPost = filteredPosts[0];
    // 2. Sub-Featured Post (Middle Top)
    const subFeaturedPost = filteredPosts[1];
    // 3. Middle List (Middle Bottom)
    const middleListPosts = filteredPosts.slice(2, 4);
    // 4. Right List (Right Column)
    const rightListPosts = filteredPosts.slice(4, 9);

    if (provincePosts.length === 0) {
        return null;
    }

    return (
        <section className="mb-12">
            {/* Top Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-2">
                {/* Province Tabs */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                    <button
                        onClick={() => setActiveProvince("all")}
                        className={`whitespace-nowrap px-4 py-1.5 rounded border text-sm font-medium transition-colors ${activeProvince === "all"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                            }`}
                    >
                        सबै
                    </button>
                    {PROVINCES.map((province) => (
                        <button
                            key={province.slug}
                            onClick={() => setActiveProvince(province.name)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded border text-sm font-medium transition-colors ${activeProvince === province.name
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                                }`}
                        >
                            {province.name}
                        </button>
                    ))}
                </div>

                {/* See More Link */}
                <Link
                    href="/pradesh"
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded hover:bg-blue-200 transition-colors self-start md:self-auto"
                >
                    थप समाचार
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>

            {/* Main Grid Content */}
            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Left Column: Main Featured Post (5 cols) */}
                    <div className="lg:col-span-6">
                        {featuredPost && (
                            <article className="group h-full flex flex-col">
                                <Link href={`/post/${featuredPost.slug}`} className="block relative aspect-video w-full overflow-hidden rounded-lg mb-3">
                                    {featuredPost.imageUrl ? (
                                        <Image
                                            src={featuredPost.imageUrl}
                                            alt={featuredPost.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    {featuredPost.province && (
                                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                                            {featuredPost.province}
                                        </span>
                                    )}
                                </Link>
                                <Link href={`/post/${featuredPost.slug}`}>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                </Link>
                                {featuredPost.excerpt && (
                                    <p className="mt-2 text-gray-600 line-clamp-3 text-base">
                                        {stripHtmlTags(featuredPost.excerpt)}
                                    </p>
                                )}
                            </article>
                        )}
                    </div>

                    {/* Middle Column (3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        {/* Top: Sub Featured */}
                        {subFeaturedPost && (
                            <article className="group">
                                <Link href={`/post/${subFeaturedPost.slug}`} className="block relative aspect-video w-full overflow-hidden rounded-lg mb-2">
                                    {subFeaturedPost.imageUrl ? (
                                        <Image
                                            src={subFeaturedPost.imageUrl}
                                            alt={subFeaturedPost.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200" />
                                    )}
                                </Link>
                                <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors">
                                    <Link href={`/post/${subFeaturedPost.slug}`}>
                                        {subFeaturedPost.title}
                                    </Link>
                                </h3>
                            </article>
                        )}

                        {/* Bottom: List */}
                        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
                            {middleListPosts.map((post) => (
                                <article key={post._id} className="group flex gap-3 items-start">
                                    {post.imageUrl && (
                                        <Link href={`/post/${post.slug}`} className="flex-shrink-0 w-20 h-14 relative overflow-hidden rounded bg-gray-100">
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                unoptimized
                                            />
                                        </Link>
                                    )}
                                    <h4 className="text-sm font-medium text-gray-900 leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                                        <Link href={`/post/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h4>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: List of posts (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="flex flex-col gap-5 h-full">
                            {rightListPosts.map((post) => (
                                <article key={post._id} className="group flex gap-3 items-start pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                                    {post.imageUrl && (
                                        <Link href={`/post/${post.slug}`} className="flex-shrink-0 w-24 h-16 relative overflow-hidden rounded bg-gray-100">
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                sizes="96px"
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                unoptimized
                                            />
                                        </Link>
                                    )}
                                    <h4 className="text-sm font-medium text-gray-900 leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                                        <Link href={`/post/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h4>
                                </article>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <p className="text-gray-500">
                        {activeProvince === 'all'
                            ? "कुनै प्रदेश समाचार फेला परेन"
                            : `${activeProvince}को लागि कुनै समाचार फेला परेन`}
                    </p>
                </div>
            )}
        </section>
    );
}
