import { NextRequest } from "next/server";
import WebStoryModel from "@/models/WebStory";
import { jsonError, serializeId } from "@/lib/mobile";

// GET /api/mobile/webstories/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const story = await WebStoryModel.findBySlug(slug);

        if (!story || !story.published) {
            return jsonError("Web story not found", 404);
        }

        return Response.json({
            success: true,
            data: {
                ...serializeId(story),
                createdAt: (story.createdAt as Date).toISOString(),
                updatedAt: (story.updatedAt as Date).toISOString(),
                slides: story.slides.map((slide) => ({
                    ...slide,
                    duration: slide.duration || 5,
                })),
            },
        });
    } catch (error) {
        console.error("Mobile webstory detail API error:", error);
        return jsonError("Failed to fetch web story", 500);
    }
}
