import { NextRequest } from "next/server";
import PostModel from "@/models/Post";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError } from "@/lib/mobile";

// GET /api/mobile/tags
// Query params: limit (default 20), period (week|month|all)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const period = (searchParams.get("period") || "all") as "week" | "month" | "all";

        const data = await withCache(`mobile:tags:${limit}:${period}`, 600, () =>
            PostModel.getMostViewedTags(limit, period)
        );

        return Response.json({ success: true, data }, { headers: getCacheHeaders(600) });
    } catch (error) {
        console.error("Mobile tags API error:", error);
        return jsonError("Failed to fetch tags", 500);
    }
}
