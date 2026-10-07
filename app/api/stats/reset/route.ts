import { getSession } from "@/lib/auth";
import PostModel from "@/models/Post";

export async function POST() {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await PostModel.resetEngagementStats();
        return Response.json({ success: true });
    } catch (error) {
        console.error("Failed to reset engagement stats:", error);
        return Response.json({ success: false, error: "Failed to reset engagement stats" }, { status: 500 });
    }
}
