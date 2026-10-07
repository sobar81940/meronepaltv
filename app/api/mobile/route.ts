import { jsonOk } from "@/lib/mobile";

const ENDPOINTS = [
    { method: "GET", path: "/api/mobile/home", description: "Home feed: headlines, latest, trending, sections, webstories, events, celebrities" },
    { method: "GET", path: "/api/mobile/posts?page=1&limit=10&category=&province=&tag=&search=&sort=latest|views", description: "Paginated published posts with filters" },
    { method: "GET", path: "/api/mobile/posts/:slug", description: "Post detail with related posts" },
    { method: "POST", path: "/api/mobile/posts/:slug/view", description: "Track post view (sends client IP)" },
    { method: "POST", path: "/api/mobile/posts/:slug/share", description: "Track post share (body: { location: { lat, lon } })" },
    { method: "GET", path: "/api/mobile/categories", description: "Categories with post counts" },
    { method: "GET", path: "/api/mobile/tags?limit=20&period=week|month|all", description: "Trending tags weighted by views" },
    { method: "GET", path: "/api/mobile/webstories", description: "Published web stories" },
    { method: "GET", path: "/api/mobile/webstories/:slug", description: "Web story detail with slides" },
    { method: "GET", path: "/api/mobile/rashifal", description: "Daily horoscope (12 rashis)" },
    { method: "GET", path: "/api/mobile/forex", description: "Nepal Rastra Bank forex rates" },
    { method: "GET", path: "/api/mobile/ads?position=home1", description: "Active ads by position" },
    { method: "GET", path: "/api/mobile/events?limit=10&status=&category=", description: "Published events" },
    { method: "POST", path: "/api/mobile/auth/register", description: "Register mobile user (name, email, password)" },
    { method: "POST", path: "/api/mobile/auth/login", description: "Login (email, password) -> { token, user }" },
    { method: "GET", path: "/api/mobile/auth/me", description: "Current user (Authorization: Bearer <token>)" },
];

// GET /api/mobile
// Endpoint index for mobile app developers
export async function GET() {
    return jsonOk({
        name: "MeroNepalTv Mobile API",
        baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com",
        auth: "Send Bearer token for /auth/me. Public endpoints do not require auth.",
        endpoints: ENDPOINTS,
    });
}
