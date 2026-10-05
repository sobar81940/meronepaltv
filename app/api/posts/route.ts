import PostModel from "@/models/Post";
import { CreatePostInput } from "@/lib/types";
import { NextRequest } from "next/server";
import { postToTwitter, postToFacebook, postToInstagram, postToFacebookReel, postToYouTube } from "@/lib/social";
import SettingsModel from "@/models/Settings";
import { getSession } from "@/lib/auth";
import UserModel from "@/models/User";
import { withCache, cacheKeys, getCacheHeaders, invalidateCache } from "@/lib/cache";

// Enable caching for GET requests
export const revalidate = 300; // ISR: revalidate every 5 minutes

// GET all posts with caching
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const published = searchParams.get("published");
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const shareType = searchParams.get("shareType");

        // Check session for role-based filtering
        const session = await getSession();

        // Role-based filtering for paginated results
        const filter: import('mongodb').Filter<import('@/lib/types').Post> = {};

        if (!session) {
            // Public: only published posts
            filter.published = true;
        } else if (session.role === "demo") {
            // Demo user: only their own posts
            filter.authorId = session.id;
        } else if (published === "true") {
            // Admin/Editor with published filter
            filter.published = true;
        }
        // Admin/Editor without filter: all posts (filter stays empty)

        // Category filter
        if (category) {
            filter.category = category;
        }

        if (shareType === "youtube") {
            filter["socialShares.youtube"] = true;
        } else if (shareType === "facebookReel") {
            filter["socialShares.facebookReel"] = true;
        }

        // Search query (don't cache search results as they're often different)
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            filter.$or = [
                { title: { $regex: escapedSearch, $options: "i" } },
                { content: { $regex: escapedSearch, $options: "i" } },
                { tags: { $in: [new RegExp(escapedSearch, "i")] } },
            ];
            
            const result = await PostModel.paginate(page, limit, filter);
            return Response.json({
                success: true,
                data: result.posts,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    pages: result.pages,
                },
            });
        }

        // For category-based posts, use cache ONLY for anonymous public
        // requests. Session-based requests (admin/editor/demo) apply role
        // filters and need accurate, non-shared results. The cache key also
        // includes the page so pagination within a category works correctly.
        if (category && !session) {
            const cacheKey = `${cacheKeys.postsByCategory(category, limit)}:p${page}`;
            const result = await withCache(
                cacheKey,
                300, // 5 minutes
                () => PostModel.paginate(page, limit, filter)
            );

            return Response.json(
                {
                    success: true,
                    data: result.posts,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        pages: result.pages,
                    },
                },
                { headers: getCacheHeaders(300) }
            );
        }

        // Regular paginated posts without cache (faster for first page)
        const result = await PostModel.paginate(page, limit, filter);

        return Response.json({
            success: true,
            data: result.posts,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: result.pages,
            },
        }, { headers: getCacheHeaders(60) }); // Light caching for first page
    } catch (error) {
        console.error("Error fetching posts:", error);
        return Response.json(
            { success: false, error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}

// CREATE a new post
export async function POST(request: NextRequest) {
    try {
        // Check session and permissions
        const session = await getSession();
        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user can create post (enforces demo limits)
        const canCreate = await UserModel.canCreatePost(session.id);
        if (!canCreate.allowed) {
            console.error("POST /api/posts 403 - canCreatePost failed:", {
                sessionId: session.id,
                sessionEmail: session.email,
                sessionRole: session.role,
                reason: canCreate.reason
            });
            return Response.json(
                { success: false, error: canCreate.reason },
                { status: 403 }
            );
        }

        const body: CreatePostInput = await request.json();

        if (!body.title || !body.content) {
            return Response.json(
                { success: false, error: "Title and content are required" },
                { status: 400 }
            );
        }

        // Add authorId from session (unless admin sets it)
        if (session.role === "admin" && body.authorId) {
            // Keep provided authorId
        } else {
            body.authorId = session.id;
        }
        body.author = body.author || session.name;

        const post = await PostModel.create(body);

        // Increment user's post count (for demo limit tracking)
        await UserModel.incrementPostCount(session.id);

        // Handle Social Media Auto-Posting
        if (post && body.published && body.socialShares) {
            try {
                // Fetch site settings to get credentials
                const settings = await SettingsModel.get();

                if (settings?.socialMedia) {
                    const { socialShares } = body;
                    const socialPost = {
                        title: post.title,
                        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/post/${post.slug}`,
                        imageUrl: post.imageUrl
                    };

                    // Find first video URL from content blocks for Reel/Shorts
                    const videoBlock = body.contentBlocks?.find(b => b.type === 'video' && b.mediaUrl);
                    const videoUrl = videoBlock?.mediaUrl;

                    const promises = [];

                    if (socialShares.twitter && settings.socialMedia.twitter?.enabled) {
                        promises.push(postToTwitter(socialPost, settings.socialMedia.twitter));
                    }

                    if (socialShares.facebook && settings.socialMedia.facebook?.enabled) {
                        promises.push(postToFacebook(socialPost, settings.socialMedia.facebook));
                    }

                    if (socialShares.instagram && settings.socialMedia.instagram?.enabled) {
                        promises.push(postToInstagram(socialPost, settings.socialMedia.instagram));
                    }

                    if (socialShares.facebookReel && settings.socialMedia.facebook?.enabled && videoUrl) {
                        promises.push(postToFacebookReel(
                            { ...socialPost, videoUrl },
                            settings.socialMedia.facebook
                        ));
                    }

                    if (socialShares.youtube && settings.socialMedia.youtube?.enabled && videoUrl) {
                        promises.push(postToYouTube(
                            { ...socialPost, videoUrl },
                            settings.socialMedia.youtube
                        ));
                    }

                    // Execute all social posts without blocking (or await if we want to log errors here)
                    // We await them to log results but catch errors so we don't fail the request
                    await Promise.allSettled(promises);
                }
            } catch (error) {
                console.error("Error in social media auto-posting:", error);
                // We don't return error here because the post was successfully created
            }
        }

        return Response.json(
            {
                success: true,
                data: post,
                message: "Post created successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating post:", error);
        return Response.json(
            { success: false, error: "Failed to create post" },
            { status: 500 }
        );
    }
}

// DELETE multiple posts (bulk delete) - Admin only
export async function DELETE(request: NextRequest) {
    try {
        // Check session and require admin role
        const session = await getSession();
        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (session.role !== "admin") {
            return Response.json(
                { success: false, error: "Permission denied. Only administrators can delete posts." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return Response.json(
                { success: false, error: "No post IDs provided" },
                { status: 400 }
            );
        }

        let deletedCount = 0;
        for (const id of ids) {
            const deleted = await PostModel.delete(id);
            if (deleted) deletedCount++;
        }

        return Response.json({
            success: true,
            message: `${deletedCount} post(s) deleted successfully`,
            deletedCount,
        });
    } catch (error) {
        console.error("Error deleting posts:", error);
        return Response.json(
            { success: false, error: "Failed to delete posts" },
            { status: 500 }
        );
    }
}

// PATCH - Bulk update posts (category, headline) - Admin only
export async function PATCH(request: NextRequest) {
    try {
        // Check session and require admin role
        const session = await getSession();
        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (session.role !== "admin") {
            return Response.json(
                { success: false, error: "Permission denied. Only administrators can bulk update posts." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { ids, updates } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return Response.json(
                { success: false, error: "No post IDs provided" },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== "object") {
            return Response.json(
                { success: false, error: "No updates provided" },
                { status: 400 }
            );
        }

        // Only allow specific fields to be bulk updated
        const allowedFields = ["category", "isHeadline", "published"];
        const sanitizedUpdates: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in updates) {
                sanitizedUpdates[key] = updates[key];
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return Response.json(
                { success: false, error: "No valid updates provided" },
                { status: 400 }
            );
        }

        let updatedCount = 0;
        for (const id of ids) {
            const updated = await PostModel.update(id, sanitizedUpdates);
            if (updated) updatedCount++;
        }

        return Response.json({
            success: true,
            message: `${updatedCount} post(s) updated successfully`,
            updatedCount,
        });
    } catch (error) {
        console.error("Error updating posts:", error);
        return Response.json(
            { success: false, error: "Failed to update posts" },
            { status: 500 }
        );
    }
}
