import { Metadata } from "next";

interface NewsStoryLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsStoryLayoutProps): Promise<Metadata> {
    const { slug } = await params;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";

    return {
        robots: { index: false, follow: true },
        alternates: {
            canonical: `${siteUrl}/post/${slug}`,
        },
    };
}

export default function NewsStoryLayout({ children }: NewsStoryLayoutProps) {
    return <>{children}</>;
}