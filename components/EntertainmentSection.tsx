import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Post {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    category?: string;
    excerpt?: string;
    createdAt: string;
}

interface EntertainmentSectionProps {
    posts: Post[];
    title: string;
    categorySlug: string;
}

export default function EntertainmentSection({ posts, title, categorySlug }: EntertainmentSectionProps) {
    if (posts.length === 0) return null;

    // Logic:
    // 0: Main Hero (Left)
    // 1-3: Right Sidebar Stack
    // 4-6: Bottom Row
    const mainPost = posts[0];
    const rightSidePosts = posts.slice(1, 4);
    const bottomPosts = posts.slice(4, 7);

    const subCats = [
        // { name: 'गसिप', slug: 'gossip' },
        // { name: 'हलिउड/बलिउड', slug: 'hollywood-bollywood' },
        // { name: 'संगीत', slug: 'music' },
        // { name: 'फिल्मी मनोरञ्जन', slug: 'film-entertainment' },
    ];

    return (
        <section className=" py-10 mb-12 rounded-lg relative overflow-hidden">
            {/* Background Pattern Hint (Optional, matching the "waves" in design if possible, simplified here) */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-white/20 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <h2 className="text-3xl font-bold text-black tracking-tight">
                            {title}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {/* {subCats.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/category/${cat.slug}`}
                                    className="px-4 py-1.5 bg-white text-[#2E1025] text-sm font-bold rounded-md hover:bg-gray-100 transition shadow-sm"
                                >
                                    {cat.name}
                                </Link>
                            ))} */}
                        </div>
                    </div>
                    <Link
                        href={`/category/${categorySlug}`}
                        className="text-black text-sm font-medium flex items-center gap-1 hover:text-gray-200 transition"
                    >
                        थप समाचार <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Hero Post (Left - 2 Cols - 66%) */}
                    <div className="lg:col-span-2">
                        <Link href={`/post/${mainPost.slug}`} className="group block relative h-[600px] rounded-xl overflow-hidden shadow-2xl">
                            {mainPost.imageUrl ? (
                                <Image
                                    src={mainPost.imageUrl}
                                    alt={mainPost.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-800" />
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                                    {mainPost.title}
                                </h3>
                            </div>
                        </Link>
                    </div>

                    {/* Right Stack (1 Col - 33%) */}
                    <div className="flex flex-col gap-6">
                        {rightSidePosts.map((post) => (
                            <Link key={post._id} href={`/post/${post.slug}`} className="group block relative h-[184px] rounded-xl overflow-hidden shadow-xl">
                                {post.imageUrl ? (
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-4 w-full">
                                    <h4 className="text-base font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                                        {post.title}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Row */}
                {bottomPosts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {bottomPosts.map((post) => (
                            <Link key={post._id} href={`/post/${post.slug}`} className="flex gap-4 group bg-black/20 hover:bg-black/30 transition p-3 rounded-xl items-center border border-white/5">
                                {/* Small Thumbnail */}
                                <div className="w-32 h-20 relative flex-shrink-0 aspect-[4/3] rounded-lg overflow-hidden">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-black text-base font-bold line-clamp-2 leading-tight group-hover:text-white-300 transition">
                                        {post.title}
                                    </h5>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
