import { NextRequest } from "next/server";
import EventModel from "@/models/Event";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError, serializeId, toISOString } from "@/lib/mobile";

// GET /api/mobile/events
// Query params: limit, status, category
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
        const status = searchParams.get("status") as "upcoming" | "ongoing" | "completed" | undefined;
        const category = searchParams.get("category") as import("@/models/Event").EventCategory | undefined;

        const data = await withCache(`mobile:events:${limit}:${status || "all"}:${category || "all"}`, 300, async () => {
            const events = await EventModel.findAll({
                limit,
                status,
                category,
                published: true,
            });

            return events.map((e) => ({
                ...serializeId(e),
                startDate: toISOString(e.startDate),
                endDate: e.endDate ? toISOString(e.endDate) : null,
                createdAt: toISOString(e.createdAt),
                updatedAt: toISOString(e.updatedAt),
            }));
        });

        return Response.json({ success: true, data }, { headers: getCacheHeaders(300) });
    } catch (error) {
        console.error("Mobile events API error:", error);
        return jsonError("Failed to fetch events", 500);
    }
}
