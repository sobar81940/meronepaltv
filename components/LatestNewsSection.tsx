import Link from "next/link";
import Image from "next/image";
import { Clock, MoreVertical } from "lucide-react";
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
    authorImage?: string;
}

interface LatestNewsSectionProps {
    posts: Post[];
    title?: string;
}

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "भर्खरै";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} मिनेट अगाडि`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} घण्टा अगाडि`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} दिन अगाडि`;
    return date.toLocaleDateString("ne-NP");
}

export default function LatestNewsSection({ posts, title = "ताजा समाचार" }: LatestNewsSectionProps) {
    if (posts.length === 0) return null;

    return (
        <section className="mb-8">
            <h2 data-home-title="true" className="text-2xl font-bold !text-black mb-4 flex items-center gap-2">
                <span className="w-1 h-8 bg-blue-600 rounded" aria-hidden="true"></span>
                {title}
            </h2>

            {/* Desktop View (Grid) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <article
                        key={`desktop-${post._id}`}
                        className="bg-white rounded-xl shadow overflow-hidden group hover:shadow-lg transition flex flex-col h-full"
                    >
                        <div className="aspect-video bg-gray-200 relative overflow-hidden">
                            {post.imageUrl && (
                                <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            {post.category && (
                                <span className="text-xs text-blue-600 font-medium mb-1 inline-block">
                                    {post.category}
                                </span>
                            )}
                            <h3 data-home-title="true" className=" text-xl font-bold !text-black mb-3 line-clamp-2 group-hover:text-blue-600 transition">
                                <Link href={`/post/${post.slug}`}>
                                    {post.title}
                                </Link>
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                                {stripHtmlTags(post.excerpt || "")}
                            </p>
                            <div className="mt-auto flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                                <span className="font-medium">{post.author || 'सम्पादक'}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Mobile View (List) - Centered Design */}
            <div className="md:hidden flex flex-col divide-y divide-gray-200">
                {posts.map((post) => (
                    <article key={`mobile-${post._id}`} className="py-8 first:pt-4 bg-white relative text-center">
                        {/* More Options Icon */}
                        <button className="absolute top-8 right-0 text-gray-400 p-2" aria-label="More options">
                            <MoreVertical size={20} />
                        </button>

                        <Link href={`/post/${post.slug}`} className="block mb-4 px-4">
                            <h3 data-home-title="true" className="text-2xl font-bold !text-black leading-tight group-hover:text-blue-700 transition-colors">
                                {post.title}
                            </h3>
                        </Link>

                        <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                    {post.authorImage ? (
                                        <Image
                                            src={post.authorImage}
                                            alt={post.author || 'Author'}
                                            fill
                                            sizes="20px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                                            {post.author ? post.author.charAt(0) : 'N'}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                    {post.author || 'News Portal'}
                                </span>
                            </div>

                            <div className="w-px h-3 bg-gray-300"></div>

                            <div className="flex items-center gap-1 text-gray-500">
                                {/* Date hidden as per request */}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
