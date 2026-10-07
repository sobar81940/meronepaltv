"use client";

import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";

interface Post {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    category?: string;
    excerpt?: string;
    createdAt: string;
    author?: string;
}

interface TechnologySectionProps {
    posts: Post[];
    title?: string;
    categorySlug?: string;
}

export default function TechnologySection({
    posts,
    title = "सूचना-प्रविधि",
    categorySlug = "technology",
}: TechnologySectionProps) {
    if (posts.length === 0) return null;

    const mainPost = posts[0];
    const leftSubPosts = posts.slice(1, 5);
    const rightSidePosts = posts.slice(5, 10);

    return (
        <section className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b-[3px] border-gray-100">
                <h2 data-home-title="true" className="text-2xl font-bold !text-black inline-block border-b-[3px] border-primary pb-2 -mb-[11px]">
                    {title}
                </h2>
                <Link
                    href={`/category/${categorySlug}`}
                    className="text-sm font-bold text-primary hover:text-primary/90 transition"
                >
                    सबै हेर्नुहोस्
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Main Post + 2x2 Grid */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Main Post */}
                    <Link href={`/post/${mainPost.slug}`} className="group block mb-2">
                        {mainPost.imageUrl && (
                            <div className="relative aspect-[16/9] w-full mb-4 overflow-hidden rounded bg-gray-100">
                                <Image
                                    src={mainPost.imageUrl}
                                    alt={mainPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}
                        <h3 data-home-title="true" className="text-2xl lg:text-3xl font-bold !text-black mb-3 group-hover:text-primary transition-colors leading-snug">
                            {mainPost.title}
                        </h3>
                        {mainPost.excerpt && (
                            <p className="text-gray-700 dark:text-gray-300 text-base line-clamp-2 leading-relaxed">
                                {stripHtmlTags(mainPost.excerpt)}
                            </p>
                        )}
                    </Link>

                    {/* 2x2 Grid */}
                    {leftSubPosts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 pt-4 border-t border-gray-100">
                            {leftSubPosts.map((post) => (
                                <Link key={post._id} href={`/post/${post.slug}`} className="group flex gap-4">
                                    {post.imageUrl && (
                                        <div className="relative w-28 h-20 flex-shrink-0 bg-gray-100 overflow-hidden rounded">
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                sizes="120px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h4 data-home-title="true" className="text-[16px] font-bold !text-black line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Vertical List */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {rightSidePosts.map((post) => (
                        <Link key={post._id} href={`/post/${post.slug}`} className="group flex gap-4 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                            {post.imageUrl && (
                                <div className="relative w-32 h-20 flex-shrink-0 bg-gray-100 overflow-hidden rounded">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="140px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="text-[17px] font-bold text-gray-900 line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                                    {post.title}
                                </h4>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
