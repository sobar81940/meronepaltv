import { MongoClient } from "mongodb";

/**
 * One-time migration for the Photo Gallery visibility fix.
 *
 * Background:
 *  - The gallery used to be polluted by auto-created records for every image
 *    uploaded anywhere on the site (post images, logos, nav graphics, ads).
 *    Those records carry the tag "auto-uploaded" (category "Post Images").
 *  - Genuine items uploaded through /admin/gallery predate the new
 *    isPublished / showOnHome flags and therefore have neither field set.
 *
 * This migration:
 *  1. Hides every auto-uploaded record (isPublished=false, showOnHome=false)
 *     so it can never leak into the public Photo Gallery. They are kept (not
 *     deleted) so the underlying R2 objects referenced by posts stay intact.
 *  2. Marks every remaining record (real admin-gallery uploads) as published
 *     and visible on home, so they keep showing after the filter change.
 *
 * Safe to run multiple times (idempotent).
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/MeroNepalTv";
const DB_NAME = "MeroNepalTv";
const COLLECTION = "gallery";

async function migrate() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const collection = client.db(DB_NAME).collection(COLLECTION);

        const total = await collection.countDocuments({});
        console.log(`📦 Gallery collection has ${total} total records.`);

        // 1) Hide auto-uploaded (non-gallery) records.
        const hidden = await collection.updateMany(
            { tags: "auto-uploaded" },
            { $set: { isPublished: false, showOnHome: false } }
        );
        console.log(`🙈 Hid ${hidden.modifiedCount} auto-uploaded (post/logo/nav) records.`);

        // 2) Publish genuine admin-gallery records that predate the flags.
        const published = await collection.updateMany(
            { tags: { $ne: "auto-uploaded" }, isPublished: { $exists: false } },
            { $set: { isPublished: true, showOnHome: true } }
        );
        console.log(`✅ Published ${published.modifiedCount} existing admin-gallery records.`);

        const publicCount = await collection.countDocuments({
            isPublished: true,
            tags: { $ne: "auto-uploaded" },
        });
        console.log(`👀 ${publicCount} records are now publicly visible in the gallery.`);
    } catch (error) {
        console.error("❌ Error migrating gallery visibility:", error);
        throw error;
    } finally {
        await client.close();
    }
}

migrate()
    .then(() => {
        console.log("✅ Gallery visibility migration completed.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    });
