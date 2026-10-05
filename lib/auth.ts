import { cookies } from "next/headers";
import { createSession, verifySession } from "@/lib/session";
import UserModel, { UserPermissions } from "@/models/User";

export { createSession, verifySession } from "@/lib/session";

export async function verifyCredentials(
    email: string,
    password: string
): Promise<{
    valid: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        permissions: UserPermissions;
        postCount: number;
    }
}> {
    // Ensure admin and demo users exist on first login attempt
    await UserModel.ensureAdminExists();
    await UserModel.ensureDemoExists();

    const user = await UserModel.findByEmail(email);
    if (!user) {
        return { valid: false };
    }

    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
        return { valid: false };
    }

    return {
        valid: true,
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            postCount: user.postCount || 0,
        },
    };
}

export async function getSession(): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: UserPermissions;
} | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) return null;
    return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
}
