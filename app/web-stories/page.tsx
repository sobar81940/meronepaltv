import WebStoryModel from "@/models/WebStory";
import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Link from "next/link";
import { Play, Layers, Sparkles } from "lucide-react";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";

export const metadata: Metadata = {
    title: "वेब स्टोरिज",
    description: "Rangamanch का नेपाली चलचित्र, मनोरञ्जन, सेलिब्रिटी र ताजा समाचारका आकर्षक वेब स्टोरिज हेर्नुहोस्।",
    alternates: { canonical: `${SITE_URL}/web-stories` },
    openGraph: {
        title: "वेब स्टोरिज | Rangamanch",
        description: "नेपाली चलचित्र, मनोरञ्जन, सेलिब्रिटी र ताजा समाचारका आकर्षक वेब स्टोरिज।",
        url: `${SITE_URL}/web-stories`,
        type: "website",
        locale: "ne_NP",
        siteName: "Rangamanch",
    },
};

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

export default async function WebStoriesPage() {
    const stories = await WebStoryModel.findPublished();

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Floating Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute bottom-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />

                <div className="container mx-auto px-4 py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm mb-6">
                            <Sparkles size={16} />
                            <span>वेबस्टोरिज</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            वेबस्टोरिज
                        </h1>
                        <p className="text-lg text-white/80 max-w-xl mx-auto">
                            हाम्रा विशेष कथाहरू स्वाइप गरेर पढ्नुहोस्
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold">{stories.length}</div>
                                <div className="text-sm text-white/70">कथाहरू</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(250 245 255)" />
                    </svg>
                </div>
            </section>

            {/* Stories Grid */}
            <main className="container mx-auto px-4 py-12">
                {stories.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            <Layers size={40} className="text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">कुनै कथा छैन</h2>
                        <p className="text-gray-500">पछि फेरी हेर्नुहोस्!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {stories.map((story) => (
                            <Link
                                key={story._id?.toString()}
                                href={`/web-stories/${story.slug}`}
                                className="group"
                            >
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.03]">
                                    {/* Cover Image */}
                                    <img
                                        src={story.coverImage}
                                        alt={story.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                    {/* Border Animation */}
                                    <div className="absolute inset-0 border-4 border-transparent group-hover:border-purple-500 rounded-2xl transition-all duration-300" />

                                    {/* Category */}
                                    {story.category && (
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                                                {story.category}
                                            </span>
                                        </div>
                                    )}

                                    {/* Slide Count */}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                                            {story.slides.length} STORIES
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-white font-bold line-clamp-3 leading-tight">
                                            {story.title}
                                        </h3>
                                    </div>

                                    {/* Play Button on Hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                            <Play className="text-white ml-1" size={28} fill="white" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <FooterWrapper />
        </div>
    );
}
