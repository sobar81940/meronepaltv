/**
 * Verification for the posts migration.
 *
 * Compares the SQL dump source against the migrated MongoDB collection and
 * reports data-quality signals. Read-only: never writes to Mongo, R2, the
 * dump, or backup files. Never touches the news-portal database.
 *
 * Usage: node scripts/migration/verify-posts.ts
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import { loadMigrationEnv, redactMongoUri } from "./env.ts";
import { parseDump } from "./sql-parser.ts";
import { normalizeImageBasename } from "./migrate-posts.ts";
import { projectRoot } from "./env.ts";

async function main() {
    const env = loadMigrationEnv();
    console.log("================================================");
    console.log("  Posts migration verification");
    console.log(`  MongoDB: ${redactMongoUri(env.MONGODB_URI)}`);
    console.log(`  Database: ${env.MONGO_DB_NAME}`);
    console.log("================================================\n");

    const root = projectRoot();
    const dumpPath = join(root, "backup", "mero_meronepaltv.sql");
    const uploadsDir = join(root, "backup", "uploads");

    // ---- Source side (SQL dump) ----
    const dump = parseDump(dumpPath);
    const sourceCount = dump.news.length;

    let srcMissingCategory = 0;
    let srcMissingAuthor = 0;
    let srcMissingImageFile = 0;
    let srcNoImageRef = 0;
    const srcTagRefsMissing = new Set<number>();

    for (const row of dump.news) {
        if (row.category_id == null || !dump.categoriesById.get(row.category_id)?.name) {
            srcMissingCategory++;
        }
        if (row.auther_id == null || !dump.adminsById.get(row.auther_id)?.name) {
            srcMissingAuthor++;
        }
        const name = normalizeImageBasename(row.image);
        if (!name) {
            srcNoImageRef++;
        } else if (!existsSync(join(uploadsDir, name))) {
            srcMissingImageFile++;
        }
        for (const tid of dump.tagsByNewsId.get(row.id) ?? []) {
            if (!dump.tagsById.get(tid)?.name) srcTagRefsMissing.add(tid);
        }
    }

    // ---- Destination side (MongoDB) ----
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    try {
        const posts = client.db(env.MONGO_DB_NAME).collection("posts");

        const migratedCount = await posts.countDocuments({ legacyId: { $exists: true } });
        const withoutImageUrl = await posts.countDocuments({
            legacyId: { $exists: true },
            $or: [{ imageUrl: { $exists: false } }, { imageUrl: null }, { imageUrl: "" }],
        });

        // Duplicate legacyIds (should be zero given the unique index).
        const dupes = await posts
            .aggregate([
                { $match: { legacyId: { $exists: true } } },
                { $group: { _id: "$legacyId", count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ])
            .toArray();

        // Which source legacyIds are not present in Mongo (migration gaps/failures).
        const migratedIds = new Set<number>(
            (await posts
                .find({ legacyId: { $exists: true } }, { projection: { legacyId: 1, _id: 0 } })
                .toArray()).map((d) => d.legacyId as number),
        );
        const notMigrated = dump.news.filter((n) => !migratedIds.has(n.id)).map((n) => n.id);

        // Missing categories/authors/tags among migrated docs.
        const migratedMissingCategory = await posts.countDocuments({
            legacyId: { $exists: true },
            $or: [{ category: { $exists: false } }, { category: null }, { category: "" }],
        });

        console.log("---- SOURCE (SQL dump: news) ----");
        console.log(`   source news count:          ${sourceCount}`);
        console.log(`   source missing category:    ${srcMissingCategory}`);
        console.log(`   source missing author:      ${srcMissingAuthor}`);
        console.log(`   source no image reference:  ${srcNoImageRef}`);
        console.log(`   source image file missing:  ${srcMissingImageFile}`);
        console.log(`   source tag refs unresolved: ${srcTagRefsMissing.size}`);

        console.log("\n---- DESTINATION (MongoDB meronepaltv.posts) ----");
        console.log(`   migrated posts count:       ${migratedCount}`);
        console.log(`   posts without imageUrl:     ${withoutImageUrl}`);
        console.log(`   posts missing category:     ${migratedMissingCategory}`);
        console.log(`   duplicate legacyIds:        ${dupes.length}`);
        if (dupes.length) {
            for (const d of dupes) console.log(`      legacyId ${d._id}: ${d.count} copies`);
        }

        console.log("\n---- RECONCILIATION ----");
        console.log(`   source vs migrated:         ${sourceCount} vs ${migratedCount}`);
        console.log(`   source rows not migrated:   ${notMigrated.length}`);
        if (notMigrated.length) {
            console.log(`      e.g. legacyIds: ${notMigrated.slice(0, 20).join(", ")}${notMigrated.length > 20 ? " ..." : ""}`);
        }

        const ok =
            migratedCount === sourceCount &&
            dupes.length === 0 &&
            notMigrated.length === 0;

        console.log("\n================================================");
        console.log(ok ? "✅ Verification PASSED" : "⚠️  Verification found gaps — review above.");
        console.log("================================================\n");

        process.exit(ok ? 0 : 1);
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error("\n❌ Verification failed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
