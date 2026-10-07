import { notFound } from "next/navigation";
import WebStoryModel from "@/models/WebStory";
import StoryViewer from "@/components/StoryViewer";
import { stripHtmlTags } from "@/lib/utils";

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

// Helper to safely convert date to ISO string
const toISOString = (date: unknown): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (date as any).toISOString === 'function') return (date as any).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Date(date as any).toISOString();
};

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function WebStoryPage({ params }: PageProps) {
    const { slug } = await params;

    const story = await WebStoryModel.findBySlug(slug);

    if (!story || !story.published) {
        notFound();
    }

    // Increment view count
    await WebStoryModel.incrementViewCount(slug);

    // Get all stories for navigation
    const allStories = await WebStoryModel.findPublished();

    // Serialize for client component
    const serializedStory = {
        ...story,
        _id: story._id?.toString(),
        createdAt: toISOString(story.createdAt),
        updatedAt: toISOString(story.updatedAt),
    };

    const serializedAllStories = allStories.map(s => ({
        ...s,
        _id: s._id?.toString(),
        createdAt: toISOString(s.createdAt),
        updatedAt: toISOString(s.updatedAt),
    }));

    return (
        <StoryViewer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            story={serializedStory as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allStories={serializedAllStories as any}
        />
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const story = await WebStoryModel.findBySlug(slug);

    if (!story) {
        return { title: 'Story Not Found' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const coverImage = story.coverImage
        ? (story.coverImage.startsWith("http") ? story.coverImage : `${siteUrl}${story.coverImage}`)
        : undefined;
    const description = stripHtmlTags(story.slides[0]?.text || story.title || "");

    const storyUrl = `${siteUrl}/web-stories/${story.slug}`;

    return {
        title: story.title,
        description: description,
        alternates: {
            canonical: storyUrl,
            languages: { ne: storyUrl },
        },
        openGraph: {
            title: story.title,
            description: description,
            url: storyUrl,
            images: coverImage ? [{ url: coverImage, alt: story.title }] : undefined,
            type: 'article',
            locale: 'ne_NP',
            siteName: 'MeroNepalTv',
        },
        twitter: {
            card: "summary_large_image",
            title: story.title,
            description: description,
            images: coverImage ? [coverImage] : undefined,
        },
    };
}
