import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import CelebrityModel, { CelebrityCategory } from "@/models/Celebrity";
import Image from "next/image";
import Link from "next/link";
import { Star, Award, Search, Filter } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const settings = await SettingsModel.get().catch(() => undefined);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const siteName = settings?.siteName || "MeroNepalTv";
    const ogImage = settings?.seoSettings?.ogImage || `${siteUrl}/images/og-image.png`;
    const title = `सेलिब्रिटी जीवनी | ${siteName}`;
    const description = "नेपाली सेलिब्रिटीहरूको जीवनी, उपलब्धि र कार्यहरूको विस्तृत जानकारी। अभिनेता, गायक, खेलाडी, राजनीतिज्ञ र अन्य प्रसिद्ध व्यक्तित्वहरूको प्रोफाइल।";

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/wiki`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/wiki`,
            type: "website",
            locale: "ne_NP",
            siteName,
            images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
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

interface WikiPageProps {
    searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function WikiPage({ searchParams }: WikiPageProps) {
    const settings = await SettingsModel.get();
    const { category, q } = await searchParams;

    // Fetch celebrities based on filters
    let celebrities;
    if (q) {
        celebrities = await CelebrityModel.search(q, 50);
    } else if (category) {
        celebrities = await CelebrityModel.findByCategory(category as CelebrityCategory, 50);
    } else {
        celebrities = await CelebrityModel.findPublished(50);
    }

    // Get all categories for filter
    const allCategories = Object.entries(CATEGORY_LABELS);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
                        <Star className="w-10 h-10 text-yellow-500" fill="currentColor" />
                        सेलिब्रिटी जीवनी
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        नेपाली सेलिब्रिटीहरूको जीवनी, उपलब्धि र कार्यहरूको विस्तृत जानकारी
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <form className="flex-1" action="/wiki" method="GET">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="q"
                                    defaultValue={q}
                                    placeholder="सेलिब्रिटी खोज्नुहोस्..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                                />
                            </div>
                        </form>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <Link
                                href="/wiki"
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!category
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                सबै
                            </Link>
                            {allCategories.map(([key, label]) => (
                                <Link
                                    key={key}
                                    href={`/wiki?category=${key}`}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${category === key
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Info */}
                {q && (
                    <p className="text-gray-600 mb-6">
                        &quot;{q}&quot; को लागि {celebrities.length} परिणामहरू
                    </p>
                )}

                {/* Celebrity Grid */}
                {celebrities.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            कुनै सेलिब्रिटी भेटिएन
                        </h3>
                        <p className="text-gray-500">
                            कृपया फरक खोज शब्द वा वर्ग प्रयोग गर्नुहोस्
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {celebrities.map((celebrity) => (
                            <Link
                                key={celebrity._id.toString()}
                                href={`/wiki/${celebrity.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    {/* Image */}
                                    <div className="relative aspect-[3/4] overflow-hidden">
                                        {celebrity.imageUrl ? (
                                            <Image
                                                src={celebrity.imageUrl}
                                                alt={celebrity.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                                <span className="text-4xl text-purple-300">✦</span>
                                            </div>
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Featured Badge */}
                                        {celebrity.isFeatured && (
                                            <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                                <Star className="w-3 h-3 text-white" fill="currentColor" />
                                                <span className="text-[10px] font-bold text-white">विशेष</span>
                                            </div>
                                        )}

                                        {/* Category */}
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-medium text-white border border-white/30">
                                                {CATEGORY_LABELS[celebrity.category] || celebrity.category}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 group-hover:text-yellow-300 transition-colors">
                                                {celebrity.name}
                                            </h3>
                                            <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
                                                {celebrity.title}
                                            </p>

                                            {/* Known For */}
                                            {celebrity.knownFor && celebrity.knownFor.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {celebrity.knownFor.slice(0, 1).map((item, i) => (
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
                )}
            </main>

            <Footer
                settings={settings.footerSettings}
                siteName={settings.siteName}
                logoUrl={settings.logoUrl}
                logoText={settings.logoText}
            />
        </div>
    );
}
