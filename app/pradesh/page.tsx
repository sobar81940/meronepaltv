import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Link from "next/link";
import PostModel from "@/models/Post";
import { PROVINCES } from "@/lib/types";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";

export const metadata: Metadata = {
    title: "प्रदेश समाचार",
    description: "Rangamanch मा कोशी, मधेश, बागमती, गण्डकी, लुम्बिनी, कर्णाली र सुदूरपश्चिमका ताजा प्रदेश समाचार पढ्नुहोस्।",
    alternates: { canonical: `${SITE_URL}/pradesh` },
    openGraph: {
        title: "प्रदेश समाचार | Rangamanch",
        description: "नेपालका सातै प्रदेशका ताजा समाचार र अपडेट।",
        url: `${SITE_URL}/pradesh`,
        type: "website",
        locale: "ne_NP",
        siteName: "Rangamanch",
    },
};

// Use ISR with 300 second revalidation for better performance
export const revalidate = 300;

interface PradeshPageProps {
    searchParams: Promise<{ province?: string }>;
}

export default async function PradeshPage({ searchParams }: PradeshPageProps) {
    const params = await searchParams;
    const selectedProvince = params.province || PROVINCES[0].name;

    // Find the selected province details
    const provinceInfo = PROVINCES.find(p => p.name === selectedProvince || p.slug === selectedProvince) || PROVINCES[0];

    // Find posts for the selected province
    const posts = await PostModel.findByProvince(provinceInfo.name);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-2 h-10 bg-red-600 rounded"></span>
                        प्रदेश समाचार
                    </h1>
                    <p className="text-gray-600 mt-2">नेपालका सातै प्रदेशका ताजा समाचार</p>
                </div>

                {/* Province Tabs */}
                <div className="mb-8 overflow-x-auto">
                    <div className="flex gap-2 min-w-max pb-2">
                        {PROVINCES.map((province) => (
                            <Link
                                key={province.slug}
                                href={`/pradesh?province=${encodeURIComponent(province.name)}`}
                                className={`px-5 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${provinceInfo.name === province.name
                                    ? "text-white shadow-lg"
                                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow"
                                    }`}
                                style={{
                                    backgroundColor: provinceInfo.name === province.name ? province.color : undefined,
                                }}
                            >
                                {province.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Province Header */}
                <div className="mb-6 flex items-center gap-4">
                    <div
                        className="w-3 h-12 rounded"
                        style={{ backgroundColor: provinceInfo.color }}
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{provinceInfo.name}</h2>
                        <p className="text-gray-500">{posts.length} समाचार उपलब्ध</p>
                    </div>
                </div>

                {/* Posts Grid */}
                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <article
                                key={post._id.toString()}
                                className="bg-white rounded-xl shadow overflow-hidden group hover:shadow-lg transition"
                            >
                                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                    {/* Province Badge */}
                                    <div
                                        className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-medium rounded-full"
                                        style={{ backgroundColor: provinceInfo.color }}
                                    >
                                        {provinceInfo.name}
                                    </div>
                                </div>
                                <div className="p-4">
                                    {post.category && (
                                        <span className="text-xs text-red-600 font-medium">
                                            {post.category}
                                        </span>
                                    )}
                                    <h3 className="font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-red-600 transition">
                                        <Link href={`/post/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                        <span>{post.author}</span>
                                        <span>
                                            {new Date(post.createdAt).toLocaleDateString("ne-NP")}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 bg-white rounded-xl shadow">
                        <div className="text-6xl mb-4">🏔️</div>
                        <p className="text-gray-500 text-lg">
                            {provinceInfo.name}मा कुनै समाचार उपलब्ध छैन
                        </p>
                        <p className="text-gray-400 mt-2">
                            पछि फेरि आउनुहोस् वा अन्य प्रदेश हेर्नुहोस्
                        </p>
                    </div>
                )}

                {/* Province Map/Info Section */}
                <div className="mt-12 bg-white rounded-xl shadow p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">नेपालका प्रदेशहरू</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {PROVINCES.map((province) => (
                            <Link
                                key={province.slug}
                                href={`/pradesh?province=${encodeURIComponent(province.name)}`}
                                className="p-3 rounded-lg text-center hover:shadow-md transition group"
                                style={{
                                    backgroundColor: `${province.color}15`,
                                    borderColor: province.color,
                                    borderWidth: '1px'
                                }}
                            >
                                <div
                                    className="w-8 h-8 rounded-full mx-auto mb-2"
                                    style={{ backgroundColor: province.color }}
                                />
                                <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                                    {province.name.replace(" प्रदेश", "")}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <FooterWrapper />
        </div>
    );
}
