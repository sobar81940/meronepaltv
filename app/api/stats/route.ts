import PostModel from "@/models/Post";

export async function GET() {
    try {
        const stats = await PostModel.getStats();
        return Response.json(
            { success: true, data: stats },
            { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return Response.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
