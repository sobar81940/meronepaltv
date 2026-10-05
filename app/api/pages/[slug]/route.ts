import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import PageModel from "@/models/Page";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const page = await PageModel.findBySlug(slug);

        if (!page) {
            return Response.json(
                { success: false, error: "Page not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: page });
    } catch (error) {
        console.error("Error fetching page:", error);
        return Response.json(
            { success: false, error: "Failed to fetch page" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const body = await request.json();

        const page = await PageModel.findBySlug(slug);
        if (!page) {
            return Response.json(
                { success: false, error: "Page not found" },
                { status: 404 }
            );
        }

        const updated = await PageModel.update(page._id.toString(), {
            title: body.title,
            slug: body.slug,
            content: body.content,
            metaTitle: body.metaTitle,
            metaDescription: body.metaDescription,
            published: body.published,
            order: body.order,
        });

        if (!updated) {
            return Response.json(
                { success: false, error: "Update failed" },
                { status: 500 }
            );
        }

        // Invalidate the public-facing page cache so changes show immediately
        revalidatePath(`/${updated.slug}`);
        revalidatePath("/");

        return Response.json({ success: true, data: updated }, { status: 200 });
    } catch (error) {
        console.error("Error updating page:", error);
        return Response.json(
            { success: false, error: "Failed to update page" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        const page = await PageModel.findBySlug(slug);
        if (!page) {
            return Response.json(
                { success: false, error: "Page not found" },
                { status: 404 }
            );
        }

        await PageModel.delete(page._id.toString());
        return Response.json({ success: true, message: "Page deleted" });
    } catch (error) {
        console.error("Error deleting page:", error);
        return Response.json(
            { success: false, error: "Failed to delete page" },
            { status: 500 }
        );
    }
}
