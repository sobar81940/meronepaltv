import { NextRequest } from "next/server";
import { migrateCloudinaryToSpaces } from "@/scripts/migrate-cloudinary-to-spaces";

export async function POST(request: NextRequest) {
    try {
        const { dryRun = true } = await request.json().catch(() => ({ dryRun: true }));
        
        console.log(`Starting migration (dryRun: ${dryRun})...`);
        
        const result = await migrateCloudinaryToSpaces(dryRun);
        
        return Response.json({
            success: true,
            message: dryRun 
                ? "Dry run complete. No changes were made." 
                : "Migration complete!",
            data: result,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return Response.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Migration failed" 
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return Response.json({
        success: true,
        message: "Cloudinary to Spaces Migration API",
        usage: {
            dryRun: "POST with { dryRun: true } to preview changes",
            migrate: "POST with { dryRun: false } to perform actual migration",
        },
    });
}
