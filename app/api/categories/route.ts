import CategoryModel from "@/models/Category";
import { NextRequest } from "next/server";
import { withCache, cacheKeys, getCacheHeaders, invalidateCache } from "@/lib/cache";

// GET all categories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nested = searchParams.get("nested") === "true";
        const parentId = searchParams.get("parent");

        // Return hierarchical structure with caching
        if (nested) {
            const categories = await withCache(
                cacheKeys.categoryNested(),
                600, // Cache for 10 minutes
                async () => {
                    const result = await CategoryModel.findWithChildren();
                    return result;
                }
            );
            return Response.json(
                { success: true, data: categories },
                { headers: getCacheHeaders(600) }
            );
        }

        // Filter by parent ID (no cache for filtered results)
        if (parentId) {
            const categories = await CategoryModel.findByParentId(parentId);
            return Response.json({ success: true, data: categories });
        }

        // Return flat list (cached)
        const categories = await withCache(
            cacheKeys.allCategories(),
            600, // Cache for 10 minutes
            async () => {
                // Seed defaults if empty
                const count = await CategoryModel.count();
                if (count === 0) {
                    await CategoryModel.seedDefaults();
                }
                return CategoryModel.findAll();
            }
        );
        
        return Response.json(
            { success: true, data: categories },
            { headers: getCacheHeaders(600) }
        );
    } catch (error) {
        console.error("Error fetching categories:", error);
        return Response.json(
            { success: false, error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// CREATE new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.name) {
            return Response.json(
                { success: false, error: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await CategoryModel.create({
            name: body.name,
            slug: body.slug || undefined,
            description: body.description,
            color: body.color,
            parentId: body.parentId || null,
        });

        // Invalidate cache after creating
        invalidateCache.categories();

        return Response.json(
            {
                success: true,
                data: category,
                message: "Category created successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating category:", error);
        return Response.json(
            { success: false, error: "Failed to create category" },
            { status: 500 }
        );
    }
}
