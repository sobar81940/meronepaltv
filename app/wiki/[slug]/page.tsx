import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import CelebrityModel from "@/models/Celebrity";
import CelebrityTabs from "@/components/CelebrityTabs";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    Star, MapPin, Calendar, Globe, User,
    Facebook, Twitter, Instagram, Youtube,
    ArrowLeft, Eye, Share2, Heart, ExternalLink
} from "lucide-react";

export const revalidate = 60;

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

interface CelebrityPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CelebrityPageProps) {
    const { slug } = await params;
    const celebrity = await CelebrityModel.findBySlug(slug);

    if (!celebrity) {
        return { title: "Celebrity Not Found" };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const pageUrl = `${siteUrl}/wiki/${slug}`;
    const description = celebrity.shortBio || celebrity.bio.substring(0, 160);
    const imageUrl = celebrity.imageUrl || `${siteUrl}/images/og-image.png`;

    return {
        title: `${celebrity.name} - ${celebrity.title} | सेलिब्रिटी जीवनी`,
        description,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: `${celebrity.name} - ${celebrity.title}`,
            description,
            url: pageUrl,
            siteName: "MeroNepalTv",
            type: "profile",
            locale: "ne_NP",
            images: [{ url: imageUrl, width: 1200, height: 630, alt: celebrity.name }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${celebrity.name} - ${celebrity.title}`,
            description,
            images: [imageUrl],
        },
    };
}

export default async function CelebrityPage({ params }: CelebrityPageProps) {
    const { slug } = await params;
    const settings = await SettingsModel.get();
    const celebrity = await CelebrityModel.findBySlug(slug);

    if (!celebrity || !celebrity.isPublished) {
        notFound();
    }

    // Increment view count
    await CelebrityModel.incrementViewCount(celebrity._id.toString());

    // Fetch related celebrities (same category)
    const relatedCelebrities = await CelebrityModel.findByCategory(celebrity.category, 6);
    const filteredRelated = relatedCelebrities.filter(c => c._id.toString() !== celebrity._id.toString()).slice(0, 4);

    const formatDate = (date?: Date) => {
        if (!date) return null;
        return new Intl.DateTimeFormat('ne-NP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <Header />

            {/* Cover Section */}
            <div className="bg-white shadow-sm">
                {/* Cover Image Container - Using inline style for guaranteed height */}
                <div
                    className="relative w-full max-w-5xl mx-auto rounded-b-xl overflow-hidden"
                    style={{ height: 'clamp(200px, 35vw, 350px)' }}
                >
                    {celebrity.coverImageUrl ? (
                        <Image
                            src={celebrity.coverImageUrl}
                            alt={`${celebrity.name} cover`}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 1280px) 100vw, 1280px"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300" />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Profile Info Bar */}
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 pb-4">
                        {/* Profile Photo - Circular with overlap */}
                        <div className="relative -mt-16 md:-mt-20 flex-shrink-0">
                            <div
                                className="rounded-full overflow-hidden border-4 border-white shadow-xl bg-white"
                                style={{ width: '140px', height: '140px' }}
                            >
                                {celebrity.imageUrl ? (
                                    <Image
                                        src={celebrity.imageUrl}
                                        alt={celebrity.name}
                                        width={140}
                                        height={140}
                                        className="object-cover w-full h-full"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                        <User className="w-16 h-16 text-purple-300" />
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Name and Info */}
                        <div className="flex-1 text-center md:text-left py-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {celebrity.name}
                                </h1>
                                {celebrity.isFeatured && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" title="Verified">
                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 mb-2">{celebrity.title}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {(celebrity.viewCount || 0).toLocaleString()} हेराइ
                                </span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                    {CATEGORY_LABELS[celebrity.category] || celebrity.category}
                                </span>
                                {celebrity.nationality && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Globe className="w-4 h-4" />
                                            {celebrity.nationality}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 py-2">
                            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Follow
                            </button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            <main className="container mx-auto px-4 py-8">
                {/* JSON-LD Person Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Person",
                            "name": celebrity.name,
                            "description": celebrity.shortBio || celebrity.bio?.substring(0, 200),
                            "image": celebrity.imageUrl || undefined,
                            "jobTitle": celebrity.title,
                            "birthDate": celebrity.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : undefined,
                            "birthPlace": celebrity.birthPlace ? { "@type": "Place", "name": celebrity.birthPlace } : undefined,
                            "nationality": celebrity.nationality || undefined,
                            "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com"}/wiki/${celebrity.slug}`,
                            "sameAs": [
                                celebrity.socialLinks?.facebook,
                                celebrity.socialLinks?.twitter,
                                celebrity.socialLinks?.instagram,
                                celebrity.socialLinks?.youtube,
                                celebrity.socialLinks?.website,
                            ].filter(Boolean),
                            "knowsAbout": celebrity.knownFor || undefined,
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
                                { "@type": "ListItem", "position": 1, "name": "गृहपृष्ठ", "item": process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com" },
                                { "@type": "ListItem", "position": 2, "name": "विकि", "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com"}/wiki` },
                                { "@type": "ListItem", "position": 3, "name": celebrity.name, "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com"}/wiki/${celebrity.slug}` },
                            ],
                        }),
                    }}
                />

                {/* Back Button */}
                <Link
                    href="/wiki"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    सबै सेलिब्रिटी
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar - Left */}
                    <div className="space-y-6 order-2 lg:order-1">
                        {/* Quick Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-600" />
                                    व्यक्तिगत जानकारी
                                </h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {celebrity.birthDate && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">जन्म मिति</p>
                                            <p className="font-medium text-gray-900">{formatDate(celebrity.birthDate)}</p>
                                        </div>
                                    </div>
                                )}
                                {celebrity.birthPlace && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">जन्मस्थान</p>
                                            <p className="font-medium text-gray-900">{celebrity.birthPlace}</p>
                                        </div>
                                    </div>
                                )}
                                {celebrity.nationality && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">राष्ट्रियता</p>
                                            <p className="font-medium text-gray-900">{celebrity.nationality}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Links Card */}
                        {celebrity.socialLinks && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">सामाजिक सञ्जाल</h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    {celebrity.socialLinks.facebook && (
                                        <a
                                            href={celebrity.socialLinks.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                <Facebook className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Facebook</p>
                                                <p className="text-sm text-gray-500">प्रोफाइल हेर्नुहोस्</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        </a>
                                    )}
                                    {celebrity.socialLinks.instagram && (
                                        <a
                                            href={celebrity.socialLinks.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                                                <Instagram className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Instagram</p>
                                                <p className="text-sm text-gray-500">प्रोफाइल हेर्नुहोस्</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-pink-600 transition-colors" />
                                        </a>
                                    )}
                                    {celebrity.socialLinks.twitter && (
                                        <a
                                            href={celebrity.socialLinks.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                                                <Twitter className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Twitter</p>
                                                <p className="text-sm text-gray-500">प्रोफाइल हेर्नुहोस्</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-sky-600 transition-colors" />
                                        </a>
                                    )}
                                    {celebrity.socialLinks.youtube && (
                                        <a
                                            href={celebrity.socialLinks.youtube}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                                <Youtube className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">YouTube</p>
                                                <p className="text-sm text-gray-500">च्यानल हेर्नुहोस्</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                                        </a>
                                    )}
                                    {celebrity.socialLinks.website && (
                                        <a
                                            href={celebrity.socialLinks.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">Website</p>
                                                <p className="text-sm text-gray-500 truncate">{celebrity.socialLinks.website.replace(/(^\w+:|^)\/\//, '')}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Related Celebrities */}
                        {filteredRelated.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">सम्बन्धित सेलिब्रिटी</h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {filteredRelated.map((related) => (
                                        <Link
                                            key={related._id.toString()}
                                            href={`/wiki/${related.slug}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                                                {related.imageUrl ? (
                                                    <Image
                                                        src={related.imageUrl}
                                                        alt={related.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                        <Star className="w-6 h-6 text-purple-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                                    {related.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 truncate">{related.title}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Right - Interactive Tabs */}
                    <div className="lg:col-span-2 order-1 lg:order-2">
                        <CelebrityTabs
                            bio={celebrity.bio}
                            shortBio={celebrity.shortBio}
                            knownFor={celebrity.knownFor}
                            awards={celebrity.awards}
                            filmography={celebrity.filmography}
                            videos={celebrity.videos}
                            category={celebrity.category}
                        />
                    </div>
                </div>
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
