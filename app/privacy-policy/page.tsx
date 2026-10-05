import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import PageModel from "@/models/Page";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const page = await PageModel.findPublishedBySlug("privacy-policy");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";
    const title = page?.metaTitle || page?.title || "गोपनीयता नीति";
    const description = page?.metaDescription || "Rangamanch को गोपनीयता नीति - हाम्रो वेबसाइट प्रयोग गर्दा तपाईंको डेटा कसरी संकलन र प्रयोग गरिन्छ भन्ने जानकारी।";

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/privacy-policy`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/privacy-policy`,
            siteName: "Rangamanch",
            type: "website",
            locale: "ne_NP",
        },
    };
}

export default async function PrivacyPolicyPage() {
    const page = await PageModel.findPublishedBySlug("privacy-policy");
    if (!page) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10 text-center static-page-content">
                        <h1 className="text-3xl md:text-4xl font-bold mb-6">गोपनीयता नीति</h1>
                        <p className="mb-6">यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>
                    </article>
                </main>
                <FooterWrapper />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10 static-page-content">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
                    <div className="prose prose-lg max-w-none prose-headings:text-black prose-a:text-black prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: page.content }} />
                </article>
            </main>
            <FooterWrapper />
        </div>
    );
}