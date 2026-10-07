import Link from "next/link";
import Image from "next/image";
import { stripHtmlTags } from "@/lib/utils";
import HeadlineAdSlot from "./HeadlineAdSlot";

interface HeadlinePost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    authorImage?: string;
    category?: string;
    categorySlug?: string;
    createdAt: string;
}

interface HeadlineSectionProps {
    posts: HeadlinePost[];
}

export default function HeadlineSection({ posts }: HeadlineSectionProps) {
    if (posts.length === 0) return null;

    return (
        <section className="mb-4 space-y-4" aria-label="मुख्य समाचार">
            {posts.map((post, index) => (
                <div key={post._id}>
                    <article className="group border-b border-gray-200 last:border-b-0 text-center">
                    {/* Category Badge */}
                    {post.category && (
                        <div className="mb-3">
                            <Link
                                href={`/category/${encodeURIComponent(post.categorySlug || post.category?.toLowerCase().replace(/\s+/g, '-') || '')}`}
                                data-home-title="true"
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 !text-black text-sm font-semibold rounded-full  hover:text-white transition-all duration-300 border border-primary/20 hover:border-transparent shadow-sm hover:shadow-md"
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {post.category}
                            </Link>
                        </div>
                    )}

                    {/* Title - Large, centered, primary color */}
                    <Link href={`/post/${post.slug}`}>
                        <h2 data-home-title="true" className="text-xl md:text-2xl lg:text-4xl font-bold !text-black hover:text-primary/80 no-underline transition-colors mb-4 leading-tight">
                            {post.title}
                        </h2>
                    </Link>

                    {/* Author / Date info - centered */}
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-5">
                        {post.author && (
                            <div className="flex items-center gap-2">
                                {post.authorImage ? (
                                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200">
                                        <Image
                                            src={post.authorImage}
                                            alt={post.author}
                                            fill
                                            sizes="28px"
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden" aria-hidden="true">
                                        {post.author.charAt(0)}
                                    </div>
                                )}
                                <span className="font-medium text-gray-700">{post.author}</span>
                            </div>
                        )}
                        {/* <time className="flex items-center gap-1" dateTime={post.createdAt}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeWidth="2" d="M12 6v6l4 2" />
                            </svg>
                            {new Date(post.createdAt).toLocaleDateString('ne-NP')}
                        </time> */}
                        <span className="flex items-center gap-1" title="टिप्पणीहरू">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span aria-hidden="true">0</span>
                        </span>
                    </div>

                    {/* Featured Image */}
                    {post.imageUrl && (
                        <Link href={`/post/${post.slug}`} className="block mb-4">
                            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 max-w-6xl mx-auto shadow-lg">
                                <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    fetchPriority={index === 0 ? "high" : undefined}
                                />
                            </div>
                        </Link>
                    )}

                    {/* Excerpt / Summary - centered */}
                    {post.excerpt && (
                        <p className="text-gray-600 text-base leading-relaxed max-w-4xl mx-auto">
                            {stripHtmlTags(post.excerpt)}
                        </p>
                    )}
                    </article>

                    {/* Advertisement below each post */}
                    <div className="py-2">
                        <HeadlineAdSlot index={index} />
                    </div>
                </div>
            ))}
        </section>
    );
}
