import CategoryModel from "@/models/Category";
import PostModel from "@/models/Post";
import { withCache, getCacheHeaders } from "@/lib/cache";
import { jsonError } from "@/lib/mobile";

export const revalidate = 300;

// GET /api/mobile/categories
// Returns categories with published post counts
export async function GET() {
    try {
        const data = await withCache("mobile:categories", 300, async () => {
            const [categories, posts] = await Promise.all([
                CategoryModel.findAll(),
                PostModel.findPublished().catch(() => []),
            ]);

            const countByCategory = new Map<string, number>();
            posts.forEach((p) => {
                if (!p.category) return;
                countByCategory.set(p.category, (countByCategory.get(p.category) || 0) + 1);
            });

            return categories.map((c) => {
                const count =
                    countByCategory.get(c.name) ||
                    countByCategory.get(c.slug) ||
                    0;
                return {
                    _id: c._id.toString(),
                    name: c.name,
                    nameNe: c.nameNe || c.name,
                    nameEn: c.nameEn || c.name,
                    slug: c.slug,
                    color: c.color || "#3B82F6",
                    description: c.description || null,
                    postCount: count,
                    parentId: c.parentId ? c.parentId.toString() : null,
                };
            });
        });

        return Response.json({ success: true, data }, { headers: getCacheHeaders(300) });
    } catch (error) {
        console.error("Mobile categories API error:", error);
        return jsonError("Failed to fetch categories", 500);
    }
}
