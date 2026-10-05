import { NextRequest } from "next/server";
import AdvertisementModel, { CreateAdInput, AdPosition } from "@/models/Advertisement";

export const dynamic = "force-dynamic";

// GET all advertisements
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const position = searchParams.get("position") as AdPosition | null;
        const activeOnly = searchParams.get("active") === "true";

        let ads;
        if (position) {
            ads = await AdvertisementModel.findByPosition(position);
        } else if (activeOnly) {
            ads = await AdvertisementModel.findActive();
        } else {
            ads = await AdvertisementModel.findAll();
        }

        return Response.json(
            { success: true, data: ads },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
    } catch (error) {
        console.error("Error fetching ads:", error);
        return Response.json(
            { success: false, error: "Failed to fetch advertisements" },
            { status: 500 }
        );
    }
}

// POST create new advertisement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Support both legacy position and new positions array
        const positions = body.positions || (body.position ? [body.position] : []);

        const input: CreateAdInput = {
            title: body.title,
            imageUrl: body.imageUrl,
            linkUrl: body.linkUrl,
            position: positions[0], // Keep first position for legacy support
            positions: positions,
            isActive: body.isActive,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            priority: body.priority,
        };

        if (!input.title || !input.imageUrl || !input.linkUrl || positions.length === 0) {
            return Response.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const ad = await AdvertisementModel.create(input);
        return Response.json({ success: true, data: ad }, { status: 201 });
    } catch (error) {
        console.error("Error creating ad:", error);
        return Response.json(
            { success: false, error: "Failed to create advertisement" },
            { status: 500 }
        );
    }
}
