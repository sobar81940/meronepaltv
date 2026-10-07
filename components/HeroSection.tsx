import Link from "next/link";
import Image from "next/image";
import { SidebarTopAd } from "@/components/HomeAds";
import { Clock, ArrowRight, Flame } from "lucide-react";
import { stripHtmlTags } from "@/lib/utils";

interface Post {
    _id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    category?: string;
    excerpt?: string;
    createdAt?: string;
    author?: string;
    authorImage?: string;
}

interface HeroSectionProps {
    featuredPost: Post | null;
    sidebarPosts: Post[];
}

export default function HeroSection({ featuredPost, sidebarPosts }: HeroSectionProps) {
    if (!featuredPost) return null;

    return (
        <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Featured Post (8 cols) */}
                <div className="lg:col-span-8">
                    <Link href={`/post/${featuredPost.slug}`} className="group relative block h-[450px] md:h-[550px] w-full rounded-2xl overflow-hidden shadow-2xl">
                        {featuredPost.imageUrl && (
                            <Image
                                src={featuredPost.imageUrl}
                                alt={featuredPost.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-11/12 lg:w-4/5">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-block px-3 py-1 bg-red-600/90 text-white text-xs font-bold  tracking-wider rounded-md backdrop-blur-sm">
                                    {featuredPost.category || 'Breaking News'}
                                </span>
                                {/* <span className="text-gray-300 text-xs font-medium tracking-wide">
                                    {featuredPost.createdAt ? new Date(featuredPost.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                                </span> */}
                            </div>

                            <h2 className="text-xl md:text-3xl lg:text-xl font-bold text-white leading-tight mb-4 drop-shadow-md">
                                {featuredPost.title}
                            </h2>

                            <p className="hidden md:block text-gray-200 text-base md:text-lg line-clamp-2 mb-6 leading-relaxed opacity-90">
                                {stripHtmlTags(featuredPost.excerpt || "")}
                            </p>


                        </div>
                    </Link>
                </div>

                {/* Sidebar (4 cols) - "Fresh News" Dark Card */}
                <div className="lg:col-span-4 flex flex-col h-full">
                    <div className="bg-[#1e1e2d] border border-white/10 rounded-2xl p-6 h-full flex flex-col shadow-xl relative overflow-hidden">
                        {/* Subtle ambient glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10 flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                            <Flame className="text-red-500" fill="currentColor" size={24} />
                            <h2 className="text-xl font-bold text-white tracking-tight">ताजा समाचार</h2>
                        </div>

                        <div className="relative z-10 flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {sidebarPosts.map((post) => (
                                <Link key={post._id} href={`/post/${post.slug}`} className="flex gap-4 group">
                                    <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                        {post.imageUrl && (
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-110 transition duration-300"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-gray-100 font-medium text-sm leading-snug line-clamp-2 mb-2 group-hover:text-red-400 transition">
                                            {post.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('ne-NP') : ''}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-right">
                            <Link href="/category/news" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group">
                                थप हेर्नुहोस् <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ad below Hero */}
            <div className="mt-8">
                <SidebarTopAd />
            </div>
        </section>
    );
}
