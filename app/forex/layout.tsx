import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "विदेशी मुद्रा विनिमय दर | नेपाल राष्ट्र बैंक - MeroNepalTv",
    description: "नेपाल राष्ट्र बैंक (NRB) द्वारा प्रकाशित आजको विदेशी मुद्रा विनिमय दर। USD, EUR, GBP, AUD, INR र अन्य मुद्राहरूको खरिद र बिक्री दर।",
    keywords: [
        "forex",
        "exchange rate",
        "विदेशी मुद्रा",
        "विनिमय दर",
        "NRB",
        "Nepal Rastra Bank",
        "नेपाल राष्ट्र बैंक",
        "USD rate",
        "dollar rate nepal",
        "euro rate nepal",
        "currency exchange nepal",
        "खरिद दर",
        "बिक्री दर",
        "आजको विनिमय दर",
    ],
    openGraph: {
        title: "विदेशी मुद्रा विनिमय दर | नेपाल राष्ट्र बैंक",
        description: "NRB द्वारा प्रकाशित आजको विदेशी मुद्रा दर - USD, EUR, GBP, INR र अन्य मुद्राहरू।",
        type: "website",
        locale: "ne_NP",
        images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com"}/images/og-image.png`, width: 1200, height: 630, alt: "विदेशी मुद्रा विनिमय दर" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "विदेशी मुद्रा विनिमय दर | नेपाल राष्ट्र बैंक",
        description: "NRB द्वारा प्रकाशित आजको विदेशी मुद्रा दर - USD, EUR, GBP, INR र अन्य मुद्राहरू।",
        images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com"}/images/og-image.png`],
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/forex",
    },
};

export default function ForexLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
