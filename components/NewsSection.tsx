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

interface NewsSectionProps {
    posts: Post[];
    title?: string;
    categorySlug?: string;
}

export default function NewsSection({
    posts,
    title = "समाचार",
    categorySlug = "news",
}: NewsSectionProps) {
    if (posts.length === 0) return null;

    const mainPost = posts[0];
    const listPosts = posts.slice(1, 7);

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-0 border-b-[2px] border-gray-100">
                <h2 data-home-title="true" className="text-3xl font-extrabold !text-black inline-block border-b-[3px] border-primary pb-2 -mb-[2px]">
                    {title}
                </h2>
                <Link
                    href={`/category/${categorySlug}`}
                    className="flex justify-center items-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                >
                    <ChevronRight size={20} />
                </Link>
            </div>

            {/* Main Post */}
            <Link href={`/post/${mainPost.slug}`} className="group block mb-8 bg-card overflow-hidden hover:shadow-md transition">
                <div className="flex flex-col md:flex-row">
                    {/* Left: Image */}
                    {mainPost.imageUrl && (
                        <div className="relative w-full md:w-[55%] aspect-video md:aspect-[4/3] lg:aspect-[16/10] overflow-hidden">
                            <Image
                                src={mainPost.imageUrl}
                                alt={mainPost.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    )}
                    {/* Right: Content */}
                    <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center w-full md:w-[45%] bg-white">
                        <h3 data-home-title="true" className="text-2xl md:text-3xl lg:text-4xl font-extrabold !text-black mb-4 group-hover:text-primary transition-colors leading-[1.3]">
                            {mainPost.title}
                        </h3>
                        {mainPost.excerpt && (
                            <p className="text-gray-700 lg:text-lg line-clamp-3 leading-relaxed">
                                {stripHtmlTags(mainPost.excerpt)}
                            </p>
                        )}
                    </div>
                </div>
            </Link>

            {/* List Posts Grid */}
            {listPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {listPosts.map((post) => (
                        <Link key={post._id} href={`/post/${post.slug}`} className="group flex gap-5 items-center bg-white rounded-lg hover:shadow-sm transition p-2 -m-2">
                            {post.imageUrl && (
                                <div className="relative w-32 h-20 md:w-36 md:h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 150px, 200px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 data-home-title="true" className="text-[17px] md:text-lg font-bold !text-black line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                                    {post.title}
                                </h4>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
