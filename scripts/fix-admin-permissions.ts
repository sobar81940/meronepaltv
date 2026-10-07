/**
 * Script to fix admin user permissions
 * Run with: npx tsx scripts/fix-admin-permissions.ts
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join } from "path";

// Read .env.local file manually
function getEnvVar(name: string): string | undefined {
    try {
        const envPath = join(process.cwd(), ".env.local");
        const envContent = readFileSync(envPath, "utf-8");
        const lines = envContent.split("\n");
        for (const line of lines) {
            const [key, ...valueParts] = line.split("=");
            if (key?.trim() === name) {
                return valueParts.join("=").trim().replace(/^["']|["']$/g, "");
            }
        }
    } catch {
        return undefined;
    }
    return undefined;
}

const MONGODB_URI = getEnvVar("MONGODB_URI");
const DB_NAME = "MeroNepalTv";

async function fixAdminPermissions() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined in .env.local");
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        console.log("🔌 Connecting to MongoDB...");
        await client.connect();

        const db = client.db(DB_NAME);
        const usersCollection = db.collection("users");

        // Find the admin user
        const adminUser = await usersCollection.findOne({ email: "admin@news.com" });

        if (!adminUser) {
            console.log("❌ Admin user (admin@news.com) not found!");
            console.log("   Creating admin user with correct permissions...");

            // This will be handled by the app on next login attempt
            process.exit(1);
        }

        console.log("\n📋 Current admin user:");
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Current permissions:`, adminUser.permissions);

        // Update admin permissions to include all admin permissions
        const fullAdminPermissions = {
            canCreatePosts: true,
            canManageGallery: true,
            canManageCategories: true,
            canManageSettings: true,
            canManageUsers: true, // This is the key permission that was missing!
        };

        const result = await usersCollection.updateOne(
            { email: "admin@news.com" },
            {
                $set: {
                    role: "admin",
                    permissions: fullAdminPermissions,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.modifiedCount > 0) {
            console.log("\n✅ Admin permissions updated successfully!");
            console.log("   New permissions:", fullAdminPermissions);
            console.log("\n⚠️  IMPORTANT: You need to log out and log back in for changes to take effect.");
        } else {
            console.log("\n⚠️  No changes made (permissions might already be correct)");
        }

        // List all users
        console.log("\n📋 All users in database:");
        const allUsers = await usersCollection.find({}).toArray();
        allUsers.forEach((user, index) => {
            console.log(`\n   ${index + 1}. ${user.name} (${user.email})`);
            console.log(`      Role: ${user.role}`);
            console.log(`      canManageUsers: ${user.permissions?.canManageUsers || false}`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await client.close();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

fixAdminPermissions();
