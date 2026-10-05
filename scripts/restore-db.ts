/**
 * restore-db.ts
 * ============================================================================
 * Restore MongoDB databases from a local backup created by backup-db.ts.
 *
 * Defaults to a DRY RUN: it reports exactly what would be restored and exits
 * without touching the server. Pass DB_RESTORE_DRY_RUN=false to write.
 *
 * USAGE:
 *   bun run scripts/restore-db.ts                                   # dry run, newest backup
 *   DB_RESTORE_DRY_RUN=false bun run scripts/restore-db.ts           # actually restore
 *   DB_RESTORE_NAME=2026-08-17_084147 bun run scripts/restore-db.ts  # pick a backup
 *   DB_RESTORE_DATABASES=news-portal DB_RESTORE_DRY_RUN=false bun run scripts/restore-db.ts
 *
 * REQUIREMENTS:
 *   mongorestore on PATH (brew install mongodb-database-tools)
 *
 * REQUIRED ENV (in .env.local, auto-loaded by bun):
 *   MONGODB_URI               target server
 *
 * OPTIONAL ENV:
 *   DB_BACKUP_DIR             (default: backups/db)
 *   DB_RESTORE_NAME           backup folder to restore (default: newest)
 *   DB_RESTORE_DATABASES      comma-separated allow-list (default: all in backup)
 *   DB_RESTORE_TARGET_DB      rename a single restored database (requires exactly
 *                             one source database)
 *   DB_RESTORE_DRY_RUN        "false" to perform the restore  (default: true)
 *   DB_RESTORE_DROP           "true" to drop each collection before import
 *                             (default: false)
 *   DB_RESTORE_PARALLEL       collections restored in parallel (default: 4)
 * ============================================================================
 */

import { spawn } from "child_process";
import { promises as fs, type Dirent } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

// ─── Configuration ──────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || "";

const BACKUP_ROOT = path.resolve(process.env.DB_BACKUP_DIR || "backups/db");
const RESTORE_NAME = process.env.DB_RESTORE_NAME || "";
const ONLY_DATABASES = (process.env.DB_RESTORE_DATABASES || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
const TARGET_DB = process.env.DB_RESTORE_TARGET_DB || "";
const DRY_RUN = process.env.DB_RESTORE_DRY_RUN !== "false";
const DROP = process.env.DB_RESTORE_DROP === "true";
const PARALLEL = Math.max(1, parseInt(process.env.DB_RESTORE_PARALLEL || "4", 10) || 4);

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI must be set in .env.local");
    process.exit(1);
}

// ─── Types (mirrors the manifest written by backup-db.ts) ───────────────────

interface CollectionInfo {
    name: string;
    documents: number;
}

interface DatabaseEntry {
    name: string;
    collections: CollectionInfo[];
    documents: number;
    sizeOnDisk: number;
    backupBytes: number;
    files: number;
    status: "ok" | "incomplete" | "failed";
    missingCollections?: string[];
    error?: string;
}

interface Manifest {
    tool: string;
    backupDate: string;
    host: string;
    serverVersion: string;
    gzip: boolean;
    dumpDir: string;
    totalDatabases: number;
    totalCollections: number;
    totalDocuments: number;
    totalBytes: number;
    ok: number;
    failed: number;
    databases: DatabaseEntry[];
}

interface RestoreResult {
    name: string;
    targetName: string;
    status: "restored" | "skipped" | "failed";
    documentsBefore: number;
    documentsAfter: number;
    expectedDocuments: number;
    error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

/** Host:port only — never log or persist credentials from the URI. */
function redactUri(uri: string): string {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const withoutCredentials = withoutScheme.includes("@")
        ? withoutScheme.slice(withoutScheme.indexOf("@") + 1)
        : withoutScheme;
    return withoutCredentials.split(/[/?]/)[0] || "unknown";
}

/** mongorestore rejects --nsInclude when the URI names a default database. */
function uriWithoutDatabase(uri: string): string {
    return uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/?]+)\/[^?]*/, "$1/");
}

// ─── Backup discovery ───────────────────────────────────────────────────────

/** Newest backup folder name (timestamped names sort chronologically). */
async function findLatestBackup(): Promise<string> {
    let entries: Dirent[];
    try {
        entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
    } catch {
        throw new Error(`No backup directory at ${BACKUP_ROOT}. Run: bun run scripts/backup-db.ts`);
    }

    const backups = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse();

    if (backups.length === 0) {
        throw new Error(`No backups found in ${BACKUP_ROOT}. Run: bun run scripts/backup-db.ts`);
    }
    return backups[0];
}

/**
 * Load a backup's manifest, or synthesize one for a plain `mongodump` folder
 * (e.g. the pre-existing backups/db/<ts>/<database>/ layout) so older backups
 * created before this script are still restorable.
 */
async function loadBackup(dir: string): Promise<{ manifest: Manifest; dumpDir: string }> {
    const manifestPath = path.join(dir, "manifest.json");

    try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8")) as Manifest;
        return { manifest, dumpDir: path.join(dir, manifest.dumpDir || "dump") };
    } catch {
        // Legacy layout: database folders sit directly in the backup dir
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const databases = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

        if (databases.length === 0) {
            throw new Error(`No manifest.json and no database folders found in ${dir}`);
        }

        const gzip = await hasGzippedDump(path.join(dir, databases[0]));
        const synthesized: Manifest = {
            tool: "mongodump (no manifest)",
            backupDate: (await fs.stat(dir)).mtime.toISOString(),
            host: "unknown",
            serverVersion: "unknown",
            gzip,
            dumpDir: ".",
            totalDatabases: databases.length,
            totalCollections: 0,
            totalDocuments: 0,
            totalBytes: 0,
            ok: databases.length,
            failed: 0,
            databases: databases.map((name) => ({
                name,
                collections: [],
                documents: 0,
                sizeOnDisk: 0,
                backupBytes: 0,
                files: 0,
                status: "ok" as const,
            })),
        };
        return { manifest: synthesized, dumpDir: dir };
    }
}

/** Detect gzip by looking for .bson.gz files in a dumped database folder. */
async function hasGzippedDump(dbDir: string): Promise<boolean> {
    try {
        const files = await fs.readdir(dbDir);
        return files.some((file) => file.endsWith(".bson.gz"));
    } catch {
        return false;
    }
}

// ─── mongorestore runner ────────────────────────────────────────────────────

/** Run a MongoDB tool, forwarding its log lines (which go to stderr) indented. */
function runMongoTool(
    bin: string,
    args: string[],
    options: { indent?: string; quiet?: boolean } = {}
): Promise<{ code: number; output: string }> {
    const { indent = "     ", quiet = false } = options;

    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        let buffered = "";

        const consume = (chunk: Buffer) => {
            const text = chunk.toString();
            output += text;
            if (quiet) return;
            buffered += text;

            const lines = buffered.split("\n");
            buffered = lines.pop() || "";
            for (const line of lines) {
                const clean = line.replace(/^\d{4}-\d{2}-\d{2}T[\d:.+-]+\s*/, "").trim();
                if (clean) console.log(`${indent}${clean}`);
            }
        };

        child.stdout.on("data", consume);
        child.stderr.on("data", consume);

        child.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                reject(
                    new Error(
                        `\`${bin}\` not found on PATH. Install the MongoDB Database Tools:\n` +
                        `    brew install mongodb-database-tools`
                    )
                );
                return;
            }
            reject(error);
        });

        child.on("close", (code) => {
            if (!quiet && buffered.trim()) console.log(`${indent}${buffered.trim()}`);
            resolve({ code: code ?? 1, output });
        });
    });
}

async function restoreDatabase(
    sourceDir: string,
    sourceName: string,
    targetName: string,
    gzip: boolean,
    dryRun = false
): Promise<{ code: number; output: string }> {
    const args = [
        `--uri=${uriWithoutDatabase(MONGODB_URI)}`,
        `--dir=${sourceDir}`,
        `--nsInclude=${sourceName}.*`,
        `--numParallelCollections=${PARALLEL}`,
    ];
    // Rewrite the namespace when restoring into a differently named database
    if (targetName !== sourceName) args.push(`--nsFrom=${sourceName}.*`, `--nsTo=${targetName}.*`);
    if (gzip) args.push("--gzip");
    if (DROP) args.push("--drop");
    // --dryRun makes mongorestore read and validate the dump without writing;
    // -v is required for it to report which collections it found
    if (dryRun) args.push("--dryRun", "-v");

    return runMongoTool("mongorestore", args, { quiet: dryRun });
}

/** Collections mongorestore reported finding, parsed from its verbose dry-run log. */
function parseFoundCollections(output: string, sourceName: string): Set<string> {
    const found = new Set<string>();
    const pattern = new RegExp(`found collection ${escapeRegExp(sourceName)}\\.(\\S+) bson to restore`, "g");

    for (const match of output.matchAll(pattern)) {
        found.add(match[1]);
    }
    return found;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Verification ───────────────────────────────────────────────────────────

/** Total document count for a database, or 0 if it does not exist yet. */
async function countDocuments(client: MongoClient, dbName: string): Promise<number> {
    const db = client.db(dbName);
    const collections = (await db.listCollections({}, { nameOnly: true }).toArray()).filter(
        (info) => info.type !== "view"
    );

    let total = 0;
    for (const info of collections) {
        total += await db.collection(info.name).countDocuments();
    }
    return total;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const startTime = Date.now();

    const backupName = RESTORE_NAME || (await findLatestBackup());
    const backupDir = path.join(BACKUP_ROOT, backupName);
    const { manifest, dumpDir } = await loadBackup(backupDir);

    const selected = manifest.databases
        .filter((db) => ONLY_DATABASES.length === 0 || ONLY_DATABASES.includes(db.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    console.log("");
    console.log("━━━ MONGODB RESTORE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Target    : ${redactUri(MONGODB_URI)}`);
    console.log(`  Backup    : ${backupDir}`);
    console.log(`  Taken     : ${manifest.backupDate} (MongoDB ${manifest.serverVersion})`);
    console.log(`  Options   : gzip=${manifest.gzip} · drop=${DROP} · parallel=${PARALLEL}`);
    if (ONLY_DATABASES.length > 0) console.log(`  Only      : ${ONLY_DATABASES.join(", ")}`);
    if (TARGET_DB) console.log(`  Rename to : ${TARGET_DB}`);
    console.log(`  Mode      : ${DRY_RUN ? "DRY RUN (nothing will be written)" : "LIVE RESTORE"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    if (selected.length === 0) {
        console.log("  ℹ️   No databases in this backup matched — nothing to restore.");
        return;
    }

    if (TARGET_DB && selected.length !== 1) {
        console.error(
            `❌ DB_RESTORE_TARGET_DB renames a single database, but ${selected.length} were selected.\n` +
            `   Narrow the selection with DB_RESTORE_DATABASES=<one-database>.`
        );
        process.exit(1);
    }

    const incomplete = selected.filter((db) => db.status !== "ok");
    if (incomplete.length > 0) {
        console.log("  ⚠️   These databases were not backed up cleanly:");
        for (const db of incomplete) {
            console.log(`       ${db.name} — ${db.status}${db.error ? `: ${db.error}` : ""}`);
        }
        console.log("");
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const results: RestoreResult[] = [];

    try {
        for (const [index, db] of selected.entries()) {
            const targetName = TARGET_DB || db.name;
            const before = await countDocuments(client, targetName);

            console.log(
                `  ⬆  [${index + 1}/${selected.length}] ${db.name}` +
                `${targetName !== db.name ? ` → ${targetName}` : ""} ` +
                `(expects ${db.documents.toLocaleString()} docs · target currently has ${before.toLocaleString()})`
            );

            const result: RestoreResult = {
                name: db.name,
                targetName,
                status: "failed",
                documentsBefore: before,
                documentsAfter: before,
                expectedDocuments: db.documents,
            };

            if (DRY_RUN) {
                // mongorestore --dryRun reads and parses every BSON file without
                // writing, so this also proves the dump on disk is intact
                try {
                    const { code, output } = await restoreDatabase(
                        dumpDir,
                        db.name,
                        targetName,
                        manifest.gzip,
                        true
                    );
                    const found = parseFoundCollections(output, db.name);

                    if (code !== 0) {
                        result.status = "failed";
                        result.error = `dump validation failed (mongorestore exit ${code})`;
                    } else if (found.size === 0) {
                        result.status = "failed";
                        result.error = "mongorestore found no collections to restore in this dump";
                    } else {
                        result.status = "skipped";
                    }

                    const expected = db.collections.map((c) => c.name);
                    const missing = expected.filter((name) => !found.has(name));
                    const listed = [...found].sort((a, b) => a.localeCompare(b));

                    console.log(`     ⏭️  would restore ${found.size} collection(s): ${listed.join(", ") || "none"}`);
                    if (expected.length > 0) {
                        const counts = db.collections
                            .map((c) => `${c.name}=${c.documents.toLocaleString()}`)
                            .join(", ");
                        console.log(`     📋  manifest recorded: ${counts}`);
                    }
                    if (missing.length > 0) {
                        result.status = "failed";
                        result.error = `dump is missing ${missing.length} collection(s): ${missing.join(", ")}`;
                    }
                } catch (error) {
                    result.status = "failed";
                    result.error = error instanceof Error ? error.message : String(error);
                    if (result.error.includes("not found on PATH")) {
                        console.error(`\n❌ ${result.error}\n`);
                        process.exit(1);
                    }
                }

                if (result.status === "skipped" && !DROP && before > 0) {
                    console.log(
                        `     ⚠️  target already holds ${before.toLocaleString()} docs; ` +
                        `without DB_RESTORE_DROP=true documents are merged by _id`
                    );
                }
                if (result.error) {
                    console.log(`     ❌ ${result.error}`);
                }
                console.log("");
                results.push(result);
                continue;
            }

            try {
                const { code, output } = await restoreDatabase(dumpDir, db.name, targetName, manifest.gzip);
                result.documentsAfter = await countDocuments(client, targetName);

                if (code !== 0) {
                    result.status = "failed";
                    result.error = `mongorestore exited with code ${code}: ${output.trim().split("\n").slice(-1)[0]}`;
                } else if (db.documents > 0 && result.documentsAfter < db.documents) {
                    // Fewer docs than the backup recorded means the import dropped data
                    result.status = "failed";
                    result.error = `expected ≥ ${db.documents} docs, found ${result.documentsAfter}`;
                } else {
                    result.status = "restored";
                }
            } catch (error) {
                result.status = "failed";
                result.error = error instanceof Error ? error.message : String(error);
                if (result.error.includes("not found on PATH")) {
                    console.error(`\n❌ ${result.error}\n`);
                    process.exit(1);
                }
            }

            const icon = result.status === "restored" ? "✅" : "❌";
            console.log(
                `     ${icon} ${result.status} · ${result.documentsAfter.toLocaleString()} docs in ${targetName}` +
                `${result.error ? ` — ${result.error}` : ""}`
            );
            console.log("");

            results.push(result);
        }
    } finally {
        await client.close();
    }

    // Summary
    const elapsed = Date.now() - startTime;
    const restored = results.filter((r) => r.status === "restored").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    console.log("━━━ RESTORE COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Databases     : ${results.length}`);
    console.log(`  Restored      : ${restored}`);
    console.log(`  Skipped       : ${skipped}${DRY_RUN ? " (dry run)" : ""}`);
    console.log(`  Failed        : ${failed}`);
    console.log(`  Backup size   : ${formatBytes(manifest.totalBytes)}`);

    if (failed > 0) {
        console.log("");
        console.log("  Failed databases:");
        for (const result of results.filter((r) => r.status === "failed")) {
            console.log(`    ✖ ${result.name} — ${result.error || "unknown error"}`);
        }
    }

    console.log(`  Duration      : ${formatDuration(elapsed)}`);
    if (DRY_RUN) {
        console.log("");
        console.log("  Nothing was written. To perform the restore:");
        console.log(`    DB_RESTORE_DRY_RUN=false DB_RESTORE_NAME=${backupName} bun run scripts/restore-db.ts`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("\n❌ Restore failed:", error);
    process.exit(1);
});
