import PostModel from "@/models/Post";
import ShortsFeed from "@/components/ShortsFeed";
import { Post } from "@/lib/types";
import { WithId } from "mongodb";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";

export const metadata: Metadata = {
    title: "छोटा भिडियोहरू",
    description: "MeroNepalTv का नेपाली मनोरञ्जन, चलचित्र, सेलिब्रिटी र समाचारसम्बन्धी छोटा भिडियोहरू हेर्नुहोस्।",
    alternates: { canonical: `${SITE_URL}/shorts` },
    openGraph: {
        title: "छोटा भिडियोहरू | MeroNepalTv",
        description: "नेपाली मनोरञ्जन, चलचित्र, सेलिब्रिटी र समाचारका छोटा भिडियोहरू।",
        url: `${SITE_URL}/shorts`,
        type: "website",
        locale: "ne_NP",
        siteName: "MeroNepalTv",
    },
};

export const revalidate = 60;

export default async function ShortsPage() {
    const publishedPosts = await PostModel.findPublished(300).catch(() => [] as WithId<Post>[]);
    const allPosts = await PostModel.findAll().catch(() => [] as WithId<Post>[]);

    const isShortPost = (post: WithId<Post>) => {
        const hasShortFlag = post.socialShares?.youtube || post.socialShares?.facebookReel;
        const hasVideoBlock = post.contentBlocks?.some(block => block.type === "video" || block.type === "embed");
        return Boolean(hasShortFlag || hasVideoBlock);
    };

    const shortsSource = publishedPosts.filter(isShortPost);
    const shortsPosts = (shortsSource.length > 0 ? shortsSource : allPosts.filter(isShortPost))
        .map(post => ({
            _id: post._id.toString(),
            title: post.title,
            slug: post.slug,
            imageUrl: post.imageUrl,
            excerpt: post.excerpt,
            createdAt: post.createdAt.toISOString(),
            contentBlocks: post.contentBlocks,
            socialShares: post.socialShares,
        }));

    return <ShortsFeed posts={shortsPosts} />;
}