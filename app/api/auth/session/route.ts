import { getSession } from "@/lib/auth";
import UserModel from "@/models/User";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return Response.json(
                { user: null },
                { status: 200 }
            );
        }

        // Fetch user from database to get profileImage
        const user = await UserModel.findById(session.id);

        return Response.json({
            user: {
                id: session.id,
                name: user?.name || session.name,
                email: user?.email || session.email,
                role: user?.role || session.role,
                profileImage: user?.profileImage,
                permissions: user?.permissions,
            }
        });
    } catch (error) {
        console.error("Error getting session:", error);
        return Response.json(
            { user: null, error: "Failed to get session" },
            { status: 500 }
        );
    }
}
