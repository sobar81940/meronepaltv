import { NextRequest } from "next/server";
import PostModel from "@/models/Post";
import { getClientIp, jsonError, jsonOk } from "@/lib/mobile";

// POST /api/mobile/posts/[slug]/view
// Increments the view counter. Sends client IP for unique-visitor tracking.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const post = await PostModel.findBySlug(slug);
        if (!post) {
            return jsonError("Post not found", 404);
        }

        const ip = getClientIp(request);
        await PostModel.incrementViewCount(slug, ip);

        return jsonOk({ slug, viewCount: (post.viewCount || 0) + 1 });
    } catch (error) {
        console.error("Mobile view tracking error:", error);
        return jsonError("Failed to track view", 500);
    }
}
