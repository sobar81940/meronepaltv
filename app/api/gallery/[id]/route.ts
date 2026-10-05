import GalleryModel from "@/models/Gallery";
import { deleteFromSpaces } from "@/lib/spaces";
import { NextRequest } from "next/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single gallery item
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const item = await GalleryModel.findById(id);

        if (!item) {
            return Response.json(
                { success: false, error: "Gallery item not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: item });
    } catch (error) {
        console.error("Error fetching gallery item:", error);
        return Response.json(
            { success: false, error: "Failed to fetch gallery item" },
            { status: 500 }
        );
    }
}

// UPDATE gallery item
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const item = await GalleryModel.update(id, {
            title: body.title,
            description: body.description,
            category: body.category,
            tags: body.tags,
            isPublished: body.isPublished,
            showOnHome: body.showOnHome,
        });

        if (!item) {
            return Response.json(
                { success: false, error: "Gallery item not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: item,
            message: "Gallery item updated successfully",
        });
    } catch (error) {
        console.error("Error updating gallery item:", error);
        return Response.json(
            { success: false, error: "Failed to update gallery item" },
            { status: 500 }
        );
    }
}

// DELETE gallery item
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // Get item to retrieve publicId and type
        const item = await GalleryModel.findById(id);
        if (!item) {
            return Response.json(
                { success: false, error: "Gallery item not found" },
                { status: 404 }
            );
        }

        // Delete from DigitalOcean Spaces
        try {
            await deleteFromSpaces(item.publicId);
        } catch (spacesError) {
            console.error("Failed to delete from Spaces:", spacesError);
            // Continue with DB deletion even if Spaces fails
        }

        // Delete from database
        const deleted = await GalleryModel.delete(id);

        if (!deleted) {
            return Response.json(
                { success: false, error: "Failed to delete gallery item" },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            message: "Gallery item deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return Response.json(
            { success: false, error: "Failed to delete gallery item" },
            { status: 500 }
        );
    }
}
