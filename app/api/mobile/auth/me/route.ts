import { NextRequest } from "next/server";
import UserModel from "@/models/User";
import { getMobileSession, jsonError, jsonOk } from "@/lib/mobile";

export async function GET(request: NextRequest) {
    try {
        const session = await getMobileSession(request);
        if (!session) {
            return jsonError("Unauthorized", 401);
        }

        const user = await UserModel.findById(session.id);
        if (!user) {
            return jsonError("User not found", 404);
        }

        return jsonOk({
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                profileImage: user.profileImage || null,
                createdAt: user.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("Mobile profile error:", error);
        return jsonError("Failed to fetch profile", 500);
    }
}
