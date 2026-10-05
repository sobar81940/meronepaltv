import { getSession } from "@/lib/auth";
import UserModel from "@/models/User";
import { NextRequest } from "next/server";

// Debug endpoint to check current user status
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return Response.json({
                success: false,
                error: "No session found - not logged in"
            });
        }

        // Find user in database
        const user = await UserModel.findById(session.id);

        if (!user) {
            return Response.json({
                success: false,
                error: "User not found in database",
                session: {
                    id: session.id,
                    email: session.email,
                    role: session.role
                }
            });
        }

        // Check canCreatePost
        const canCreate = await UserModel.canCreatePost(session.id);

        return Response.json({
            success: true,
            session: {
                id: session.id,
                email: session.email,
                name: session.name,
                role: session.role,
            },
            userFromDB: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                postCount: user.postCount
            },
            canCreatePost: canCreate
        });
    } catch (error) {
        console.error("Debug check-user error:", error);
        return Response.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
