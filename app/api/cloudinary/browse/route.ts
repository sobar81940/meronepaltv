import { listFromSpaces } from "@/lib/spaces";
import { NextRequest } from "next/server";

// GET - Browse images from DigitalOcean Spaces (legacy Cloudinary endpoint)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get("folder") || "news-portal";
        const limit = parseInt(searchParams.get("limit") || "50");
        const cursor = searchParams.get("cursor") || undefined;

        const result = await listFromSpaces({
            folder,
            maxResults: limit,
            continuationToken: cursor,
        });

        // Transform to match gallery format
        const data = result.images.map((img, index) => ({
            _id: img.key,
            title: img.key.split("/").pop()?.replace(/[-_]/g, " ").replace(/\.\w+$/, "") || `Image ${index + 1}`,
            url: img.url,
            thumbnailUrl: img.url,
            type: "image",
            size: img.size,
            createdAt: img.lastModified?.toISOString() || new Date().toISOString(),
            publicId: img.key,
        }));

        return Response.json({
            success: true,
            data,
            nextCursor: result.nextCursor,
        });
    } catch (error) {
        console.error("Error browsing Spaces:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to browse images";
        return Response.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
