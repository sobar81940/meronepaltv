import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "आजको राशिफल | दैनिक ज्योतिषीय भविष्यवाणी - Rangamanch",
    description: "मेष, वृष, मिथुन, कर्कट, सिंह, कन्या, तुला, वृश्चिक, धनु, मकर, कुम्भ र मीन राशिको आजको राशिफल। प्रेम, करियर, स्वास्थ्य र भाग्यशाली अंक, रंग तथा दिनको जानकारी।",
    keywords: [
        "राशिफल",
        "आजको राशिफल",
        "ज्योतिष",
        "horoscope",
        "daily horoscope",
        "nepali rashifal",
        "मेष राशि",
        "वृष राशि",
        "मिथुन राशि",
        "कर्कट राशि",
        "सिंह राशि",
        "कन्या राशि",
        "तुला राशि",
        "वृश्चिक राशि",
        "धनु राशि",
        "मकर राशि",
        "कुम्भ राशि",
        "मीन राशि",
        "zodiac",
        "astrology",
        "भविष्यवाणी",
    ],
    openGraph: {
        title: "आजको राशिफल | दैनिक ज्योतिषीय भविष्यवाणी",
        description: "१२ राशिहरूको आजको भविष्यवाणी - प्रेम, करियर, स्वास्थ्य र भाग्यशाली जानकारी सहित।",
        type: "website",
        locale: "ne_NP",
        images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com"}/images/og-image.png`, width: 1200, height: 630, alt: "आजको राशिफल" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "आजको राशिफल | दैनिक ज्योतिषीय भविष्यवाणी",
        description: "१२ राशिहरूको आजको भविष्यवाणी - प्रेम, करियर, स्वास्थ्य र भाग्यशाली जानकारी सहित।",
        images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com"}/images/og-image.png`],
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/rashifal",
    },
};

export default function RashifalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
