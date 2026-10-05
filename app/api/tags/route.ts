import { NextRequest, NextResponse } from "next/server";
import PostModel from "@/models/Post";

// GET /api/tags - Get all tags with counts
// ?sort=views  → sorted by total view count of posts (most viewed tags first)
// ?sort=count  → sorted by number of posts (default)
// ?limit=N     → number of tags to return (default 50)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "50");
        const sort = searchParams.get("sort") || "count";
        const period = (searchParams.get("period") || "all") as "week" | "month" | "all";

        if (sort === "views") {
            const tags = await PostModel.getMostViewedTags(limit, period);
            return NextResponse.json({
                success: true,
                data: tags,
                total: tags.length
            });
        }

        const tags = await PostModel.getAllTags();
        const limitedTags = tags.slice(0, limit);

        return NextResponse.json({
            success: true,
            data: limitedTags,
            total: tags.length
        });
    } catch (error) {
        console.error("Tags fetch error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch tags" },
            { status: 500 }
        );
    }
}
