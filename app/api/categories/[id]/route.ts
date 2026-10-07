import CategoryModel from "@/models/Category";
import { NextRequest } from "next/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single category
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            return Response.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            );
        }

        return Response.json({ success: true, data: category });
    } catch (error) {
        console.error("Error fetching category:", error);
        return Response.json(
            { success: false, error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

// UPDATE category
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!body.name && !body.nameNe && !body.nameEn) {
            return Response.json(
                { success: false, error: "At least one category name is required" },
                { status: 400 }
            );
        }

        const category = await CategoryModel.update(id, body);

        if (!category) {
            return Response.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: category,
            message: "Category updated successfully",
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return Response.json(
            { success: false, error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE category
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const deleted = await CategoryModel.delete(id);

        if (!deleted) {
            return Response.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return Response.json(
            { success: false, error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
