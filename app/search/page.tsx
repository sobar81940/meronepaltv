import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import PostModel from "@/models/Post";
import SettingsModel from "@/models/Settings";
import CategoryModel from "@/models/Category";
import { Search, Tag, Clock, Eye, ArrowLeft } from "lucide-react";
import { Post } from "@/lib/types";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const query = params.q || "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";

    return {
        title: query ? `"${query}" को खोज नतिजा - MeroNepalTv` : "खोज - MeroNepalTv",
        description: query
            ? `MeroNepalTv मा "${query}" सम्बन्धित समाचार र जानकारी खोज्नुहोस्।`
            : "MeroNepalTv मा नेपाली समाचार, मनोरञ्जन र जानकारी खोज्नुहोस्।",
        robots: { index: false, follow: true },
        alternates: {
            canonical: `${siteUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
        },
    };
}

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";
    const settings = await SettingsModel.get();

    const normalizedQuery = query.trim().toLowerCase();
    const brandQueries = new Set([
        "MeroNepalTv",
        "MeroNepalTv.com",
        "ranga manch",
        "",
        "रंगमंच",
    ]);

    let posts: Post[] = [];
    if (brandQueries.has(normalizedQuery)) {
        // For branded searches, surface fresh published articles first.
        posts = await PostModel.findPublished(30);
    } else if (query.trim()) {
        posts = await PostModel.search(query);
    }

    // Get popular tags for suggestions
    const allTags = await PostModel.getAllTags();

    // Build category name -> slug map for valid category links
    const allCategories = await CategoryModel.findAll();
    const categorySlugs = new Map(allCategories.map((c) => [c.name, c.slug]));

    return (
        <>
            <Header />
            <main className="bg-gray-50 min-h-screen py-8">
                <div className="container mx-auto px-4">
                    {/* Search Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Search className="text-primary" size={32} />
                                खोज परिणाम
                            </h1>
                            {query.trim() && (
                                <p className="text-gray-600 mt-1">
                                    &quot;{query}&quot; को लागि {posts.length} परिणाम भेटियो
                                </p>
                            )}
                        </div>

                        {/* Search Form */}
                        <form
                            method="get"
                            action="/search"
                            className="w-full md:w-auto"
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    name="q"
                                    defaultValue={query}
                                    placeholder="खोज्नुहोस्..."
                                    className="w-full md:w-80 px-5 py-3 bg-white border border-gray-200 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary transition"
                                    aria-label="खोज्नुहोस्"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="flex-1">
                            {!query.trim() ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search size={40} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-lg">कृपया खोज शब्द प्रविष्ट गर्नुहोस्</p>
                                    <p className="text-gray-400 text-sm mt-2">तपाइँले खोज्न चाहनुभएको समाचार वा विषय टाइप गर्नुहोस्</p>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search size={40} className="text-red-400" />
                                    </div>
                                    <p className="text-gray-700 text-lg font-medium mb-2">
                                        &quot;{query}&quot; को लागि कुनै परिणाम भेटिएन
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        अर्को खोज शब्द प्रयोग गर्नुहोस् वा तलका लोकप्रिय ट्यागहरू हेर्नुहोस्
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 mt-6 text-red-600 hover:text-red-700 font-medium"
                                    >
                                        <ArrowLeft size={18} />
                                        गृहपृष्ठमा फर्कनुहोस्
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post: Post) => (
                                        <article
                                            key={post._id?.toString() || post.slug}
                                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {post.imageUrl && (
                                                    <div className="w-full md:w-48 h-40 md:h-auto flex-shrink-0 bg-gray-200 relative">
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 192px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 p-5">
                                                    {post.category && categorySlugs.has(post.category) && (
                                                        <Link
                                                            href={`/category/${categorySlugs.get(post.category)}`}
                                                            className="inline-block text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full mb-2 hover:bg-red-100 transition"
                                                        >
                                                            {post.category}
                                                        </Link>
                                                    )}
                                                    <h2 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition text-lg">
                                                        <Link href={`/post/${post.slug}`}>
                                                            {post.title}
                                                        </Link>
                                                    </h2>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                        {post.excerpt}
                                                    </p>

                                                    {/* Tags */}
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {post.tags.slice(0, 4).map((tag: string, idx: number) => {
                                                                const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
                                                                return (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                                                                    >
                                                                        {tagName}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <time dateTime={post.createdAt.toISOString()}>
                                                            {new Date(post.createdAt).toLocaleDateString("ne-NP")}
                                                        </time>
                                                        {post.readingTime && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {post.readingTime} मिनेट
                                                            </span>
                                                        )}
                                                        {post.viewCount !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                <Eye size={12} />
                                                                {post.viewCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Popular Tags */}
                        <aside className="w-full lg:w-80 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Tag size={18} className="text-primary" />
                                    लोकप्रिय ट्यागहरू
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.slice(0, 15).map((t: { tag: string; count: number }, idx: number) => {
                                        const tagName = t.tag.startsWith('#') ? t.tag.substring(1) : t.tag;
                                        return (
                                            <span
                                                        key={idx}
                                                        className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full"
                                                    >
                                                        {tagName}
                                                        <span className="ml-1 text-xs opacity-70">({t.count})</span>
                                                    </span>
                                        );
                                    })}
                                </div>

                                {/* Quick Search Suggestions */}
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">सुझावित खोजहरू</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {["राजनीति", "खेलकुद", "अर्थतन्त्र", "स्वास्थ्य", "शिक्षा"].map((suggestion, idx) => (
                                            <Link
                                                key={idx}
                                                href={`/search?q=${encodeURIComponent(suggestion)}`}
                                                className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition"
                                            >
                                                {suggestion}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer
                settings={settings.footerSettings}
                siteName={settings.siteName}
                logoUrl={settings.logoUrl}
                logoText={settings.logoText}
            />
        </>
    );
}


