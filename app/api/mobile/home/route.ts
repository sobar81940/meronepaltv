import { NextRequest } from "next/server";
import { WithId } from "mongodb";
import PostModel from "@/models/Post";
import CategoryModel from "@/models/Category";
import WebStoryModel from "@/models/WebStory";
import EventModel from "@/models/Event";
import CelebrityModel from "@/models/Celebrity";
import UserModel from "@/models/User";
import SettingsModel, { HomeLayoutSection } from "@/models/Settings";
import { Post } from "@/lib/types";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError, serializePostList, toISOString, serializeId } from "@/lib/mobile";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const offset = (page - 1) * limit;

        const cacheKey = `mobile:home:${page}:${limit}`;
        const cached = await withCache(cacheKey, 120, async () => {
            const [
                posts,
                categories,
                headlines,
                settings,
                users,
                webStories,
                events,
                celebrities,
            ] = await Promise.all([
                PostModel.findPublished(300).catch(() => [] as WithId<Post>[]),
                CategoryModel.findAll().catch(() => []),
                PostModel.findHeadlines(5).catch(() => [] as WithId<Post>[]),
                SettingsModel.get().catch(() => undefined),
                UserModel.findAll().catch(() => []),
                WebStoryModel.findPublished(10).catch(() => []),
                EventModel.findUpcoming(5).catch(() => []),
                CelebrityModel.findPublished(6).catch(() => []),
            ]);

            const userMap = new Map(users.map((u) => [u._id.toString(), u]));
            const userNameMap = new Map(users.map((u) => [u.name, u]));
            const getAuthorImage = (p: WithId<Post>) => {
                if (p.authorId && userMap.has(p.authorId)) {
                    const img = userMap.get(p.authorId)?.profileImage;
                    if (img) return img;
                }
                if (p.author && userNameMap.has(p.author)) {
                    return userNameMap.get(p.author)?.profileImage;
                }
                return undefined;
            };

            const enrichPosts = (source: WithId<Post>[]) =>
                source.map((p) => ({
                    ...(serializePostList([p])[0] as Record<string, unknown>),
                    authorImage: getAuthorImage(p),
                }));

            // Latest posts (no province, paginated)
            const headlineIds = new Set(headlines.map((h) => h._id.toString()));
            const nonProvincePosts = posts.filter((p) => !p.province && !headlineIds.has(p._id.toString()));
            const latest = enrichPosts(nonProvincePosts.slice(offset, offset + limit));

            // Trending by views
            const trending = enrichPosts(
                [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5)
            );

            // Category sections built from the saved home layout
            const layoutSections: HomeLayoutSection[] = settings?.homeLayout?.length
                ? settings.homeLayout
                : [];
            const categorySections = Array.from(
                new Map(
                    layoutSections
                        .filter((s) => s.type === "category" && s.categoryId)
                        .map((s) => [s.categoryId as string, s])
                ).values()
            );

            const categoryMap = new Map(categories.map((c) => [c.slug, c.name]));
            categories.forEach((c) => categoryMap.set(c.name, c.slug));

            const sections = await Promise.all(
                categorySections.slice(0, 10).map(async (section) => {
                    const categoryName = categories.find((c) => c.slug === section.categoryId)?.name;
                    const categoryPosts = posts
                        .filter(
                            (p) =>
                                p.category === categoryName ||
                                p.category === section.categoryId
                        )
                        .slice(0, 7);
                    return {
                        type: "category" as const,
                        title: section.title || categoryName || section.categoryId,
                        categoryId: section.categoryId,
                        layout: section.layout || "list",
                        posts: enrichPosts(categoryPosts),
                    };
                })
            );

            const serializedStories = webStories.map((s) => serializeId(s));

            const serializedEvents = events.map((e) => ({
                ...serializeId(e),
                startDate: toISOString(e.startDate),
                endDate: e.endDate ? toISOString(e.endDate) : undefined,
            }));

            const serializedCelebrities = celebrities.map((c) => ({
                _id: c._id.toString(),
                name: c.name,
                slug: c.slug,
                title: c.title,
                shortBio: c.shortBio,
                imageUrl: c.imageUrl,
                category: c.category,
                isFeatured: c.isFeatured,
            }));

            const serializedCategories = categories.map((c) => ({
                _id: c._id.toString(),
                name: c.name,
                slug: c.slug,
                color: c.color,
            }));

            return {
                site: {
                    name: settings?.siteName || "MeroNepalTv",
                    tagline: settings?.siteTagline || "",
                    logoUrl: settings?.logoUrl || "",
                    logoText: settings?.logoText || "",
                },
                headlines: enrichPosts(headlines),
                latest,
                trending,
                sections,
                categories: serializedCategories,
                webStories: serializedStories,
                events: serializedEvents,
                celebrities: serializedCelebrities,
                pagination: {
                    page,
                    limit,
                    total: nonProvincePosts.length,
                    pages: Math.max(1, Math.ceil(nonProvincePosts.length / limit)),
                },
            };
        });

        return Response.json({ success: true, data: cached }, { headers: getCacheHeaders(120) });
    } catch (error) {
        console.error("Mobile home API error:", error);
        return jsonError("Failed to load home feed", 500);
    }
}
