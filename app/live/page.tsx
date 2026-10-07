import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import LiveBroadcast from "@/components/LiveBroadcast";
import SettingsModel from "@/models/Settings";
import { Radio } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const settings = await SettingsModel.get().catch(() => undefined);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const siteName = settings?.siteName || "MeroNepalTv";
    const title = settings?.liveBroadcast?.title || "लाइभ प्रसारण";
    const description = settings?.liveBroadcast?.description || `${siteName} को लाइभ प्रसारण हेर्नुहोस्।`;
    const ogImage = settings?.seoSettings?.ogImage || `${siteUrl}/images/og-image.png`;

    return {
        title,
        description,
        alternates: { canonical: `${siteUrl}/live` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/live`,
            siteName,
            type: "website",
            locale: "ne_NP",
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

export default async function LivePage() {
    const settings = await SettingsModel.get().catch(() => undefined);
    const live = settings?.liveBroadcast;
    const isEnabled = Boolean(live?.enabled);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-[#e61e2b] text-white px-3 py-1.5 rounded-md">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="font-bold text-sm uppercase tracking-wide">LIVE</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {live?.title || "लाइभ प्रसारण"}
                    </h1>
                </div>

                {isEnabled && live ? (
                    <LiveBroadcast settings={live} position="section" />
                ) : (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <div className="text-5xl mb-4">📺</div>
                        <p className="text-lg font-medium text-gray-800">
                            हाल कुनै लाइभ प्रसारण उपलब्ध छैन
                        </p>
                        <p className="text-gray-500 mt-2">
                            कृपया पछि फेरि प्रयास गर्नुहोस्।
                        </p>
                    </div>
                )}
            </main>

            <FooterWrapper />
        </div>
    );
}
