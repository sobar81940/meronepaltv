import { NextRequest } from "next/server";
import PostModel from "@/models/Post";
import { getClientIp, jsonError, jsonOk } from "@/lib/mobile";

// POST /api/mobile/posts/[slug]/share
// Increments the share counter (requires client IP + location for unique tracking)
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const post = await PostModel.findBySlug(slug);
        if (!post) {
            return jsonError("Post not found", 404);
        }

        const ip = getClientIp(request);
        let location: { lat?: number; lon?: number } | null = null;
        try {
            const body = await request.json();
            if (body?.location?.lat && body?.location?.lon) {
                location = { lat: body.location.lat, lon: body.location.lon };
            }
        } catch {
            // No body - continue without location
        }

        const result = await PostModel.incrementShareCount(slug, ip, location);

        return jsonOk(
            { slug, incremented: result.incremented },
            result.incremented
                ? { message: "Share recorded" }
                : { message: "Share already recorded or missing required data" }
        );
    } catch (error) {
        console.error("Mobile share tracking error:", error);
        return jsonError("Failed to track share", 500);
    }
}
