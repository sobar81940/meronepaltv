import { NextRequest } from "next/server";
import PostModel from "@/models/Post";
import { jsonError, serializePostList } from "@/lib/mobile";

// GET /api/mobile/posts
// Query params: page, limit, category, province, tag, search, sort (latest|views)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const category = searchParams.get("category");
        const province = searchParams.get("province");
        const tag = searchParams.get("tag");
        const search = searchParams.get("search");
        const sort = searchParams.get("sort") || "latest";

        const filter: import("mongodb").Filter<import("@/lib/types").Post> = {
            published: true,
        };

        if (category) {
            filter.$or = [
                { category },
                ...(category === "news" ? [{ category: "समाचार" }] : []),
                ...(category === "world" ? [{ category: "विश्व" }] : []),
            ];
        }

        if (province) filter.province = province as import("@/lib/types").Province;
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { content: { $regex: escaped, $options: "i" } },
                { tags: { $in: [new RegExp(escaped, "i")] } },
            ];
        }
        if (tag) {
            const cleanTag = tag.startsWith("#") ? tag.substring(1) : tag;
            const escaped = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.tags = { $in: [new RegExp(`^${escaped}$`, "i"), new RegExp(`^#${escaped}$`, "i")] };
        }

        const result = await PostModel.paginate(page, limit, filter);

        let posts = result.posts;
        if (sort === "views" && filter.$or === undefined) {
            posts = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        }

        return Response.json({
            success: true,
            data: serializePostList(posts),
            pagination: {
                page,
                limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error("Mobile posts API error:", error);
        return jsonError("Failed to fetch posts", 500);
    }
}
