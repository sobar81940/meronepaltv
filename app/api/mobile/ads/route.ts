import { NextRequest } from "next/server";
import AdvertisementModel, { AdPosition } from "@/models/Advertisement";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError } from "@/lib/mobile";

const MOBILE_POSITIONS: AdPosition[] = [
    "home1",
    "home2",
    "home3",
    "between-posts",
    "header-banner",
    "footer-banner",
    "popup",
    "in-article",
];

// GET /api/mobile/ads?position=home1|home2|between-posts|...
// Or with no params: returns all active mobile placements grouped by position
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const position = searchParams.get("position") as AdPosition | null;

        const data = await withCache(`mobile:ads:${position || "all"}`, 300, async () => {
            const serializeAd = (ad: import("mongodb").WithId<import("@/models/Advertisement").Advertisement>) => ({
                id: ad._id.toString(),
                title: ad.title,
                imageUrl: ad.imageUrl,
                linkUrl: ad.linkUrl,
                position: ad.position,
                positions: ad.positions || null,
                priority: ad.priority || 0,
            });

            if (position) {
                const ads = await AdvertisementModel.findByPosition(position);
                return { position, ads: ads.map(serializeAd) };
            }

            const results: Record<string, unknown[]> = {};
            for (const pos of MOBILE_POSITIONS) {
                const ads = await AdvertisementModel.findByPosition(pos);
                if (ads.length > 0) {
                    results[pos] = ads.map(serializeAd);
                }
            }
            return { positions: results };
        });

        return Response.json({ success: true, data }, { headers: getCacheHeaders(300) });
    } catch (error) {
        console.error("Mobile ads API error:", error);
        return jsonError("Failed to fetch ads", 500);
    }
}
