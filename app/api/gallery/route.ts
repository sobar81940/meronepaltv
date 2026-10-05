import GalleryModel, { MediaType } from "@/models/Gallery";
import { uploadToSpaces, uploadVideoToSpaces } from "@/lib/spaces";
import { NextRequest } from "next/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

// Sanitize filename while preserving original name
function sanitizeFilename(filename: string): string {
    // Get the base name and extension
    const lastDot = filename.lastIndexOf('.');
    const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
    const extension = lastDot !== -1 ? filename.substring(lastDot) : '';

    // Sanitize: remove special chars, keep alphanumeric, hyphens, underscores
    const sanitized = baseName
        .replace(/[^a-zA-Z0-9\s_-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .toLowerCase()
        .substring(0, 100); // Limit length

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    return `${sanitized}-${timestamp}${extension.toLowerCase()}`;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// GET all gallery items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") as MediaType | null;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const grouped = searchParams.get("grouped") === "true";
        // The admin gallery passes admin=true to see drafts/unpublished and
        // every item (including legacy auto-uploaded ones). Public callers omit
        // it and only ever receive published, admin-gallery items.
        const includeUnpublished = searchParams.get("admin") === "true";

        // Search
        if (search) {
            const items = await GalleryModel.search(search, includeUnpublished);
            return Response.json({ success: true, data: items });
        }

        // Get by category
        if (category) {
            const items = await GalleryModel.findByCategory(category, includeUnpublished);
            // Filter by type if specified
            const filtered = type ? items.filter(item => item.type === type) : items;
            return Response.json({ success: true, data: filtered });
        }

        // Grouped by category
        if (grouped) {
            const groupedItems = await GalleryModel.findGroupedByCategory(type || undefined, limit);
            return Response.json({ success: true, data: groupedItems });
        }

        // Paginated results
        const result = await GalleryModel.paginate(page, limit, type || undefined, includeUnpublished);

        return Response.json({
            success: true,
            data: result.items,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error("Error fetching gallery:", error);
        return Response.json(
            { success: false, error: "Failed to fetch gallery items" },
            { status: 500 }
        );
    }
}

// CREATE new gallery item (file upload or YouTube link)
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // Handle YouTube video submission (JSON)
        if (contentType.includes("application/json")) {
            const body = await request.json();

            if (!body.youtubeUrl && !body.youtubeId) {
                return Response.json(
                    { success: false, error: "YouTube URL or ID is required" },
                    { status: 400 }
                );
            }

            const youtubeId = body.youtubeId || extractYouTubeId(body.youtubeUrl);

            if (!youtubeId) {
                return Response.json(
                    { success: false, error: "Invalid YouTube URL or ID" },
                    { status: 400 }
                );
            }

            const thumbnailUrl = getYouTubeThumbnail(youtubeId);
            const tags = (body.tags || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean);

            const item = await GalleryModel.create({
                title: body.title || `YouTube Video`,
                description: body.description || "",
                type: "video",
                url: `https://www.youtube.com/watch?v=${youtubeId}`,
                thumbnailUrl,
                publicId: `youtube_${youtubeId}`,
                category: body.category || undefined,
                tags,
                videoSource: "youtube",
                youtubeId,
                isPublished: body.isPublished ?? true,
                showOnHome: body.showOnHome ?? true,
            });

            return Response.json(
                {
                    success: true,
                    data: item,
                    message: "YouTube video added successfully",
                },
                { status: 201 }
            );
        }

        // Handle file upload (FormData)
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string || "";
        const description = formData.get("description") as string || "";
        const category = formData.get("category") as string || "";
        const tagsStr = formData.get("tags") as string || "";
        // Visibility flags from the admin form. Absent = default to visible.
        const isPublished = (formData.get("isPublished") as string) !== "false";
        const showOnHome = (formData.get("showOnHome") as string) !== "false";

        if (!file) {
            return Response.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Determine media type
        const isImage = IMAGE_TYPES.includes(file.type);
        const isVideo = VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV, AVI",
                },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
            return Response.json(
                {
                    success: false,
                    error: `File size exceeds ${isVideo ? "100MB" : "10MB"} limit`
                },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to DigitalOcean Spaces with original filename
        const sanitizedFilename = sanitizeFilename(file.name);
        const mediaType: MediaType = isVideo ? "video" : "image";
        const uploadResult = isVideo
            ? await uploadVideoToSpaces(buffer, { folder: "news-portal/videos", filename: sanitizedFilename, contentType: file.type })
            : await uploadToSpaces(buffer, { folder: "news-portal/gallery", filename: sanitizedFilename, contentType: file.type });

        // Generate thumbnail for videos (use video URL as placeholder)
        const thumbnailUrl: string | undefined = isVideo ? uploadResult.url : undefined;

        // Parse tags
        const tags = tagsStr
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        // Create gallery item
        const item = await GalleryModel.create({
            title: title || file.name.replace(/\.[^/.]+$/, ""),
            description,
            type: mediaType,
            url: uploadResult.url,
            thumbnailUrl,
            publicId: uploadResult.key,
            category: category || undefined,
            tags,
            size: file.size,
            videoSource: isVideo ? "upload" : undefined,
            isPublished,
            showOnHome,
        });

        return Response.json(
            {
                success: true,
                data: item,
                message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Gallery upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload media";
        return Response.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// PATCH - Bulk update multiple gallery items
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, updates } = body as {
            ids: string[];
            updates: { category?: string; tags?: string[] };
        };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return Response.json(
                { success: false, error: "No items selected" },
                { status: 400 }
            );
        }

        if (!updates || Object.keys(updates).length === 0) {
            return Response.json(
                { success: false, error: "No updates provided" },
                { status: 400 }
            );
        }

        // Update each item
        const results = await Promise.all(
            ids.map(async (id) => {
                try {
                    const updated = await GalleryModel.update(id, updates);
                    return { id, success: !!updated };
                } catch {
                    return { id, success: false };
                }
            })
        );

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return Response.json({
            success: true,
            message: `Updated ${successCount} items${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
            results,
        });
    } catch (error) {
        console.error("Bulk update error:", error);
        return Response.json(
            { success: false, error: "Failed to update items" },
            { status: 500 }
        );
    }
}

