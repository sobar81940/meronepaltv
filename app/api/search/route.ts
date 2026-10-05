import { NextRequest, NextResponse } from "next/server";
import PostModel from "@/models/Post";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("q") || "";

        if (!query.trim()) {
            return NextResponse.json({
                success: true,
                data: [],
                message: "No search query provided"
            });
        }

        // Check if this is a tag search (starts with #)
        const isTagSearch = query.startsWith("#");
        if (isTagSearch) {
            // Remove the # and search by tag
            const tagQuery = query.substring(1).trim();
            const posts = await PostModel.findByTag(tagQuery);

            return NextResponse.json({
                success: true,
                data: posts,
                total: posts.length,
                searchType: "tag"
            });
        }

        // Regular search using PostModel's search method
        const posts = await PostModel.search(query);

        return NextResponse.json({
            success: true,
            data: posts,
            total: posts.length,
            searchType: "general"
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { success: false, error: "Search failed" },
            { status: 500 }
        );
    }
}
