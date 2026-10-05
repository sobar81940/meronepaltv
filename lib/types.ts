import { ObjectId } from "mongodb";

// Nepal's 7 Provinces
export type Province =
    | "कोशी प्रदेश"
    | "मधेश प्रदेश"
    | "बागमती प्रदेश"
    | "गण्डकी प्रदेश"
    | "लुम्बिनी प्रदेश"
    | "कर्णाली प्रदेश"
    | "सुदूरपश्चिम प्रदेश";

export const PROVINCES: { name: Province; slug: string; color: string }[] = [
    { name: "कोशी प्रदेश", slug: "koshi", color: "#e61e2b" },
    { name: "मधेश प्रदेश", slug: "madhesh", color: "#f59e0b" },
    { name: "बागमती प्रदेश", slug: "bagmati", color: "#10b981" },
    { name: "गण्डकी प्रदेश", slug: "gandaki", color: "#3b82f6" },
    { name: "लुम्बिनी प्रदेश", slug: "lumbini", color: "#8b5cf6" },
    { name: "कर्णाली प्रदेश", slug: "karnali", color: "#ec4899" },
    { name: "सुदूरपश्चिम प्रदेश", slug: "sudurpashchim", color: "#06b6d4" },
];

// Content Block Types for multi-section posts
export type ContentBlockType = 'text' | 'image' | 'video' | 'quote' | 'heading' | 'embed';

export interface ContentBlock {
    id: string;
    type: ContentBlockType;
    content: string; // HTML content for text, URL for image/video, quote text, heading text
    caption?: string; // Image/video caption
    mediaUrl?: string; // For image/video blocks
    embedCode?: string; // For embed blocks (YouTube, Twitter, etc.)
    order: number;
}

export interface Post {
    _id?: ObjectId;
    title: string;
    content: string; // Main content (backward compatible)
    contentBlocks?: ContentBlock[]; // Multiple content sections
    excerpt?: string;
    slug: string;
    author?: string;
    authorId?: string; // User ID who created the post
    category?: string;
    province?: Province;
    tags?: string[];
    imageUrl?: string;
    published: boolean;
    // --- Legacy migration fields (optional; populated by scripts/migration) ---
    legacyId?: number; // Original MySQL news.id (unique among migrated posts)
    legacySource?: string; // e.g. "mysql:news"
    migratedAt?: Date;
    language?: string | null; // Original news.language
    metaTitle?: string | null; // Original news.meta_title
    metaDescription?: string | null; // Original news.meta_description
    isBreakingNews?: boolean; // Original news.is_breaking_news
    showAtSlider?: boolean; // Original news.show_at_slider
    showAtPopular?: boolean; // Original news.show_at_popular
    isApproved?: boolean; // Original news.is_approved
    videoUrl?: string | null; // Original news.video_url / video
    isHeadline?: boolean; // Show as headline on home page
    viewCount?: number; // Number of views
    shareCount?: number; // Number of shares (default: 200, +20 per unique IP)
    visitorCount?: number; // Number of unique visitors tracked by IP
    sharedIPs?: string[]; // Array of IP addresses that have shared this post (track unique shares)
    visitorIPs?: string[]; // Array of IP addresses that have visited this post
    readingTime?: number; // Estimated reading time in minutes
    socialShares?: {
        twitter: boolean;
        facebook: boolean;
        instagram: boolean;
        facebookReel: boolean;
        youtube: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

// SEO Settings interface
export interface SeoSettings {
    siteTitle: string;
    siteDescription: string;
    siteKeywords: string[];
    ogImage: string;
    twitterHandle: string;
    googleAnalyticsId: string;
    googleSiteVerification: string;
    bingSiteVerification: string;
    robotsTxt: string;
    enableSitemap: boolean;
    canonicalUrl: string;
}

export interface CreatePostInput {
    title: string;
    content: string;
    contentBlocks?: ContentBlock[];
    excerpt?: string;
    author?: string;
    authorId?: string;
    category?: string;
    province?: Province;
    tags?: string[];
    imageUrl?: string;
    published?: boolean;
    isHeadline?: boolean;
    socialShares?: {
        twitter: boolean;
        facebook: boolean;
        instagram: boolean;
        facebookReel: boolean;
        youtube: boolean;
    };
}

