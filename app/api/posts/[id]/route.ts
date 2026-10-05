import PostModel from "@/models/Post";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { postToTwitter, postToFacebook, postToInstagram, postToFacebookReel, postToYouTube } from "@/lib/social";
import SettingsModel from "@/models/Settings";

// GET single post by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const post = await PostModel.findById(id);

        if (!post) {
            return Response.json(
                { success: false, error: "Post not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: post });
    } catch (error) {
        console.error("Error fetching post:", error);
        return Response.json(
            { success: false, error: "Failed to fetch post" },
            { status: 500 }
        );
    }
}

// UPDATE a post
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const post = await PostModel.update(id, body);

        if (!post) {
            return Response.json(
                { success: false, error: "Post not found" },
                { status: 404 }
            );
        }

        // Handle Social Media Auto-Posting on publish
        if (post && body.published && body.socialShares) {
            try {
                const settings = await SettingsModel.get();

                if (settings?.socialMedia) {
                    const { socialShares } = body;
                    const socialPost = {
                        title: post.title,
                        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/post/${post.slug}`,
                        imageUrl: post.imageUrl
                    };

                    // Find first video URL from content blocks
                    const videoBlock = post.contentBlocks?.find(b => b.type === 'video' && b.mediaUrl);
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

                    await Promise.allSettled(promises);
                }
            } catch (error) {
                console.error("Error in social media auto-posting:", error);
            }
        }

        return Response.json({
            success: true,
            data: post,
            message: "Post updated successfully",
        });
    } catch (error) {
        console.error("Error updating post:", error);
        return Response.json(
            { success: false, error: "Failed to update post" },
            { status: 500 }
        );
    }
}

// DELETE a post - Admin only
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const deleted = await PostModel.delete(id);

        if (!deleted) {
            return Response.json(
                { success: false, error: "Post not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        return Response.json(
            { success: false, error: "Failed to delete post" },
            { status: 500 }
        );
    }
}

// PATCH - Toggle publish status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const post = await PostModel.togglePublish(id);

        if (!post) {
            return Response.json(
                { success: false, error: "Post not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: post,
            message: `Post ${post.published ? "published" : "unpublished"} successfully`,
        });
    } catch (error) {
        console.error("Error toggling post:", error);
        return Response.json(
            { success: false, error: "Failed to toggle post status" },
            { status: 500 }
        );
    }
}
