import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/admin")) {
        const token = request.cookies.get("admin_session")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const session = await verifySession(token);
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    if (pathname === "/login") {
        const token = request.cookies.get("admin_session")?.value;
        if (token) {
            const session = await verifySession(token);
            if (session) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/login"],
};
