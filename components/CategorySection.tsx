import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { stripHtmlTags } from "@/lib/utils";

interface Post {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    category?: string;
    excerpt?: string;
    createdAt: string;
}

interface CategorySectionProps {
    posts: Post[];
    title: string;
    categorySlug: string;
    layout?: 'grid' | 'list' | 'featured' | 'magazine';
}

export default function CategorySection({ posts, title, categorySlug, layout = 'grid' }: CategorySectionProps) {
    if (posts.length === 0) return null;

    // Determine the main post and list posts based on layout
    const mainPost = posts[0];
    const listPosts = layout === 'magazine' ? posts.slice(1, 4) : posts.slice(1);

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111827' }}>
                    <span className="w-1 h-8 bg-primary rounded" aria-hidden="true"></span>
                    {title}
                </h2>
                <Link
                    href={`/category/${categorySlug}`}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90 transition"
                    aria-label={`${title} थप हेर्नुहोस्`}
                >
                    थप हेर्नुहोस् <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>

            {/* Magazine Layout - Featured + List */}
            {layout === 'magazine' && mainPost && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Featured Post (Large) */}
                        <div className="lg:col-span-8">
                            <article className="bg-white rounded-xl shadow overflow-hidden group hover:shadow-lg transition flex flex-col h-full">
                                {mainPost.imageUrl && (
                                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                        <Image
                                            src={mainPost.imageUrl}
                                            alt={mainPost.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 66vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition" style={{ color: '#111827' }}>
                                        <Link href={`/post/${mainPost.slug}`} style={{ color: 'inherit' }}>
                                            {mainPost.title}
                                        </Link>
                                    </h3>
                                    {mainPost.excerpt && (
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-2 flex-1">
                                            {stripHtmlTags(mainPost.excerpt)}
                                        </p>
                                    )}
                                </div>
                            </article>
                        </div>

                        {/* List Posts (Side List) */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            {listPosts.map((post) => (
                                <article key={post._id} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition flex">
                                    {post.imageUrl && (
                                        <div className="relative w-20 h-14 flex-shrink-0 bg-gray-100 overflow-hidden">
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    <div className="p-3 flex-1 flex flex-col">
                                        <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition" style={{ color: '#111827' }}>
                                            <Link href={`/post/${post.slug}`} style={{ color: 'inherit' }}>
                                                {post.title}
                                            </Link>
                                        </h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Grid Layout (default) */}
            {layout !== 'magazine' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {posts.map((post) => (
                        <article
                            key={post._id}
                            className="bg-white rounded-xl shadow overflow-hidden group hover:shadow-lg transition flex flex-col h-full"
                        >
                            <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                {post.imageUrl && (
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        unoptimized
                                    />
                                )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition" style={{ color: '#111827' }}>
                                    <Link href={`/post/${post.slug}`} style={{ color: 'inherit' }}>
                                        {post.title}
                                    </Link>
                                </h3>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
