import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import PageModel from "@/models/Page";
import SettingsModel from "@/models/Settings";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
    const [page, settings] = await Promise.all([
        PageModel.findPublishedBySlug("about"),
        SettingsModel.get().catch(() => undefined),
    ]);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";
    const siteName = settings?.siteName || "Rangamanch";
    const title = page?.metaTitle || page?.title || "हाम्रो बारेमा";
    const description = page?.metaDescription || `${siteName} बारेमा जान्नुहोस् - नेपालको विश्वसनीय समाचार पोर्टल।`;
    const ogImage = settings?.seoSettings?.ogImage || `${siteUrl}/images/og-image.png`;

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/about`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/about`,
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

export default async function AboutPage() {
    const [page, settings] = await Promise.all([
        PageModel.findPublishedBySlug("about"),
        SettingsModel.get().catch(() => undefined),
    ]);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";
    const siteName = settings?.siteName || "Rangamanch";

    if (!page) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "BreadcrumbList",
                                "itemListElement": [
                                    { "@type": "ListItem", "position": 1, "name": "गृहपृष्ठ", "item": siteUrl },
                                    { "@type": "ListItem", "position": 2, "name": "हाम्रो बारेमा", "item": `${siteUrl}/about` },
                                ],
                            }),
                        }}
                    />
                    <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10 text-center static-page-content">
                        <h1 className="text-3xl md:text-4xl font-bold mb-6">हाम्रो बारेमा</h1>
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "गृहपृष्ठ", "item": siteUrl },
                                { "@type": "ListItem", "position": 2, "name": page.title, "item": `${siteUrl}/about` },
                            ],
                        }),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "AboutPage",
                            "@id": `${siteUrl}/about`,
                            "name": page.title,
                            "description": page.metaDescription || `${siteName} - नेपालको विश्वसनीय समाचार पोर्टल बारेमा जान्नुहोस्।`,
                            "url": `${siteUrl}/about`,
                            "inLanguage": "ne-NP",
                            "isPartOf": {
                                "@id": `${siteUrl}/#website`,
                            },
                            "publisher": {
                                "@type": "NewsMediaOrganization",
                                "@id": `${siteUrl}/#organization`,
                                "name": siteName,
                                "alternateName": ["rangamanch", "Rangamanch News", "रंगमञ्च"],
                                "url": siteUrl,
                            },
                        }),
                    }}
                />
                <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10 static-page-content">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
                    <div className="prose prose-lg max-w-none prose-headings:text-black prose-a:text-black prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: page.content }} />
                </article>
            </main>
            <FooterWrapper />
        </div>
    );
}
