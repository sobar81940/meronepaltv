"use client";

import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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

interface BusinessSectionProps {
    posts: Post[];
    title?: string;
    categorySlug?: string;
}

/**
 * Business / Economy ("अर्थ/व्यापार") home section.
 *
 * Layout (matches the approved design):
 *   - One large featured post: image on the left, a solid blue panel on the
 *     right with the title + excerpt in white.
 *   - Below: a 2×2 grid of four smaller posts (thumbnail + title).
 * Shows up to 5 posts total (1 featured + 4 grid).
 */
export default function BusinessSection({
    posts,
    title = "अर्थ/व्यापार",
    categorySlug = "arthwyapar",
}: BusinessSectionProps) {
    if (posts.length === 0) return null;

    const featured = posts[0];
    const gridPosts = posts.slice(1, 5);

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-0 border-b-[2px] border-gray-100">
                <h2
                    data-home-title="true"
                    className="text-3xl font-extrabold !text-black inline-block border-b-[3px] border-primary pb-2 -mb-[2px]"
                >
                    {title}
                </h2>
                <Link
                    href={`/category/${categorySlug}`}
                    className="flex justify-center items-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                    aria-label={`${title} - थप समाचार`}
                >
                    <ChevronRight size={20} />
                </Link>
            </div>

            {/* Featured Post: image left, blue panel right */}
            <Link
                href={`/post/${featured.slug}`}
                className="group grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-sm mb-8"
            >
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden bg-gray-100">
                    {featured.imageUrl ? (
                        <Image
                            src={featured.imageUrl}
                            alt={featured.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            unoptimized
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
                <div className="bg-secondary text-white p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                    <h3
                        data-home-title="true"
                        className=" text-black text-2xl md:text-3xl lg:text-[2.1rem] font-extrabold  leading-[1.35] mb-4"
                    >
                        {featured.title}
                    </h3>
                    {featured.excerpt && (
                        <p className="text-black/85 text-sm md:text-base leading-relaxed line-clamp-3">
                            {stripHtmlTags(featured.excerpt)}
                        </p>
                    )}
                </div>
            </Link>

            {/* 2×2 Grid of smaller posts */}
            {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {gridPosts.map((post) => (
                        <Link
                            key={post._id}
                            href={`/post/${post.slug}`}
                            className="group flex gap-4 items-center"
                        >
                            {post.imageUrl && (
                                <div className="relative w-28 h-20 md:w-32 md:h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded-sm">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 120px, 140px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <h4
                                data-home-title="true"
                                className="flex-1 text-base md:text-lg font-bold !text-black leading-snug line-clamp-3 group-hover:text-primary transition-colors"
                            >
                                {post.title}
                            </h4>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
