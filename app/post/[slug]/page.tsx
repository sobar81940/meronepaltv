import PostModel from "@/models/Post";
import UserModel from "@/models/User";
import CategoryModel from "@/models/Category";
import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Tag, Share2, Facebook, Twitter, Clock, Eye, Linkedin, Sparkles } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import InArticleAd from "@/components/InArticleAd";
import SidebarAd from "@/components/SidebarAd";
import { ContentBlock } from "@/lib/types";
import { Metadata } from "next";
import { stripHtmlTags } from "@/lib/utils";
import { cache } from "react";
import { headers } from "next/headers";

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

// Helper function to get client IP address
function getClientIP(headersList: Awaited<ReturnType<typeof headers>>): string {
    // Check for IP in various headers (in order of preference)
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    
    const realIP = headersList.get("x-real-ip");
    if (realIP) {
        return realIP;
    }
    
    const clientIP = headersList.get("x-client-ip");
    if (clientIP) {
        return clientIP;
    }
    
    // Fallback to localhost if not found
    return "127.0.0.1";
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Memoize the DB call for the request lifecycle so generateMetadata and the page don't make duplicate queries
const getPostBySlug = cache(async (slug: string) => {
    return await PostModel.findBySlug(slug);
});

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: "Post Not Found",
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const postUrl = `${siteUrl}/post/${post.slug}`;
    const description = stripHtmlTags(post.excerpt || post.title || "");
    const imageUrl = post.imageUrl
        ? (post.imageUrl.startsWith("http") ? post.imageUrl : `${siteUrl}${post.imageUrl}`)
        : undefined;

    return {
        title: post.title,
        description: description,
        authors: post.author ? [{ name: post.author }] : undefined,
        keywords: post.tags?.join(", "),
        alternates: {
            canonical: postUrl,
            languages: {
              ne: postUrl,
            },
        },
        openGraph: {
            type: "article",
            title: post.title,
            description: description,
            url: postUrl,
            siteName: "MeroNepalTv",
            publishedTime: new Date(post.createdAt).toISOString(),
            modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
            authors: post.author ? [post.author] : undefined,
            section: post.category,
            tags: post.tags,
            locale: "ne_NP",
            images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: post.title }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: description,
            images: imageUrl ? [imageUrl] : undefined,
        },
    };
}

// Helper function to get relative time in Nepali
function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "भर्खरै";
    if (diffMins < 60) return `${diffMins} मिनेट अगाडि`;
    if (diffHours < 24) return `${diffHours} घण्टा अगाडि`;
    if (diffDays < 7) return `${diffDays} दिन अगाडि`;

    return date.toLocaleDateString("ne-NP", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// Format date in Nepali format
function formatDate(date: Date): string {
    return date.toLocaleDateString("ne-NP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Helper function to unescape HTML entities that might be stored as text
function unescapeHtml(html: string): string {
    if (!html) return "";
    return html
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
}

// Format view count with Nepali numbers
function formatViewCount(count: number): string {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

// Extract video embed URL from various platforms
function getVideoEmbedUrl(url: string): string {
    if (!url) return "";

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // For other URLs, return as-is (might be direct embed URL)
    return url;
}

// Content Block Renderer Component
function ContentBlockRenderer({ block }: { block: ContentBlock }) {
    switch (block.type) {
        case 'text':
            return (
                <div
                    className="article-content text-3xl text-gray-800 leading-[1.9] mb-6"
                    dangerouslySetInnerHTML={{ __html: unescapeHtml(block.content) }}
                />
            );

        case 'heading':
            return (
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-3 shrink-0"></span>
                    {block.content}
                </h2>
            );

        case 'quote':
            return (
                <blockquote className="my-8 bg-gradient-to-r from-gray-50 to-white border-l-4 border-red-600 py-6 px-6 rounded-r-lg shadow-sm">
                    <p className="text-xl italic text-gray-700 leading-relaxed mb-3">
                        &ldquo;{block.content}&rdquo;
                    </p>
                    {block.caption && (
                        <footer className="text-gray-500 font-medium text-sm">
                            — {block.caption}
                        </footer>
                    )}
                </blockquote>
            );

        case 'image':
            return (
                <figure className="my-8">
                    {block.mediaUrl && (
                        <div className="rounded-lg overflow-hidden shadow-md relative aspect-video w-full">
                            <Image
                                src={block.mediaUrl}
                                alt={block.caption || "Article image"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}
                    {block.caption && (
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'video':
            const embedUrl = getVideoEmbedUrl(block.mediaUrl || "");
            return (
                <figure className="my-8">
                    <div className="aspect-video rounded-lg overflow-hidden shadow-md bg-black">
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={block.caption || "Video content"}
                        />
                    </div>
                    {block.caption && (
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'embed':
            return (
                <div className="my-8">
                    <div
                        className="embed-container overflow-hidden rounded-lg [&>iframe]:max-w-full [&>iframe]:rounded-lg [&>video]:max-w-full [&>video]:rounded-lg [&>blockquote]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: block.embedCode || "" }}
                    />
                </div>
            );

        default:
            return null;
    }
}

export default async function PostDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post || !post.published) {
        notFound();
    }

    // Fetch author details if authorId exists, otherwise try by name
    const fetchAuthor = async () => {
        let auth = post.authorId ? await UserModel.findById(post.authorId) : null;
        if ((!auth || !auth.profileImage) && post.author) {
            const authorByName = await UserModel.findByName(post.author);
            if (authorByName && authorByName.profileImage) {
                auth = authorByName;
            }
        }
        return auth;
    };

    // Increment view count and refresh the post data
    const headersList = await headers();
    const clientIP = getClientIP(headersList);
    await PostModel.incrementViewCount(slug, clientIP).catch(console.error);
    const updatedPost = await PostModel.findBySlug(slug);
    const displayPost = updatedPost || post;

    // Resolve category slug from category name for valid /category/{slug} links
    const category = displayPost.category ? await CategoryModel.findByName(displayPost.category) : null;
    const categoryUrl = category ? `/category/${category.slug}` : null;

    // Get author, related, recent, and trending posts concurrently
    const [author, relatedPosts, recentPosts, trendingPosts] = await Promise.all([
        fetchAuthor(),
        displayPost.category
            ? PostModel.findRelatedPosts(displayPost.category, 4, displayPost._id.toString())
            : Promise.resolve([]),
        PostModel.findRecentPosts(5, displayPost._id.toString()),
        PostModel.findTrendingPosts(5, displayPost._id.toString())
    ]);

    // Sort content blocks by order if they exist
    const sortedBlocks = displayPost.contentBlocks
        ? [...displayPost.contentBlocks].sort((a, b) => a.order - b.order)
        : [];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const shareUrl = `${siteUrl}/post/${displayPost.slug}`;

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="container mx-auto px-4 py-6">
                {/* JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "NewsArticle",
                            "headline": displayPost.title,
                            "description": stripHtmlTags(displayPost.excerpt || displayPost.title || ""),
                            "image": displayPost.imageUrl ? (displayPost.imageUrl.startsWith("http") ? displayPost.imageUrl : `${siteUrl}${displayPost.imageUrl}`) : `${siteUrl}/images/og-image.png`,
                            "datePublished": new Date(displayPost.createdAt).toISOString(),
                            "dateModified": new Date(displayPost.updatedAt || displayPost.createdAt).toISOString(),
                            "author": [{
                                "@type": "Person",
                                "name": displayPost.author || "सम्पादक",
                            }],
                            "publisher": {
                            "@type": "NewsMediaOrganization",
                            "@id": `${siteUrl}/#organization`,
                            "name": "MeroNepalTv",
                            "url": siteUrl,
                            "logo": {
                                "@type": "ImageObject",
                                "@id": `${siteUrl}/#logo`,
                                "url": `${siteUrl}/images/og-image.png`,
                            },
                            },
                            "mainEntityOfPage": {
                                "@type": "WebPage",
                                "@id": shareUrl,
                            },
                            "articleSection": displayPost.category || undefined,
                            "keywords": displayPost.tags?.join(", "),
                            "inLanguage": "ne-NP",
                            "isAccessibleForFree": true,
                            "isPartOf": {
                                "@id": `${siteUrl}/#website`,
                            },
                        }),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                {
                                    "@type": "ListItem",
                                    "position": 1,
                                    "name": "गृहपृष्ठ",
                                    "item": siteUrl,
                                },
                                ...(displayPost.category ? [{
                                    "@type": "ListItem",
                                    "position": 2,
                                    "name": displayPost.category,
                                    "item": categoryUrl ? `${siteUrl}${categoryUrl}` : `${siteUrl}/category/${displayPost.category}`,
                                }] : []),
                                {
                                    "@type": "ListItem",
                                    "position": displayPost.category ? 3 : 2,
                                    "name": displayPost.title,
                                    "item": shareUrl,
                                },
                            ],
                        }),
                    }}
                />

                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                    <Link href="/" className="hover:text-red-600 transition">गृहपृष्ठ</Link>
                    <span className="mx-2 text-gray-300">/</span>
                    {displayPost.category && (
                        <>
                            {categoryUrl ? (
                                <Link href={categoryUrl} className="hover:text-red-600 transition">
                                    {displayPost.category}
                                </Link>
                            ) : (
                                <span className="text-gray-700">{displayPost.category}</span>
                            )}
                            <span className="mx-2 text-gray-300">/</span>
                        </>
                    )}
                    <span className="text-gray-700">{displayPost.title.substring(0, 40)}...</span>
                </nav>

                {/* Three Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar - Author & Share (Sticky) */}
                    <aside className="hidden lg:block lg:col-span-2">
                        <div className="sticky top-24 space-y-6">
                            {/* Author Info */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden border-2 border-gray-200 relative">
                                    {author?.profileImage ? (
                                        <Image
                                            src={author.profileImage}
                                            alt={displayPost.author || "Author"}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                                            <span className="text-white text-xl font-bold">
                                                {displayPost.author ? displayPost.author.charAt(0).toUpperCase() : 'स'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {displayPost.author || "सम्पादक"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(new Date(displayPost.createdAt))}
                                </p>
                            </div>

                         

                            {/* Share Section */}
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Share</p>
                                <ShareButtons slug={displayPost.slug} url={shareUrl} title={displayPost.title} />
                            </div>

                            {/* View Count */}
                            <div className="text-center pt-4 border-t border-gray-200">
                                <div className="text-center space-y-3">
                                {/* <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Eye size={14} className="text-gray-400" />
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">दृश्य</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{formatViewCount(post.viewCount || 0)}</p>
                                </div> */}
                                <div className="bg-red-50 rounded-lg p-3">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Share2 size={14} className="text-red-600" />
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Shares</p>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">{formatViewCount(displayPost.shareCount || 500)}</p>
                                </div>
                            </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <article className="lg:col-span-6">
                        {/* Category Badge */}
                        {displayPost.category && categoryUrl && (
                            <Link
                                href={categoryUrl}
                                className="inline-block px-4 py-1.5 bg-red-600 text-white text-sm font-medium mb-4 hover:bg-red-700 transition"
                            >
                                {displayPost.category}
                            </Link>
                        )}

                        {/* Ad Slot 1: Before Title */}


                        {/* Title */}
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-5">
                            {displayPost.title}
                        </h1>
                        <InArticleAd slotIndex={0} />

                        {/* Mobile Meta Info */}
                        <div className="lg:hidden flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-5 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                                    {author?.profileImage ? (
                                        <Image
                                            src={author.profileImage}
                                            alt={displayPost.author || "Author"}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-red-600 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {displayPost.author ? displayPost.author.charAt(0).toUpperCase() : 'स'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-gray-900 font-medium">{displayPost.author || "सम्पादक"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Clock size={14} />
                                <span>{getRelativeTime(new Date(displayPost.createdAt))}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Eye size={14} />
                                <span>{formatViewCount(displayPost.viewCount || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Share2 size={14} />
                                <span>{formatViewCount(displayPost.shareCount || 200)}</span>
                            </div>
                        </div>

                        {/* Featured Image */}
                        {displayPost.imageUrl && (
                            <div className="mb-6 relative aspect-video w-full rounded-lg overflow-hidden shadow-sm">
                                <Image
                                    src={displayPost.imageUrl}
                                    alt={displayPost.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            </div>
                        )}

                        {/* Ad Slot 2: After Featured Image */}
                        <InArticleAd slotIndex={1} />

                        {/* Summary Box - सारांश */}
                        {displayPost.excerpt && (
                            <div className="mb-8 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
                                    <Sparkles size={16} className="text-white" />
                                    <span className="text-white font-semibold text-sm">सारांश</span>
                                </div>
                                <div className="p-4">
                                    <div
                                        className="text-gray-700 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: unescapeHtml(displayPost.excerpt) }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ad Slot 3: After Summary (Before Main Content) */}
                        <InArticleAd slotIndex={2} />

                        {/* Main Content */}
                        <div
                            className="article-content text-4xl font-medium text-gray-800 leading-[1.9] mb-8
                                [&>p]:mb-6 [&>p]:text-xl [&>p]:font-medium [&>p]:text-gray-800 [&>p]:leading-[1.9] 
                                [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4
                                [&>h3]:text-lg [&>h3]:md:text-xl [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-3
                                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6
                                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6
                                [&>li]:mb-2
                                [&>blockquote]:border-l-4 [&>blockquote]:border-red-600 [&>blockquote]:bg-gray-50 [&>blockquote]:py-4 [&>blockquote]:px-6 [&>blockquote]:my-6 [&>blockquote]:rounded-r-lg [&>blockquote]:italic
                                [&>a]:text-red-600 [&>a]:underline [&>a]:hover:text-red-700
                                [&>img]:rounded-lg [&>img]:my-6 [&>img]:shadow-md
                                [&>strong]:font-bold [&>strong]:text-gray-900
                            "
                            dangerouslySetInnerHTML={{ __html: unescapeHtml(displayPost.content) }}
                        />
                        <InArticleAd slotIndex={3} />

                        {/* Render Additional Content Blocks */}
                        {sortedBlocks.length > 0 && (
                            <div className="content-blocks mb-8">
                                {sortedBlocks.map((block, index) => (
                                    <div key={block.id || index}>
                                        <ContentBlockRenderer block={block} />
                                        {/* Ad Slot 4+: Between Content Blocks (every 3 blocks) */}
                                        {(index + 1) % 3 === 0 && index !== sortedBlocks.length - 1 && (
                                            <InArticleAd slotIndex={3 + Math.floor(index / 3)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Ad Slot: End of Article */}
                        {/* <InArticleAd slotIndex={sortedBlocks.length > 0 ? 3 + Math.ceil(sortedBlocks.length / 3) : 3} /> */}

                        {/* Tags */}
                        {displayPost.tags && displayPost.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 py-6 border-t border-gray-200">
                                <Tag size={16} className="text-gray-400" />
                                {displayPost.tags.map((tag) => {
                                    // Remove # if present for the URL
                                    const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
                                    return (
                                        <Link
                                            key={tag}
                                            href={`/tag/${encodeURIComponent(tagName)}`}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-red-600 hover:text-white transition"
                                        >
                                            {tagName}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Mobile Share Buttons */}
                        <div className="lg:hidden flex items-center gap-3 py-4 border-t border-gray-200">
                            <span className="text-gray-600 text-sm font-medium">साझा गर्नुहोस्:</span>
                            <div className="flex gap-2">
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                                >
                                    <Facebook size={16} />
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
                                >
                                    <Twitter size={16} />
                                </a>
                                <a
                                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition"
                                >
                                    <Linkedin size={16} />
                                </a>
                            </div>
                        </div>

                        {/* In-Article Advertisement - After Content */}
                        <InArticleAd />

                        {/* Related Posts */}
                        {relatedPosts.length > 0 && (
                            <section className="mt-8 pt-8 border-t border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-1 h-6 bg-red-600 rounded-full"></span>
                                    सम्बन्धित समाचार
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {relatedPosts.map((relatedPost) => (
                                        <article
                                            key={relatedPost._id.toString()}
                                            className="bg-gray-50 rounded-lg overflow-hidden group hover:bg-gray-100 transition flex"
                                        >
                                            {relatedPost.imageUrl && (
                                                <div className="w-28 h-20 flex-shrink-0 bg-gray-200 overflow-hidden relative">
                                                    <Image
                                                        src={relatedPost.imageUrl}
                                                        alt={relatedPost.title}
                                                        fill
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        unoptimized
                                                    />
                                                </div>
                                            )}
                                            <div className="p-3 flex-1">
                                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition leading-snug">
                                                    <Link href={`/post/${relatedPost.slug}`}>
                                                        {relatedPost.title}
                                                    </Link>
                                                </h3>
                                                <div className="mt-2 text-xs text-gray-400">
                                                    {getRelativeTime(new Date(relatedPost.createdAt))}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                    </article>

                    {/* Right Sidebar */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            {/* Sidebar Top Ad */}
                            <SidebarAd position="sidebar-top" />

                            {/* भर्खरै - Recent Articles */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
                                    <h2 className="text-white font-bold text-lg">भर्खरै</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {recentPosts.map((recentPost) => (
                                        <article
                                            key={recentPost._id.toString()}
                                            className="p-4 group hover:bg-gray-50 transition"
                                        >
                                            <div className="flex gap-3">
                                                {recentPost.imageUrl && (
                                                    <div className="w-20 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden relative">
                                                        <Image
                                                            src={recentPost.imageUrl}
                                                            alt={recentPost.title}
                                                            fill
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            unoptimized
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition leading-snug">
                                                        <Link href={`/post/${recentPost.slug}`}>
                                                            {recentPost.title}
                                                        </Link>
                                                    </h3>
                                                    <div className="mt-1 text-xs text-gray-400">
                                                        {getRelativeTime(new Date(recentPost.createdAt))}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>

                            {/* Trending - ट्रेन्डिङ */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3">
                                    <h2 className="text-white font-bold text-lg">ट्रेन्डिङ</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {trendingPosts.map((trendingPost, index) => (
                                        <article
                                            key={trendingPost._id.toString()}
                                            className="p-4 group hover:bg-gray-50 transition"
                                        >
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-md">
                                                    <span className="text-white font-bold text-lg">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition leading-snug">
                                                        <Link href={`/post/${trendingPost.slug}`}>
                                                            {trendingPost.title}
                                                        </Link>
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                                        <Eye size={12} />
                                                        <span>{formatViewCount(trendingPost.viewCount || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar Bottom Ad */}
                            <SidebarAd position="sidebar-bottom" />
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <FooterWrapper />
        </div>
    );
}
