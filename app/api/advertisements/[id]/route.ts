import { NextRequest } from "next/server";
import AdvertisementModel, { CreateAdInput } from "@/models/Advertisement";

// GET single advertisement
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ad = await AdvertisementModel.findById(id);

        if (!ad) {
            return Response.json(
                { success: false, error: "Advertisement not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: ad });
    } catch (error) {
        console.error("Error fetching ad:", error);
        return Response.json(
            { success: false, error: "Failed to fetch advertisement" },
            { status: 500 }
        );
    }
}

// PUT update advertisement
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Support both legacy position and new positions array
        const positions = body.positions || (body.position ? [body.position] : undefined);

        const input: Partial<CreateAdInput> = {
            title: body.title,
            imageUrl: body.imageUrl,
            linkUrl: body.linkUrl,
            position: positions ? positions[0] : body.position, // Keep first position for legacy
            positions: positions,
            isActive: body.isActive,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            priority: body.priority,
        };

        const ad = await AdvertisementModel.update(id, input);

        if (!ad) {
            return Response.json(
                { success: false, error: "Advertisement not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: ad });
    } catch (error) {
        console.error("Error updating ad:", error);
        return Response.json(
            { success: false, error: "Failed to update advertisement" },
            { status: 500 }
        );
    }
}

// DELETE advertisement
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = await AdvertisementModel.delete(id);

        if (!success) {
            return Response.json(
                { success: false, error: "Advertisement not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting ad:", error);
        return Response.json(
            { success: false, error: "Failed to delete advertisement" },
            { status: 500 }
        );
    }
}

// PATCH toggle active status or record click
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (body.action === "toggle") {
            const ad = await AdvertisementModel.toggleActive(id);
            if (!ad) {
                return Response.json(
                    { success: false, error: "Advertisement not found" },
                    { status: 404 }
                );
            }
            return Response.json({ success: true, data: ad });
        }

        if (body.action === "click") {
            await AdvertisementModel.recordClick(id);
            return Response.json({ success: true });
        }

        if (body.action === "impression") {
            await AdvertisementModel.recordImpression(id);
            return Response.json({ success: true });
        }

        return Response.json(
            { success: false, error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error updating ad:", error);
        return Response.json(
            { success: false, error: "Failed to update advertisement" },
            { status: 500 }
        );
    }
}
