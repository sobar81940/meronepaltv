import { uploadToSpaces } from "@/lib/spaces";
import { NextRequest } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return Response.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
                },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { success: false, error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize the original filename
        const sanitizedFilename = sanitizeFilename(file.name);

        // Upload to DigitalOcean Spaces with original filename
        const result = await uploadToSpaces(buffer, {
            folder: "news-portal",
            filename: sanitizedFilename,
            contentType: file.type,
        });

        // NOTE: This endpoint only uploads the file to R2/Spaces. It intentionally
        // does NOT create a Gallery record. Post images, logos, navigation
        // graphics, ads and other uploads must never appear in the Photo Gallery.
        // Only items created through /admin/gallery (POST /api/gallery) belong there.
        return Response.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId,
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
        return Response.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
