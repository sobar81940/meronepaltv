import { NextRequest, NextResponse } from "next/server";
import CelebrityModel from "@/models/Celebrity";

// GET single celebrity
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const celebrity = await CelebrityModel.findById(id);

        if (!celebrity) {
            return NextResponse.json(
                { error: "Celebrity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(celebrity);
    } catch (error) {
        console.error("Error fetching celebrity:", error);
        return NextResponse.json(
            { error: "Failed to fetch celebrity" },
            { status: 500 }
        );
    }
}

// PUT update celebrity
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Parse dates if present
        const updateData = {
            ...body,
            birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        };

        const celebrity = await CelebrityModel.update(id, updateData);

        if (!celebrity) {
            return NextResponse.json(
                { error: "Celebrity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(celebrity);
    } catch (error) {
        console.error("Error updating celebrity:", error);
        return NextResponse.json(
            { error: "Failed to update celebrity" },
            { status: 500 }
        );
    }
}

// PATCH for toggling featured/published
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        let result = null;

        if (action === "toggleFeatured") {
            result = await CelebrityModel.toggleFeatured(id);
        } else if (action === "togglePublished") {
            result = await CelebrityModel.togglePublished(id);
        } else if (action === "incrementView") {
            await CelebrityModel.incrementViewCount(id);
            result = await CelebrityModel.findById(id);
        } else {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        if (!result) {
            return NextResponse.json(
                { error: "Celebrity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating celebrity:", error);
        return NextResponse.json(
            { error: "Failed to update celebrity" },
            { status: 500 }
        );
    }
}

// DELETE celebrity
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleted = await CelebrityModel.delete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Celebrity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting celebrity:", error);
        return NextResponse.json(
            { error: "Failed to delete celebrity" },
            { status: 500 }
        );
    }
}
