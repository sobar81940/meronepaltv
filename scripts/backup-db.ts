/**
 * backup-db.ts
 * ============================================================================
 * Full backup of every MongoDB database on the configured server to local disk.
 *
 * Uses `mongodump` (MongoDB Database Tools) under the hood, one database at a
 * time, so each database gets its own folder, its own byte accounting, and a
 * per-collection integrity check afterwards.
 *
 * USAGE:
 *   bun run scripts/backup-db.ts                          # all user databases
 *   DB_BACKUP_DATABASES=news-portal bun run scripts/backup-db.ts
 *   DB_BACKUP_GZIP=false bun run scripts/backup-db.ts     # uncompressed .bson
 *
 * REQUIREMENTS:
 *   mongodump on PATH (brew install mongodb-database-tools)
 *
 * REQUIRED ENV (in .env.local, auto-loaded by bun):
 *   MONGODB_URI
 *
 * OPTIONAL ENV:
 *   DB_BACKUP_DIR         (default: backups/db)
 *   DB_BACKUP_NAME        backup folder name (default: YYYY-MM-DD_HHmmss)
 *   DB_BACKUP_DATABASES   comma-separated allow-list (default: all user DBs)
 *   DB_BACKUP_SYSTEM      "true" to also dump admin/config (default: false)
 *   DB_BACKUP_GZIP        "false" to skip gzip compression (default: true)
 *   DB_BACKUP_PARALLEL    collections dumped in parallel  (default: 4)
 *   DB_BACKUP_KEEP        keep only the N newest backups  (default: 0 = keep all)
 *
 * OUTPUT:
 *   backups/db/<name>/
 *     manifest.json       - databases, collections, doc counts, sizes
 *     dump/<database>/    - mongodump output (.bson[.gz] + .metadata.json[.gz])
 *
 *   Restore with: bun run scripts/restore-db.ts
 * ============================================================================
 */

import { spawn } from "child_process";
import { promises as fs, type Dirent } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

// ─── Configuration ──────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || "";

const BACKUP_ROOT = path.resolve(process.env.DB_BACKUP_DIR || "backups/db");
const BACKUP_NAME = process.env.DB_BACKUP_NAME || timestamp();
const BACKUP_DIR = path.join(BACKUP_ROOT, BACKUP_NAME);
const DUMP_DIR = path.join(BACKUP_DIR, "dump");
const MANIFEST_PATH = path.join(BACKUP_DIR, "manifest.json");

const ONLY_DATABASES = (process.env.DB_BACKUP_DATABASES || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
const INCLUDE_SYSTEM = process.env.DB_BACKUP_SYSTEM === "true";
const GZIP = process.env.DB_BACKUP_GZIP !== "false";
const PARALLEL = Math.max(1, parseInt(process.env.DB_BACKUP_PARALLEL || "4", 10) || 4);
const KEEP = Math.max(0, parseInt(process.env.DB_BACKUP_KEEP || "0", 10) || 0);

/** Never dumped: `local` is replica-set internal; admin/config need DB_BACKUP_SYSTEM. */
const SYSTEM_DATABASES = new Set(["admin", "config", "local"]);

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI must be set in .env.local");
    process.exit(1);
}

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function timestamp(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
}

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

/**
 * Strip the default-database path from the URI.
 * mongodump refuses `--db=x` when the URI already names a different database,
 * so a multi-database backup must connect without one.
 */
function uriWithoutDatabase(uri: string): string {
    return uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/?]+)\/[^?]*/, "$1/");
}

/** Recursively sum file sizes and count files under a directory. */
async function measureDir(dir: string): Promise<{ bytes: number; files: number }> {
    let bytes = 0;
    let files = 0;

    let entries: Dirent[];
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return { bytes, files };
    }

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await measureDir(entryPath);
            bytes += nested.bytes;
            files += nested.files;
        } else {
            const stat = await fs.stat(entryPath);
            bytes += stat.size;
            files++;
        }
    }

    return { bytes, files };
}

/** Collection names that actually landed on disk, derived from .bson filenames. */
async function dumpedCollections(dir: string): Promise<Set<string>> {
    const names = new Set<string>();
    let entries: string[];
    try {
        entries = await fs.readdir(dir);
    } catch {
        return names;
    }

    for (const entry of entries) {
        const match = entry.match(/^(.+)\.bson(\.gz)?$/);
        if (match) names.add(match[1]);
    }
    return names;
}
// ─── mongodump runner ───────────────────────────────────────────────────────

/** Run a MongoDB tool, forwarding its log lines (which go to stderr) indented. */
function runMongoTool(
    bin: string,
    args: string[],
    indent = "     "
): Promise<{ code: number; output: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        let buffered = "";

        const consume = (chunk: Buffer) => {
            const text = chunk.toString();
            output += text;
            buffered += text;

            const lines = buffered.split("\n");
            buffered = lines.pop() || "";
            for (const line of lines) {
                // Drop the leading ISO timestamp mongodump prefixes each line with
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
            if (buffered.trim()) console.log(`${indent}${buffered.trim()}`);
            resolve({ code: code ?? 1, output });
        });
    });
}

async function dumpDatabase(name: string): Promise<{ code: number; output: string }> {
    const args = [
        `--uri=${uriWithoutDatabase(MONGODB_URI)}`,
        `--db=${name}`,
        `--out=${DUMP_DIR}`,
        `--numParallelCollections=${PARALLEL}`,
    ];
    if (GZIP) args.push("--gzip");

    return runMongoTool("mongodump", args);
}

// ─── Server survey ──────────────────────────────────────────────────────────

interface ServerSurvey {
    serverVersion: string;
    databases: { name: string; sizeOnDisk: number; collections: CollectionInfo[]; documents: number }[];
}

/**
 * Read the list of databases and per-collection document counts up front.
 * These counts are the reference the post-dump verification compares against.
 */
async function surveyServer(): Promise<ServerSurvey> {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    try {
        const admin = client.db().admin();
        const { version } = await admin.serverInfo();
        const { databases } = await admin.listDatabases();

        const selected = databases
            .map((db) => ({ name: db.name, sizeOnDisk: db.sizeOnDisk || 0 }))
            .filter((db) => (INCLUDE_SYSTEM ? db.name !== "local" : !SYSTEM_DATABASES.has(db.name)))
            .filter((db) => ONLY_DATABASES.length === 0 || ONLY_DATABASES.includes(db.name))
            .sort((a, b) => a.name.localeCompare(b.name));

        const result: ServerSurvey["databases"] = [];

        for (const db of selected) {
            const handle = client.db(db.name);
            const collections = (await handle.listCollections({}, { nameOnly: true }).toArray())
                // Views hold no data of their own; mongodump stores them as metadata only
                .filter((info) => info.type !== "view")
                .map((info) => info.name)
                .sort((a, b) => a.localeCompare(b));

            const counted: CollectionInfo[] = [];
            for (const name of collections) {
                counted.push({ name, documents: await handle.collection(name).countDocuments() });
            }

            result.push({
                name: db.name,
                sizeOnDisk: db.sizeOnDisk,
                collections: counted,
                documents: counted.reduce((sum, c) => sum + c.documents, 0),
            });
        }

        return { serverVersion: version, databases: result };
    } finally {
        await client.close();
    }
}

// ─── Retention ──────────────────────────────────────────────────────────────

/** Delete all but the newest KEEP backup folders (KEEP = 0 disables pruning). */
async function pruneOldBackups(): Promise<string[]> {
    if (KEEP <= 0) return [];

    const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
    const backups = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse(); // timestamped names sort chronologically

    const removable = backups.slice(KEEP);
    for (const name of removable) {
        await fs.rm(path.join(BACKUP_ROOT, name), { recursive: true, force: true });
    }
    return removable;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const startTime = Date.now();

    console.log("");
    console.log("━━━ MONGODB BACKUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Server  : ${redactUri(MONGODB_URI)}`);
    console.log(`  Target  : ${BACKUP_DIR}`);
    console.log(`  Options : gzip=${GZIP} · parallel=${PARALLEL}${KEEP > 0 ? ` · keep=${KEEP}` : ""}`);
    if (ONLY_DATABASES.length > 0) console.log(`  Only    : ${ONLY_DATABASES.join(", ")}`);
    if (INCLUDE_SYSTEM) console.log(`  System  : including admin/config`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // 1) Survey the server so we know what a complete backup looks like
    console.log("  🔍  Surveying databases...");
    const survey = await surveyServer();

    if (survey.databases.length === 0) {
        console.log("  ℹ️   No databases matched — nothing to back up.");
        return;
    }

    const plannedCollections = survey.databases.reduce((sum, db) => sum + db.collections.length, 0);
    const plannedDocuments = survey.databases.reduce((sum, db) => sum + db.documents, 0);
    console.log(
        `  🔍  MongoDB ${survey.serverVersion} · ${survey.databases.length} database(s) · ` +
        `${plannedCollections} collection(s) · ${plannedDocuments.toLocaleString()} document(s)`
    );
    console.log("");

    await fs.mkdir(DUMP_DIR, { recursive: true });

    // 2) Dump each database, then verify every collection produced a .bson file
    const entries: DatabaseEntry[] = [];

    for (const [index, db] of survey.databases.entries()) {
        console.log(
            `  ⬇  [${index + 1}/${survey.databases.length}] ${db.name} ` +
            `(${db.collections.length} collections · ${db.documents.toLocaleString()} docs)`
        );

        const entry: DatabaseEntry = {
            name: db.name,
            collections: db.collections,
            documents: db.documents,
            sizeOnDisk: db.sizeOnDisk,
            backupBytes: 0,
            files: 0,
            status: "failed",
        };

        try {
            const { code, output } = await dumpDatabase(db.name);
            const dbDir = path.join(DUMP_DIR, db.name);
            const measured = await measureDir(dbDir);
            entry.backupBytes = measured.bytes;
            entry.files = measured.files;

            if (code !== 0) {
                entry.status = "failed";
                entry.error = `mongodump exited with code ${code}`;
            } else {
                const onDisk = await dumpedCollections(dbDir);
                const missing = db.collections.map((c) => c.name).filter((name) => !onDisk.has(name));
                if (missing.length > 0) {
                    entry.status = "incomplete";
                    entry.missingCollections = missing;
                    entry.error = `${missing.length} collection(s) missing from dump`;
                } else {
                    entry.status = "ok";
                }
            }

            if (entry.status !== "ok" && !entry.error) {
                entry.error = output.trim().split("\n").slice(-1)[0];
            }
        } catch (error) {
            entry.status = "failed";
            entry.error = error instanceof Error ? error.message : String(error);
            // A missing mongodump binary will fail identically for every database
            if (entry.error.includes("not found on PATH")) {
                console.error(`\n❌ ${entry.error}\n`);
                process.exit(1);
            }
        }

        const icon = entry.status === "ok" ? "✅" : entry.status === "incomplete" ? "⚠️" : "❌";
        console.log(
            `     ${icon} ${entry.status} · ${entry.files} file(s) · ${formatBytes(entry.backupBytes)}` +
            `${entry.error ? ` — ${entry.error}` : ""}`
        );
        console.log("");

        entries.push(entry);
    }

    // 3) Write manifest
    const totalBytes = entries.reduce((sum, e) => sum + e.backupBytes, 0);
    const manifest: Manifest = {
        tool: "backup-db.ts",
        backupDate: new Date().toISOString(),
        host: redactUri(MONGODB_URI),
        serverVersion: survey.serverVersion,
        gzip: GZIP,
        dumpDir: path.relative(BACKUP_DIR, DUMP_DIR),
        totalDatabases: entries.length,
        totalCollections: plannedCollections,
        totalDocuments: plannedDocuments,
        totalBytes,
        ok: entries.filter((e) => e.status === "ok").length,
        failed: entries.filter((e) => e.status !== "ok").length,
        databases: entries,
    };
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");

    // 4) Retention
    const pruned = await pruneOldBackups();

    // 5) Summary
    const elapsed = Date.now() - startTime;

    console.log("━━━ BACKUP COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Databases     : ${manifest.totalDatabases}`);
    console.log(`  Collections   : ${manifest.totalCollections}`);
    console.log(`  Documents     : ${manifest.totalDocuments.toLocaleString()}`);
    console.log(`  Backup size   : ${formatBytes(totalBytes)}${GZIP ? " (gzipped)" : ""}`);
    console.log(`  OK            : ${manifest.ok}`);
    console.log(`  Failed        : ${manifest.failed}`);

    if (manifest.failed > 0) {
        console.log("");
        console.log("  Problem databases:");
        for (const entry of entries.filter((e) => e.status !== "ok")) {
            console.log(`    ✖ ${entry.name} — ${entry.error || "unknown error"}`);
            for (const name of entry.missingCollections || []) {
                console.log(`        missing: ${name}`);
            }
        }
    }

    if (pruned.length > 0) {
        console.log("");
        console.log(`  Pruned older backups (keep=${KEEP}): ${pruned.join(", ")}`);
    }

    console.log(`  Duration      : ${formatDuration(elapsed)}`);
    console.log(`  Manifest      : ${MANIFEST_PATH}`);
    console.log(`  Restore with  : bun run scripts/restore-db.ts`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    if (manifest.failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("\n❌ Backup failed:", error);
    process.exit(1);
});
