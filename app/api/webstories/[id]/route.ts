import { NextRequest, NextResponse } from "next/server";
import WebStoryModel from "@/models/WebStory";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get a single web story by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const webStory = await WebStoryModel.findById(id);

        if (!webStory) {
            return NextResponse.json(
                { success: false, message: "Web story not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: webStory });
    } catch (error) {
        console.error("Error fetching web story:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch web story" },
            { status: 500 }
        );
    }
}

// PUT - Update a web story
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const webStory = await WebStoryModel.update(id, body);

        if (!webStory) {
            return NextResponse.json(
                { success: false, message: "Web story not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: webStory });
    } catch (error) {
        console.error("Error updating web story:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update web story" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a web story
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const success = await WebStoryModel.delete(id);

        if (!success) {
            return NextResponse.json(
                { success: false, message: "Web story not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Web story deleted" });
    } catch (error) {
        console.error("Error deleting web story:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete web story" },
            { status: 500 }
        );
    }
}
