import NewsletterModel from "@/models/Newsletter";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// GET all subscribers (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const activeOnly = searchParams.get("active") === "true";

        const result = await NewsletterModel.paginate(page, limit, activeOnly);

        return Response.json({
            success: true,
            data: result.subscribers,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: result.pages,
            },
        });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return Response.json(
            { success: false, error: "Failed to fetch subscribers" },
            { status: 500 }
        );
    }
}

// POST new subscription (public)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, source } = body;

        if (!email || !email.includes("@")) {
            return Response.json(
                { success: false, error: "Valid email is required" },
                { status: 400 }
            );
        }

        const subscriber = await NewsletterModel.subscribe({ email, name, source });

        return Response.json(
            {
                success: true,
                message: "Successfully subscribed to newsletter",
                data: subscriber,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error subscribing:", error);
        return Response.json(
            { success: false, error: "Failed to subscribe" },
            { status: 500 }
        );
    }
}

// DELETE unsubscribe by email (public with email param)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");
        const id = searchParams.get("id");

        // Admin deletion by ID
        if (id) {
            const session = await getSession();
            if (!session || session.role !== "admin") {
                return Response.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const deleted = await NewsletterModel.delete(id);
            if (!deleted) {
                return Response.json(
                    { success: false, error: "Subscriber not found" },
                    { status: 404 }
                );
            }

            return Response.json({
                success: true,
                message: "Subscriber deleted",
            });
        }

        // Public unsubscribe by email
        if (email) {
            const unsubscribed = await NewsletterModel.unsubscribe(email);
            if (!unsubscribed) {
                return Response.json(
                    { success: false, error: "Email not found" },
                    { status: 404 }
                );
            }

            return Response.json({
                success: true,
                message: "Successfully unsubscribed",
            });
        }

        return Response.json(
            { success: false, error: "Email or ID required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error unsubscribing:", error);
        return Response.json(
            { success: false, error: "Failed to unsubscribe" },
            { status: 500 }
        );
    }
}
