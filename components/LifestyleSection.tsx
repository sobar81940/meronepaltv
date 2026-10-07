"use client";

import Link from "next/link";
import Image from "next/image";

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

interface LifestyleSectionProps {
    posts: Post[];
    title?: string;
    categorySlug?: string;
}

export default function LifestyleSection({
    posts,
    title = "जीवनशैली",
    categorySlug = "lifestyle",
}: LifestyleSectionProps) {
    if (posts.length === 0) return null;

    // We will distribute the posts into 3 columns.
    // Top 3 posts will be the "Main" posts for each column.
    // The rest will be distributed as "List" posts below the main posts.
    const mainPosts = posts.slice(0, 3);
    const listPosts = posts.slice(3, 12); // Up to 9 list posts (3 per column)

    const getColumnPosts = (columnIndex: number) => {
        // Return 1 main post (if exists) and its corresponding list posts
        const main = mainPosts[columnIndex];
        if (!main) return null;

        // Distribute list posts across the 3 columns
        const columnListPosts = listPosts.filter((_, index) => index % 3 === columnIndex);

        return { main, items: columnListPosts };
    };

    return (
        <section className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b-[3px] border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-[3px] border-primary pb-2 -mb-[11px]">
                    {title}
                </h2>
                <Link
                    href={`/category/${categorySlug}`}
                    className="text-sm font-bold text-primary hover:text-primary/90 transition"
                >
                    सबै हेर्नुहोस्
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[0, 1, 2].map((colIndex) => {
                    const colData = getColumnPosts(colIndex);
                    if (!colData) return null;

                    return (
                        <div key={colIndex} className="flex flex-col gap-6">
                            {/* Main Post for the Column */}
                            <Link href={`/post/${colData.main.slug}`} className="group block mb-2">
                                {colData.main.imageUrl && (
                                    <div className="relative aspect-[16/9] w-full mb-3 overflow-hidden rounded bg-gray-100">
                                        <Image
                                            src={colData.main.imageUrl}
                                            alt={colData.main.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-3">
                                    {colData.main.title}
                                </h3>
                            </Link>

                            {/* List Posts beneath the Main Post */}
                            <div className="flex flex-col gap-4">
                                {colData.items.map((post) => (
                                    <Link key={post._id} href={`/post/${post.slug}`} className="group flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        {post.imageUrl && (
                                            <div className="relative w-28 h-20 flex-shrink-0 bg-gray-100 overflow-hidden rounded">
                                                <Image
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    fill
                                                    sizes="112px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="text-[15px] font-bold text-gray-900 line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                                                {post.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
