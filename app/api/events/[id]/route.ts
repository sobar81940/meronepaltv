import { NextRequest, NextResponse } from "next/server";
import EventModel from "@/models/Event";

// GET single event
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if it's a slug or ObjectId
        let event;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            event = await EventModel.findById(id);
        } else {
            event = await EventModel.findBySlug(id);
        }

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        );
    }
}

// PUT update event
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Parse dates if provided
        const updateData = {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        const event = await EventModel.update(id, updateData);

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}

// DELETE event
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = await EventModel.delete(id);

        if (!success) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}

// PATCH for specific actions (toggle featured, published, update status)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, status } = body;

        let event;
        switch (action) {
            case "toggleFeatured":
                event = await EventModel.toggleFeatured(id);
                break;
            case "togglePublished":
                event = await EventModel.togglePublished(id);
                break;
            case "updateStatus":
                if (!status) {
                    return NextResponse.json(
                        { error: "Status is required" },
                        { status: 400 }
                    );
                }
                event = await EventModel.updateStatus(id, status);
                break;
            case "incrementView":
                await EventModel.incrementViewCount(id);
                event = await EventModel.findById(id);
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}
