import {
    verifyCredentials,
    createSession,
    setSessionCookie,
} from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json(
                { success: false, error: "Email and password are required" },
                { status: 400 }
            );
        }

        const result = await verifyCredentials(email, password);

        if (!result.valid || !result.user) {
            return Response.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const token = await createSession(
            result.user.id,
            result.user.email,
            result.user.name,
            result.user.role,
            result.user.permissions
        );
        await setSessionCookie(token);

        return Response.json({
            success: true,
            message: "Login successful",
            user: {
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                permissions: result.user.permissions,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return Response.json(
            { success: false, error: "Login failed" },
            { status: 500 }
        );
    }
}
