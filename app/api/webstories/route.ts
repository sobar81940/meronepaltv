import { NextRequest, NextResponse } from "next/server";
import WebStoryModel from "@/models/WebStory";

// GET - List all web stories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const published = searchParams.get("published");
        const featured = searchParams.get("featured");
        const limit = searchParams.get("limit");
        const page = searchParams.get("page");

        if (page) {
            const result = await WebStoryModel.paginate(
                parseInt(page),
                limit ? parseInt(limit) : 12,
                published !== "false"
            );
            return NextResponse.json({ success: true, ...result });
        }

        if (featured === "true") {
            const stories = await WebStoryModel.findFeatured(limit ? parseInt(limit) : 10);
            return NextResponse.json({ success: true, data: stories });
        }

        const stories = await WebStoryModel.findAll(published !== "false");
        return NextResponse.json({ success: true, data: stories });
    } catch (error) {
        console.error("Error fetching web stories:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch web stories" },
            { status: 500 }
        );
    }
}

// POST - Create a new web story
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.title || !body.coverImage || !body.slides || body.slides.length === 0) {
            return NextResponse.json(
                { success: false, message: "Title, cover image, and at least one slide are required" },
                { status: 400 }
            );
        }

        const webStory = await WebStoryModel.create({
            title: body.title,
            slug: body.slug || "",
            coverImage: body.coverImage,
            slides: body.slides,
            category: body.category || "",
            author: body.author || "",
            published: body.published ?? false,
            featured: body.featured ?? false,
        });

        return NextResponse.json({ success: true, data: webStory }, { status: 201 });
    } catch (error) {
        console.error("Error creating web story:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create web story" },
            { status: 500 }
        );
    }
}
