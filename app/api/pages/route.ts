import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import PageModel, { CreatePageInput } from "@/models/Page";

export async function GET() {
    try {
        const pages = await PageModel.findAll();
        return Response.json({ success: true, data: pages });
    } catch (error) {
        console.error("Error fetching pages:", error);
        return Response.json(
            { success: false, error: "Failed to fetch pages" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const existing = await PageModel.findBySlug(body.slug);
        if (existing) {
            return Response.json(
                { success: false, error: "A page with this slug already exists" },
                { status: 409 }
            );
        }

        const input: CreatePageInput = {
            title: body.title,
            slug: body.slug,
            content: body.content || "",
            metaTitle: body.metaTitle || body.title,
            metaDescription: body.metaDescription || "",
            published: body.published ?? true,
            order: body.order ?? 0,
        };

        if (!input.title || !input.slug) {
            return Response.json(
                { success: false, error: "Title and slug are required" },
                { status: 400 }
            );
        }

        const page = await PageModel.create(input);

        // Invalidate the public-facing page cache so new page shows immediately
        revalidatePath(`/${page.slug}`);
        revalidatePath("/");

        return Response.json({ success: true, data: page }, { status: 201 });
    } catch (error) {
        console.error("Error creating page:", error);
        return Response.json(
            { success: false, error: "Failed to create page" },
            { status: 500 }
        );
    }
}
