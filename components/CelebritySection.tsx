"use client";

import Link from "next/link";
import Image from "next/image";
import { Award, Star, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Celebrity {
    _id: string;
    name: string;
    slug: string;
    title: string;
    shortBio?: string;
    imageUrl: string;
    category: string;
    isFeatured: boolean;
    knownFor?: string[];
}

interface CelebritySectionProps {
    celebrities: Celebrity[];
    title?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    actor: "अभिनेता/अभिनेत्री",
    singer: "गायक/गायिका",
    musician: "संगीतकार",
    politician: "राजनीतिज्ञ",
    sports: "खेलाडी",
    writer: "लेखक",
    business: "व्यापारी",
    social: "सामाजिक व्यक्तित्व",
    other: "अन्य",
};

export default function CelebritySection({ celebrities, title = "सेलिब्रिटी जीवनी" }: CelebritySectionProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (!celebrities || celebrities.length === 0) return null;

    return (
        <section className="mb-10">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" aria-hidden="true" />
                    <span className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
                        {title}
                    </span>
                </h2>
                <Link
                    href="/wiki"
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors group"
                >
                    सबै हेर्नुहोस्
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Celebrity Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {celebrities.map((celebrity) => (
                    <Link
                        key={celebrity._id}
                        href={`/wiki/${celebrity.slug}`}
                        className="group relative"
                        onMouseEnter={() => setHoveredId(celebrity._id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            {/* Image Container */}
                            <div className="relative aspect-[3/4] overflow-hidden">
                                {celebrity.imageUrl ? (
                                    <Image
                                        src={celebrity.imageUrl}
                                        alt={celebrity.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                        <span className="text-4xl text-purple-300">✦</span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                {/* Featured Badge */}
                                {celebrity.isFeatured && (
                                    <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <Star className="w-3 h-3 text-white" fill="currentColor" />
                                        <span className="text-[10px] font-bold text-white">विशेष</span>
                                    </div>
                                )}

                                {/* Category Tag */}
                                <div className="absolute top-2 left-2">
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-medium text-white border border-white/30">
                                        {CATEGORY_LABELS[celebrity.category] || celebrity.category}
                                    </span>
                                </div>

                                {/* Content at Bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 group-hover:text-yellow-300 transition-colors">
                                        {celebrity.name}
                                    </h3>
                                    <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
                                        {celebrity.title}
                                    </p>

                                    {/* Known For - Shows on hover */}
                                    {celebrity.knownFor && celebrity.knownFor.length > 0 && hoveredId === celebrity._id && (
                                        <div className="mt-2 flex flex-wrap gap-1 animate-fadeIn">
                                            {celebrity.knownFor.slice(0, 2).map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/30 backdrop-blur-sm rounded text-[9px] text-white"
                                                >
                                                    <Award className="w-2.5 h-2.5" />
                                                    <span className="line-clamp-1">{item}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* View All Button for Mobile */}
            <div className="mt-6 text-center sm:hidden">
                <Link
                    href="/wiki"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                    सबै सेलिब्रिटी हेर्नुहोस्
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Custom Animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </section>
    );
}
