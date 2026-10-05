import { ObjectId, WithId } from "mongodb";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { Post } from "@/lib/types";
import { UserPermissions } from "@/models/User";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface MobileSessionData {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: UserPermissions;
}

const MOBILE_TOKEN_TTL = "365d";

// Sign a token for mobile app users
export async function createMobileSession(data: MobileSessionData): Promise<string> {
    return new SignJWT({ ...data })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(MOBILE_TOKEN_TTL)
        .sign(SECRET_KEY);
}

// Verify a mobile token from the Authorization header (Bearer <token>)
export async function getMobileSession(
    request: NextRequest
): Promise<MobileSessionData | null> {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;

    try {
        const { payload } = await jwtVerify(header.slice(7), SECRET_KEY);
        return payload as unknown as MobileSessionData;
    } catch {
        return null;
    }
}

// Get client IP for view/share tracking
export function getClientIp(request: NextRequest): string | undefined {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
    return request.headers.get("cf-connecting-ip") || undefined;
}

// Convert ObjectId/Date values to JSON-safe strings
export function toISOString(date: Date | string | number | null | undefined): string {
    if (!date) return new Date().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === "string") return date;
    return new Date(date).toISOString();
}

export function serializeId<T extends { _id?: ObjectId }>(doc: T): Omit<T, "_id"> & { _id: string } {
    const { _id, ...rest } = doc;
    return { ...rest, _id: _id?.toString() || "" } as Omit<T, "_id"> & { _id: string };
}

export function serializePostList(
    posts: WithId<Post>[],
    options?: { includeContent?: boolean; includeBlocks?: boolean }
): unknown[] {
    return posts.map((p) => {
        const rest = omitTrackingFields(p);
        const serialized: Record<string, unknown> = {
            ...rest,
            _id: p._id.toString(),
            createdAt: toISOString(p.createdAt),
            updatedAt: toISOString(p.updatedAt),
        };

        if (!options?.includeContent) {
            delete serialized.content;
        }
        if (!options?.includeBlocks) {
            delete serialized.contentBlocks;
        }
        // Never expose IP tracking data to mobile clients
        return serialized;
    });
}

export function serializePostDetail(post: WithId<Post>): unknown {
    return {
        ...omitTrackingFields(post),
        _id: post._id.toString(),
        createdAt: toISOString(post.createdAt),
        updatedAt: toISOString(post.updatedAt),
    };
}

function omitTrackingFields<T extends { sharedIPs?: string[]; visitorIPs?: string[] }>(doc: T): Omit<T, "sharedIPs" | "visitorIPs"> {
    const rest = { ...doc } as Omit<T, "sharedIPs" | "visitorIPs">;
    delete (rest as Record<string, unknown>)["sharedIPs"];
    delete (rest as Record<string, unknown>)["visitorIPs"];
    return rest;
}

export function jsonError(message: string, status: number = 400) {
    return Response.json({ success: false, error: message }, { status });
}

export function jsonOk(data: unknown, extra: Record<string, unknown> = {}, status: number = 200) {
    return Response.json({ success: true, data, ...extra }, { status });
}
