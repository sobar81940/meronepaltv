import { NextRequest, NextResponse } from "next/server";
import EventModel from "@/models/Event";

// GET all events
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const category = searchParams.get("category");
        const featured = searchParams.get("featured");
        const published = searchParams.get("published");
        const limit = searchParams.get("limit");
        const skip = searchParams.get("skip");
        const upcoming = searchParams.get("upcoming");
        const query = searchParams.get("q") || searchParams.get("search");

        // If search query is present, use search method
        if (query) {
            const events = await EventModel.search(query, limit ? parseInt(limit) : 20);
            return NextResponse.json(events);
        }

        // If upcoming is specified, return upcoming events
        if (upcoming === "true") {
            const events = await EventModel.findUpcoming(limit ? parseInt(limit) : 10);
            return NextResponse.json(events);
        }

        const options: Record<string, unknown> = {};
        if (status) options.status = status;
        if (category) options.category = category;
        if (featured !== null) options.featured = featured === "true";
        if (published !== null) options.published = published === "true";
        if (limit) options.limit = parseInt(limit);
        if (skip) options.skip = parseInt(skip);

        const events = await EventModel.findAll(options);
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

// POST create new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.description || !body.startDate || !body.location) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Parse dates
        const eventData = {
            ...body,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        };

        const event = await EventModel.create(eventData);
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}
