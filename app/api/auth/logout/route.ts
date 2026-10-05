import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
    try {
        await clearSessionCookie();

        return Response.json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);
        return Response.json(
            { success: false, error: "Logout failed" },
            { status: 500 }
        );
    }
}
