import UserModel from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.permissions?.canCreatePosts) {
            return Response.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const users = await UserModel.findAll();
        const authors = users.map(u => ({
            _id: u._id.toString(),
            name: u.name,
            email: u.email
        }));

        return Response.json({ success: true, data: authors });
    } catch (error) {
        console.error("Error fetching authors:", error);
        return Response.json({ success: false, error: "Failed to fetch authors" }, { status: 500 });
    }
}
