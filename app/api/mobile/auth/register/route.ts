import { NextRequest } from "next/server";
import UserModel from "@/models/User";
import { createMobileSession } from "@/lib/mobile";
import { jsonError, jsonOk } from "@/lib/mobile";

const NAME_REGEX = /^[a-zA-Z0-9 _\u0900-\u097F.-]{2,50}$/;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return jsonError("Name, email and password are required");
        }
        if (typeof name !== "string" || !NAME_REGEX.test(name.trim())) {
            return jsonError("Name must be 2-50 characters (letters, numbers, spaces, . -)");
        }
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonError("A valid email is required");
        }
        if (typeof password !== "string" || password.length < 6) {
            return jsonError("Password must be at least 6 characters");
        }

        const existing = await UserModel.findByEmail(email);
        if (existing) {
            return jsonError("An account with this email already exists", 409);
        }

        const user = await UserModel.create({
            name: name.trim(),
            email,
            password,
            role: "mobile",
        });

        const token = await createMobileSession({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
        });

        return jsonOk(
            {
                token,
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            { message: "Account created successfully" },
            201
        );
    } catch (error) {
        console.error("Mobile register error:", error);
        return jsonError("Registration failed", 500);
    }
}
