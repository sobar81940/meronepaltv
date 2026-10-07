"use client";

import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface SportsPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    category?: string;
    createdAt: string;
}

interface SportsSectionProps {
    posts: SportsPost[];
    title?: string;
    categorySlug?: string;
}

export default function SportsSection({
    posts,
    title = "खेलकुद",
    categorySlug = "sports",
}: SportsSectionProps) {
    if (posts.length === 0) return null;

    // Main featured post (left)
    const mainPost = posts[0];
    // List sidebar posts (right, 5 posts max)
    const rightSidePosts = posts.slice(1, 6);

    return (
        <section className="mb-8 p-4 md:p-6 rounded-2xl bg-[#FFF5F6] border border-red-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    {/* A logo placeholder matching user's image, otherwise a lucide icon */}
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm overflow-hidden text-[#1a1f2e]">
                        {/* Try using a sports icon if exact logo isn't available */}
                        <Trophy size={16} className="text-red-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1a1f2e]">
                        {title}
                    </h2>
                </div>
                <Link
                    href={`/category/${categorySlug}`}
                    className="text-sm font-bold text-blue-900 hover:text-blue-700 transition"
                >
                    सबै
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="p-6 ">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

                    {/* LEFT: Featured */}
                    <div className="lg:col-span-8">
                        <Link href={`/post/${mainPost.slug}`} className="block overflow-hidden rounded-2xl bg-white shadow group h-full">
                            {/* Image */}
                            <div className="relative">
                                {mainPost.imageUrl && (
                                    <Image
                                        src={mainPost.imageUrl}
                                        alt={mainPost.title}
                                        width={1600}
                                        height={1000}
                                        className="h-[320px] w-full object-cover md:h-[380px] group-hover:scale-105 transition-transform duration-700"
                                    />
                                )}
                                {/* subtle inset border like screenshot */}
                                <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5"></div>
                            </div>

                            {/* Text */}
                            <div className="p-6 md:p-7">
                                <h2 className="text-2xl font-extrabold leading-snug text-[#1f1f1f] md:text-3xl group-hover:text-red-700 transition">
                                    {mainPost.title}
                                </h2>
                                {mainPost.excerpt && (
                                    <p className="mt-4 text-[15px] leading-7 text-[#3b3b3b] line-clamp-3">
                                        {stripHtmlTags(mainPost.excerpt)}
                                    </p>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT: List */}
                    <div className="lg:col-span-4">
                        <div className="space-y-5 h-full flex flex-col  gap-8 justify-between">
                            {rightSidePosts.map((post) => (
                                <Link
                                    key={post._id}
                                    href={`/post/${post.slug}`}
                                    className="block rounded-2xl bg-white p-4 shadow transition hover:shadow-md group h-full flex-1 flex flex-col justify-center"
                                >
                                    <div className="flex items-center gap-4">
                                        {post.imageUrl ? (
                                            <div className="relative h-14 w-20 flex-shrink-0">
                                                <Image
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    fill
                                                    sizes="80px"
                                                    className="rounded-xl object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#f6f1f1] text-2xl flex-shrink-0">
                                                🏏
                                            </div>
                                        )}
                                        <div className="text-[17px] font-extrabold leading-tight text-[#1f1f1f] group-hover:text-red-700 transition line-clamp-3">
                                            {post.title}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
