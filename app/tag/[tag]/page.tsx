import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import PostModel from "@/models/Post";
import SettingsModel from "@/models/Settings";
import CategoryModel from "@/models/Category";
import { Tag, ArrowLeft, Clock, Eye } from "lucide-react";
import { Post } from "@/lib/types";

interface TagPageProps {
    params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const settings = await SettingsModel.get();

    // Find posts that have this tag
    const posts = await PostModel.findByTag(decodedTag);

    // Build category name -> slug map for valid category links
    const allCategories = await CategoryModel.findAll();
    const categorySlugs = new Map(allCategories.map((c) => [c.name, c.slug]));

    // Get all tags for sidebar
    const allTags = await PostModel.getAllTags();

    return (
        <>
            <Header />
            <main className="bg-gray-50 min-h-screen py-8">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                        <Link href="/" className="hover:text-red-600 transition">
                            गृहपृष्ठ
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">ट्याग: {decodedTag}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Tag Header */}
                            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 mb-6 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold">
                                            #{decodedTag}
                                        </h1>
                                        <p className="text-white/80 text-sm">
                                            {posts.length} समाचारहरू
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {posts.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Tag size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-lg">
                                        &quot;{decodedTag}&quot; ट्यागको लागि कुनै समाचार भेटिएन
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 mt-4 text-red-600 hover:text-red-700 font-medium"
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
                                                    <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0 bg-gray-200 relative">
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 256px"
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
                                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition">
                                                        <Link href={`/post/${post.slug}`}>
                                                            {post.title}
                                                        </Link>
                                                    </h2>
                                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                        {post.excerpt}
                                                    </p>

                                                    {/* Tags */}
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {post.tags.slice(0, 4).map((t: string, idx: number) => {
                                                                const tagName = t.startsWith('#') ? t.substring(1) : t;
                                                                return (
                                                                    <Link
                                                                        key={idx}
                                                                        href={`/tag/${encodeURIComponent(tagName)}`}
                                                                        className={`text-xs px-2 py-1 rounded-full transition ${tagName === decodedTag
                                                                            ? "bg-red-600 text-white"
                                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                            }`}
                                                                    >
                                                                        #{tagName}
                                                                    </Link>
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
                                    <Tag size={18} className="text-red-600" />
                                    लोकप्रिय ट्यागहरू
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.slice(0, 20).map((t: { tag: string; count: number }, idx: number) => {
                                        const tagName = t.tag.startsWith('#') ? t.tag.substring(1) : t.tag;
                                        return (
                                            <Link
                                                key={idx}
                                                href={`/tag/${encodeURIComponent(tagName)}`}
                                                className={`text-sm px-3 py-1.5 rounded-full transition ${tagName === decodedTag
                                                    ? "bg-red-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
                                                    }`}
                                            >
                                                #{tagName}
                                                <span className="ml-1 text-xs opacity-70">({t.count})</span>
                                            </Link>
                                        );
                                    })}
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

export async function generateMetadata({ params }: TagPageProps) {
    const { tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";
    const ogImage = `${siteUrl}/images/og-image.png`;

    return {
        title: `#${decodedTag}`,
        description: `"${decodedTag}" ट्यागसँग सम्बन्धित नेपाली समाचार, मनोरञ्जन र अपडेटहरू Rangamanch मा पढ्नुहोस्।`,
        robots: { index: false, follow: true },
        alternates: {
            canonical: `${siteUrl}/tag/${encodeURIComponent(decodedTag)}`,
        },
        openGraph: {
            title: `#${decodedTag}`,
            description: `"${decodedTag}" ट्यागसँग सम्बन्धित नेपाली समाचार, मनोरञ्जन र अपडेटहरू Rangamanch मा पढ्नुहोस्।`,
            url: `${siteUrl}/tag/${encodeURIComponent(decodedTag)}`,
            siteName: "Rangamanch",
            type: "website",
            locale: "ne_NP",
            images: [{ url: ogImage, width: 1200, height: 630, alt: `#${decodedTag}` }],
        },
        twitter: {
            card: "summary",
            title: `#${decodedTag}`,
            description: `"${decodedTag}" ट्यागसँग सम्बन्धित नेपाली समाचारहरू`,
        },
    };
}
