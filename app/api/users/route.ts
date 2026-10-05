import UserModel, { UserPermissions } from "@/models/User";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// GET all users (admin only)
export async function GET() {
    try {
        // Check admin permission
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const users = await UserModel.findAll();
        // Remove passwords from response
        const safeUsers = users.map(({ password, ...user }) => user);
        return Response.json({ success: true, data: safeUsers });
    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json(
            { success: false, error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// CREATE new user
export async function POST(request: NextRequest) {
    try {
        // Check admin permission
        const session = await getSession();
        if (!session || !session.permissions?.canManageUsers) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const body = await request.json();

        if (!body.email || !body.password || !body.name) {
            return Response.json(
                { success: false, error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = await UserModel.findByEmail(body.email);
        if (existing) {
            return Response.json(
                { success: false, error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Build permissions object
        const permissions: UserPermissions = {
            canCreatePosts: body.permissions?.canCreatePosts ?? true,
            canManageGallery: body.permissions?.canManageGallery ?? true,
            canManageCategories: body.permissions?.canManageCategories ?? false,
            canManageSettings: body.permissions?.canManageSettings ?? false,
            canManageUsers: body.permissions?.canManageUsers ?? false,
            postLimit: body.permissions?.postLimit,
        };

        const user = await UserModel.create({
            email: body.email,
            password: body.password,
            name: body.name,
            role: body.role || "editor",
            permissions,
        });

        // Don't return password
        const { password, ...safeUser } = user;

        return Response.json(
            {
                success: true,
                data: safeUser,
                message: "User created successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json(
            { success: false, error: "Failed to create user" },
            { status: 500 }
        );
    }
}
