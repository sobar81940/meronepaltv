import GalleryModel from "@/models/Gallery";
import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Image from "next/image";
import Link from "next/link";
import { Images, Film, Play, ChevronLeft, ChevronRight, Sparkles, LayoutGrid } from "lucide-react";
import GalleryVideoCard from "@/components/GalleryVideoCard";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";

export const metadata: Metadata = {
    title: "फोटो तथा भिडियो ग्यालरी",
    description: "MeroNepalTv को फोटो र भिडियो ग्यालरीमा नेपाली मनोरञ्जन, चलचित्र, सेलिब्रिटी र कार्यक्रमका दृश्यहरू हेर्नुहोस्।",
    alternates: { canonical: `${SITE_URL}/gallery` },
    openGraph: {
        title: "फोटो तथा भिडियो ग्यालरी | MeroNepalTv",
        description: "नेपाली मनोरञ्जन, चलचित्र, सेलिब्रिटी र कार्यक्रमका फोटो तथा भिडियोहरू।",
        url: `${SITE_URL}/gallery`,
        type: "website",
        locale: "ne_NP",
        siteName: "MeroNepalTv",
    },
};

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

// Server component for public gallery
export default async function PublicGalleryPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; page?: string; category?: string }>;
}) {
    const params = await searchParams;
    const type = params.type as "image" | "video" | undefined;
    const page = parseInt(params.page || "1");
    const limit = 24;

    const result = await GalleryModel.paginate(page, limit, type);
    const { items, total, pages } = result;

    const imageCount = type ? 0 : (await GalleryModel.count("image"));
    const videoCount = type ? 0 : (await GalleryModel.count("video"));

    // Get unique categories
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Floating Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-2xl blur-xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="container mx-auto px-4 py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm mb-6">
                            <Sparkles size={16} />
                            <span>मिडिया ग्यालरी</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            फोटो र भिडियो
                            <span className="block text-white/80 mt-2">ग्यालरी</span>
                        </h1>
                        <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                            हाम्रो संग्रहमा भएका सुन्दर तस्बिरहरू र भिडियोहरू हेर्नुहोस्
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold">{total}</div>
                                <div className="text-sm text-white/70">कुल आइटम</div>
                            </div>
                            <div className="w-px h-12 bg-white/30" />
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold">{imageCount}</div>
                                <div className="text-sm text-white/70">फोटोहरू</div>
                            </div>
                            <div className="w-px h-12 bg-white/30" />
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold">{videoCount}</div>
                                <div className="text-sm text-white/70">भिडियोहरू</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)" />
                    </svg>
                </div>
            </section>

            {/* Filter Section */}
            <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        {/* Type Filters */}
                        <div className="flex gap-2">
                            <Link
                                href="/gallery"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${!type
                                    ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <LayoutGrid size={16} />
                                सबै
                            </Link>
                            <Link
                                href="/gallery?type=image"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${type === "image"
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <Images size={16} />
                                फोटो
                            </Link>
                            <Link
                                href="/gallery?type=video"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${type === "video"
                                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <Film size={16} />
                                भिडियो
                            </Link>
                        </div>

                        {/* Page Info */}
                        <div className="text-sm text-gray-500">
                            पृष्ठ {page} / {pages || 1}
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <main className="container mx-auto px-4 py-12">
                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <Images size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">कुनै मिडिया छैन</h2>
                        <p className="text-gray-500">पछि फेरी हेर्नुहोस्!</p>
                    </div>
                ) : (
                    <>
                        {/* Modern Masonry Grid */}
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                            {items.map((item, index) => (
                                item.type === 'video' ? (
                                    <GalleryVideoCard
                                        key={item._id.toString()}
                                        item={{
                                            _id: item._id.toString(),
                                            title: item.title,
                                            type: item.type,
                                            url: item.url,
                                            thumbnailUrl: item.thumbnailUrl,
                                            category: item.category,
                                            duration: item.duration,
                                            videoSource: item.videoSource,
                                            youtubeId: item.youtubeId,
                                        }}
                                        index={index}
                                    />
                                ) : (
                                    <GalleryCard key={item._id.toString()} item={item} index={index} />
                                )
                            ))}
                        </div>

                        {/* Pagination */}
                        {pages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-16">
                                {page > 1 && (
                                    <Link
                                        href={`/gallery?page=${page - 1}${type ? `&type=${type}` : ""}`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200"
                                    >
                                        <ChevronLeft size={18} />
                                        अघिल्लो
                                    </Link>
                                )}

                                <div className="flex items-center gap-1 mx-4">
                                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                                        let pageNum;
                                        if (pages <= 7) {
                                            pageNum = i + 1;
                                        } else if (page <= 4) {
                                            pageNum = i + 1;
                                        } else if (page >= pages - 3) {
                                            pageNum = pages - 6 + i;
                                        } else {
                                            pageNum = page - 3 + i;
                                        }

                                        if (pageNum < 1 || pageNum > pages) return null;

                                        return (
                                            <Link
                                                key={pageNum}
                                                href={`/gallery?page=${pageNum}${type ? `&type=${type}` : ""}`}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${pageNum === page
                                                    ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg"
                                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                                    }`}
                                            >
                                                {pageNum}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {page < pages && (
                                    <Link
                                        href={`/gallery?page=${page + 1}${type ? `&type=${type}` : ""}`}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                                    >
                                        पछिल्लो
                                        <ChevronRight size={18} />
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <FooterWrapper />
        </div>
    );
}

// Modern Gallery Card Component
function GalleryCard({ item, index }: {
    item: {
        _id: { toString(): string };
        title: string;
        type: string;
        url: string;
        thumbnailUrl?: string;
        category?: string;
        width?: number;
        height?: number;
        duration?: number;
        videoSource?: string;
        youtubeId?: string;
    };
    index: number;
}) {
    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const isYouTube = item.videoSource === "youtube";

    // Varying heights for masonry effect
    const getHeightClass = () => {
        const heights = ['h-64', 'h-72', 'h-80', 'h-96'];
        return heights[index % heights.length];
    };

    return (
        <div className="break-inside-avoid mb-6 group">
            <div className={`relative overflow-hidden rounded-2xl bg-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 ${item.type === 'video' ? 'aspect-video' : ''}`}>
                {item.type === "video" ? (
                    <>
                        {/* Video Thumbnail */}
                        {item.thumbnailUrl ? (
                            <Image
                                src={item.thumbnailUrl}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                unoptimized={isYouTube}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                <Film size={48} className="text-gray-400" />
                            </div>
                        )}

                        {/* Video Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isYouTube ? 'bg-red-600' : 'bg-gradient-to-r from-primary to-purple-600'}`}>
                                    <Play className="text-white ml-1" size={24} fill="white" />
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${isYouTube ? 'bg-red-600' : 'bg-purple-600'}`}>
                                {isYouTube ? 'YouTube' : 'Video'}
                            </span>
                        </div>

                        {/* Duration */}
                        {item.duration && !isYouTube && (
                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs text-white font-medium">
                                {formatDuration(item.duration)}
                            </div>
                        )}

                        {/* Title */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold line-clamp-2 drop-shadow-lg">
                                {item.title}
                            </h3>
                            {item.category && (
                                <span className="text-white/70 text-sm">{item.category}</span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Image */}
                        <div className="relative">
                            <Image
                                src={item.url}
                                alt={item.title}
                                width={item.width || 400}
                                height={item.height || 300}
                                className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-semibold line-clamp-2">
                                        {item.title}
                                    </h3>
                                    {item.category && (
                                        <span className="text-white/70 text-sm">{item.category}</span>
                                    )}
                                </div>
                            </div>

                            {/* Category Badge - Always Visible */}
                            {item.category && (
                                <div className="absolute top-3 left-3">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-800 shadow-sm">
                                        {item.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
