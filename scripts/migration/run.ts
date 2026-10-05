/**
 * Entry point for the posts migration.
 *
 * Usage:
 *   node scripts/migration/run.ts --dry-run         (default; no writes)
 *   node scripts/migration/run.ts --live            (performs the migration)
 *   node scripts/migration/run.ts --live --limit=50 (migrate first 50 for a test)
 *
 * Safety:
 *   - defaults to dry-run; you must pass --live to write anything
 *   - targets the meronepaltv database only; never touches news-portal
 *   - never clears the posts collection
 */

import { MongoClient } from "mongodb";
import { loadMigrationEnv, printEnvSummary } from "./env.ts";
import { PostsMigrator, printStats } from "./migrate-posts.ts";

function parseArgs(argv: string[]) {
    const live = argv.includes("--live");
    const dryRun = argv.includes("--dry-run") || !live;
    const limitArg = argv.find((a) => a.startsWith("--limit="));
    const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
    return { dryRun, limit };
}

async function main() {
    const { dryRun, limit } = parseArgs(process.argv.slice(2));

    console.log("================================================");
    console.log("  Posts migration: MySQL `news` -> MongoDB meronepaltv.posts");
    console.log(`  Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
    if (limit) console.log(`  Limit: first ${limit} rows`);
    console.log("================================================\n");

    const env = loadMigrationEnv();
    printEnvSummary(env);

    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();

    try {
        const db = client.db(env.MONGO_DB_NAME); // meronepaltv — fixed, never news-portal
        const migrator = new PostsMigrator({ dryRun, env, db, limit });

        console.log(`\nSQL dump:    ${migrator.sqlDumpPath}`);
        console.log(`Uploads dir: ${migrator.localUploadsDir}\n`);

        // Dry-run also validates R2 connectivity (no object is written).
        const r2 = (migrator as unknown as { r2: { checkConnection: () => Promise<void> } }).r2;
        try {
            await r2.checkConnection();
            console.log("R2 connectivity: OK\n");
        } catch (e) {
            console.warn(`R2 connectivity check warning: ${e instanceof Error ? e.message : String(e)}\n`);
        }

        const stats = await migrator.run();
        printStats(stats, dryRun);

        if (dryRun) {
            console.log("Dry run complete. No data was written to MongoDB or R2.");
            console.log("To execute the real migration, run:");
            console.log("   npm run migrate:posts:live");
        } else {
            console.log("Live migration complete.");
            console.log("Verify with:  npm run verify:posts");
        }
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error("\n❌ Migration run failed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
