import { NextRequest } from "next/server";
import WebStoryModel from "@/models/WebStory";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError, serializeId } from "@/lib/mobile";

// GET /api/mobile/webstories
// Query params: limit
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

        const data = await withCache(`mobile:webstories:${limit}`, 300, async () => {
            const stories = await WebStoryModel.findPublished(limit);
            return stories.map((s) => {
                const serialized = serializeId(s);
                return {
                    ...serialized,
                    createdAt: (s.createdAt as Date).toISOString(),
                    updatedAt: (s.updatedAt as Date).toISOString(),
                    slides: s.slides.map((slide) => ({
                        ...slide,
                        duration: slide.duration || 5,
                    })),
                };
            });
        });

        return Response.json({ success: true, data }, { headers: getCacheHeaders(300) });
    } catch (error) {
        console.error("Mobile webstories API error:", error);
        return jsonError("Failed to fetch web stories", 500);
    }
}
