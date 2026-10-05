import { getSession } from "@/lib/auth";
import UserModel from "@/models/User";
import { NextRequest } from "next/server";

// GET current user profile
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await UserModel.findById(session.id);
        if (!user) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                profileImage: user.profileImage,
                postCount: user.postCount || 0,
                createdAt: user.createdAt,
            }
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return Response.json(
            { success: false, error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// UPDATE current user profile
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, currentPassword, newPassword, profileImage } = body;

        const user = await UserModel.findById(session.id);
        if (!user) {
            return Response.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return Response.json(
                    { success: false, error: "Current password is required" },
                    { status: 400 }
                );
            }

            const isValid = await UserModel.verifyPassword(user, currentPassword);
            if (!isValid) {
                return Response.json(
                    { success: false, error: "Current password is incorrect" },
                    { status: 400 }
                );
            }

            // Update password
            await UserModel.updatePassword(session.id, newPassword);
        }

        // Update other fields
        const updateData: { name?: string; email?: string; profileImage?: string } = {};
        if (name && name !== user.name) updateData.name = name;
        if (email && email !== user.email) {
            // Check if email is already taken
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser && existingUser._id.toString() !== session.id) {
                return Response.json(
                    { success: false, error: "Email is already in use" },
                    { status: 400 }
                );
            }
            updateData.email = email;
        }
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        if (Object.keys(updateData).length > 0) {
            await UserModel.update(session.id, updateData);
        }

        // Fetch updated user
        const updatedUser = await UserModel.findById(session.id);

        return Response.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: updatedUser?._id.toString(),
                name: updatedUser?.name,
                email: updatedUser?.email,
                role: updatedUser?.role,
                profileImage: updatedUser?.profileImage,
            }
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return Response.json(
            { success: false, error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
