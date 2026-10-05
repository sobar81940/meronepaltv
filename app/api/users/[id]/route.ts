import UserModel, { UserPermissions } from "@/models/User";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// GET single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const user = await UserModel.findById(id);

        if (!user) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const { password, ...safeUser } = user;
        return Response.json({ success: true, data: safeUser });
    } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json(
            { success: false, error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// UPDATE user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Build update object
        const updateData: {
            name?: string;
            email?: string;
            role?: "admin" | "editor" | "demo";
            permissions?: UserPermissions;
        } = {};

        if (body.name) updateData.name = body.name;
        if (body.email) updateData.email = body.email;
        if (body.role) updateData.role = body.role;

        if (body.permissions) {
            updateData.permissions = {
                canCreatePosts: body.permissions.canCreatePosts ?? true,
                canManageGallery: body.permissions.canManageGallery ?? true,
                canManageCategories: body.permissions.canManageCategories ?? false,
                canManageSettings: body.permissions.canManageSettings ?? false,
                canManageUsers: body.permissions.canManageUsers ?? false,
                postLimit: body.permissions.postLimit,
            };
        }

        const user = await UserModel.update(id, updateData);

        if (!user) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const { password, ...safeUser } = user;
        return Response.json({
            success: true,
            data: safeUser,
            message: "User updated successfully",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return Response.json(
            { success: false, error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Prevent self-deletion
        if (session.id === id) {
            return Response.json(
                { success: false, error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        const deleted = await UserModel.delete(id);

        if (!deleted) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json(
            { success: false, error: "Failed to delete user" },
            { status: 500 }
        );
    }
}

// Reset password
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        if (!body.password) {
            return Response.json(
                { success: false, error: "Password is required" },
                { status: 400 }
            );
        }

        const updated = await UserModel.updatePassword(id, body.password);

        if (!updated) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        return Response.json(
            { success: false, error: "Failed to update password" },
            { status: 500 }
        );
    }
}
