import { NextRequest } from "next/server";
import UserModel from "@/models/User";
import { createMobileSession } from "@/lib/mobile";
import { jsonError, jsonOk } from "@/lib/mobile";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return jsonError("Email and password are required");
        }

        const user = await UserModel.findByEmail(email);
        if (!user) {
            return jsonError("Invalid credentials", 401);
        }

        const isValid = await UserModel.verifyPassword(user, password);
        if (!isValid) {
            return jsonError("Invalid credentials", 401);
        }

        const token = await createMobileSession({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
        });

        return jsonOk({
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                profileImage: user.profileImage || null,
            },
        });
    } catch (error) {
        console.error("Mobile login error:", error);
        return jsonError("Login failed", 500);
    }
}
