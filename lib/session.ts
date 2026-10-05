import { SignJWT, jwtVerify } from "jose";
import { UserPermissions } from "@/models/User";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface SessionData {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: UserPermissions;
}

export async function createSession(
    id: string,
    email: string,
    name: string,
    role: string,
    permissions: UserPermissions
): Promise<string> {
    const token = await new SignJWT({ id, email, name, role, permissions })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(SECRET_KEY);

    return token;
}

export async function verifySession(
    token: string
): Promise<SessionData | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as SessionData;
    } catch {
        return null;
    }
}
