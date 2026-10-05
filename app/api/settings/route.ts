import { NextResponse } from "next/server";
import SettingsModel from "@/models/Settings";
import { withCache, cacheKeys, getCacheHeaders, invalidateCache } from "@/lib/cache";

// GET - Fetch settings with caching
export async function GET() {
    try {
        const settings = await withCache(
            cacheKeys.settings(),
            1800, // Cache for 30 minutes (settings don't change often)
            async () => SettingsModel.get()
        );
        
        return NextResponse.json(
            { success: true, data: settings },
            { headers: getCacheHeaders(1800) }
        );
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PUT - Update settings and invalidate cache
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        // Strip out fields that shouldn't be updated directly
        const { _id, updatedAt, ...updateData } = body;
        const settings = await SettingsModel.update(updateData);
        
        // Invalidate settings cache after update
        invalidateCache.settings();
        
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error("Failed to update settings:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
