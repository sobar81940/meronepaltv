import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const client = await clientPromise;
        const db = client.db("news-portal");
        const collection = db.collection("settings");

        // Count all settings documents
        const count = await collection.countDocuments({});
        
        if (count <= 1) {
            return NextResponse.json({ 
                success: true, 
                message: `Only ${count} settings document found. No cleanup needed.` 
            });
        }

        // Get all settings, sorted by updatedAt descending (newest first)
        const allSettings = await collection.find({}).sort({ updatedAt: -1 }).toArray();
        
        // Keep the newest one, delete the rest
        const [keep, ...toDelete] = allSettings;
        
        const deleteIds = toDelete.map(doc => doc._id);
        const result = await collection.deleteMany({ _id: { $in: deleteIds } });

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${result.deletedCount} duplicate settings document(s)`,
            kept: {
                _id: keep._id.toString(),
                updatedAt: keep.updatedAt,
                hasTrendingImages: keep.trending?.some((t: { imageUrl?: string }) => t.imageUrl) || false
            },
            deleted: deleteIds.map(id => id.toString())
        });
    } catch (error) {
        console.error("Failed to fix settings:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("news-portal");
        const collection = db.collection("settings");

        const count = await collection.countDocuments({});
        const allSettings = await collection.find({}).sort({ updatedAt: -1 }).toArray();

        return NextResponse.json({
            success: true,
            count,
            documents: allSettings.map(doc => ({
                _id: doc._id.toString(),
                updatedAt: doc.updatedAt,
                siteName: doc.siteName,
                trendingCount: doc.trending?.length || 0,
                trendingWithImages: doc.trending?.filter((t: { imageUrl?: string }) => t.imageUrl).length || 0
            }))
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
