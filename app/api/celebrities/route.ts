import { NextRequest, NextResponse } from "next/server";
import CelebrityModel from "@/models/Celebrity";

// GET all celebrities
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get("category");
        const featured = searchParams.get("featured");
        const published = searchParams.get("published");
        const limit = searchParams.get("limit");
        const skip = searchParams.get("skip");
        const query = searchParams.get("q") || searchParams.get("search");

        // If search query is present, use search method
        if (query) {
            const celebrities = await CelebrityModel.search(query, limit ? parseInt(limit) : 20);
            return NextResponse.json(celebrities);
        }

        const options: Record<string, unknown> = {};
        if (category) options.category = category;
        if (featured !== null) options.featured = featured === "true";
        if (published !== null) options.published = published === "true";
        if (limit) options.limit = parseInt(limit);
        if (skip) options.skip = parseInt(skip);

        const celebrities = await CelebrityModel.findAll(options);
        return NextResponse.json(celebrities);
    } catch (error) {
        console.error("Error fetching celebrities:", error);
        return NextResponse.json(
            { error: "Failed to fetch celebrities" },
            { status: 500 }
        );
    }
}

// POST create new celebrity
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.title || !body.bio || !body.imageUrl) {
            return NextResponse.json(
                { error: "Missing required fields: name, title, bio, imageUrl" },
                { status: 400 }
            );
        }

        // Parse dates if present
        const celebrityData = {
            ...body,
            birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        };

        const celebrity = await CelebrityModel.create(celebrityData);
        return NextResponse.json(celebrity, { status: 201 });
    } catch (error) {
        console.error("Error creating celebrity:", error);
        return NextResponse.json(
            { error: "Failed to create celebrity" },
            { status: 500 }
        );
    }
}
