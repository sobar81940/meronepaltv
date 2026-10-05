import { NextRequest } from "next/server";
import PostModel from "@/models/Post";
import UserModel from "@/models/User";
import { jsonError, serializePostDetail, serializePostList } from "@/lib/mobile";

// GET /api/mobile/posts/[slug]
// Returns post detail + related posts
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        const post = await PostModel.findBySlug(slug);
        if (!post || !post.published) {
            return jsonError("Post not found", 404);
        }

        const [related, author] = await Promise.all([
            PostModel.findRelatedPosts(post.category || "", 6, post._id.toString()).catch(() => []),
            post.authorId ? UserModel.findById(post.authorId).catch(() => null) : null,
        ]);

        const data = serializePostDetail(post) as Record<string, unknown>;
        data.related = serializePostList(related);
        if (author) {
            data.authorImage = author.profileImage || null;
            data.authorBio = author.name;
        }

        return Response.json({ success: true, data });
    } catch (error) {
        console.error("Mobile post detail API error:", error);
        return jsonError("Failed to fetch post", 500);
    }
}
