/**
 * restore-spaces.ts
 * ============================================================================
 * Restore a DigitalOcean Spaces bucket from a local backup created by
 * backup-spaces.ts.
 *
 * This script reads the manifest.json produced by backup-spaces.ts and uploads
 * every file back to the bucket at its original key (path).
 *
 * USAGE:
 *   bun run scripts/restore-spaces.ts            # restore from backups/spaces
 *   BACKUP_DIR=/path/to/backup bun run scripts/restore-spaces.ts
 *
 * REQUIRED ENV (in .env.local, auto-loaded by bun):
 *   SPACES_KEY, SPACES_SECRET
 *
 * OPTIONAL ENV:
 *   SPACES_BUCKET_NAME  (default: dunz0)
 *   SPACES_REGION       (default: sgp1)
 *   SPACES_ENDPOINT     (default: https://<region>.digitaloceanspaces.com)
 *   BACKUP_DIR          (default: backups/spaces)
 *   RESTORE_CONCURRENCY parallel uploads (default: 5)
 *   RESTORE_RETRIES     retries per upload      (default: 2)
 *   RESTORE_DRY_RUN     "true" to only report what would be uploaded
 *   RESTORE_FORCE       "true" to overwrite existing objects (default: false)
 * ============================================================================
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import path from "path";

// ─── Configuration ──────────────────────────────────────────────────────────

const SPACES_REGION = process.env.SPACES_REGION || "sgp1";
const SPACES_BUCKET = process.env.SPACES_BUCKET_NAME || "dunz0";
const SPACES_ENDPOINT = process.env.SPACES_ENDPOINT || `https://${SPACES_REGION}.digitaloceanspaces.com`;
const SPACES_KEY = process.env.SPACES_KEY || "";
const SPACES_SECRET = process.env.SPACES_SECRET || "";

const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || "backups/spaces");
const FILES_DIR = path.join(BACKUP_DIR, "files");
const MANIFEST_PATH = path.join(BACKUP_DIR, "manifest.json");
const CONCURRENCY = Math.max(1, parseInt(process.env.RESTORE_CONCURRENCY || "5", 10) || 5);
const RETRIES = Math.max(0, parseInt(process.env.RESTORE_RETRIES || "2", 10) || 0);
const DRY_RUN = process.env.RESTORE_DRY_RUN === "true";
const FORCE = process.env.RESTORE_FORCE === "true";

if (!SPACES_KEY || !SPACES_SECRET) {
    console.error("❌ SPACES_KEY and SPACES_SECRET must be set in .env.local");
    process.exit(1);
}

const s3 = new S3Client({
    endpoint: SPACES_ENDPOINT,
    region: SPACES_REGION,
    credentials: {
        accessKeyId: SPACES_KEY,
        secretAccessKey: SPACES_SECRET,
    },
    forcePathStyle: false,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface ManifestFileEntry {
    size: number;
    lastModified?: string;
    etag?: string;
    localPath: string;
    status: "downloaded" | "skipped" | "failed";
    error?: string;
}

interface Manifest {
    bucket: string;
    region: string;
    endpoint: string;
    backupDate: string;
    tool: string;
    totalFiles: number;
    totalBytes: number;
    downloaded: number;
    skipped: number;
    failed: number;
    files: Record<string, ManifestFileEntry>;
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

function getContentTypeFromKey(key: string): string {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    const mime: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        pdf: "application/pdf",
        json: "application/json",
        txt: "text/plain",
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
    };
    return mime[ext] || "application/octet-stream";
}

/** Check whether an object already exists in the bucket. */
async function objectExists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: SPACES_BUCKET, Key: key }));
        return true;
    } catch (error: any) {
        if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}

// ─── Upload worker ──────────────────────────────────────────────────────────

async function uploadObject(
    key: string,
    entry: ManifestFileEntry,
    onBytes: (n: number) => void
): Promise<{ status: "uploaded" | "skipped" | "failed"; error?: string }> {
    const localPath = path.join(BACKUP_DIR, entry.localPath);

    // Skip if the local file doesn't exist
    let stat;
    try {
        stat = await fs.stat(localPath);
    } catch {
        return { status: "failed", error: `Local file missing: ${entry.localPath}` };
    }

    if (!FORCE) {
        const exists = await objectExists(key);
        if (exists) {
            return { status: "skipped", error: "already exists" };
        }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            const contentType = getContentTypeFromKey(key);
            const stream = createReadStream(localPath);

            stream.on("data", (chunk: Buffer | string) => onBytes(chunk.length));

            await s3.send(
                new PutObjectCommand({
                    Bucket: SPACES_BUCKET,
                    Key: key,
                    Body: stream,
                    ContentType: contentType,
                    ACL: "public-read",
                    CacheControl: "max-age=31536000",
                })
            );

            return { status: "uploaded" };
        } catch (error) {
            lastError = error;
            if (attempt < RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    return { status: "failed", error: lastError instanceof Error ? lastError.message : String(lastError) };
}

// ─── Concurrent worker pool ─────────────────────────────────────────────────

async function mapWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>
): Promise<void> {
    let index = 0;
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (index < items.length) {
            const current = index++;
            try {
                await worker(items[current], current);
            } catch (error) {
                console.error(`  ✖  Unexpected worker error:`, error);
            }
        }
    });
    await Promise.all(runners);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const startTime = Date.now();

    console.log("");
    console.log("━━━ SPACES RESTORE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Bucket  : ${SPACES_BUCKET}  (${SPACES_REGION})`);
    console.log(`  Endpoint: ${SPACES_ENDPOINT}`);
    console.log(`  Source  : ${BACKUP_DIR}`);
    console.log(`  Concurr. : ${CONCURRENCY} · Retries: ${RETRIES}${DRY_RUN ? " · DRY RUN" : ""}${FORCE ? " · FORCE" : ""}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // 1) Load manifest
    let manifest: Manifest;
    try {
        manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf-8")) as Manifest;
    } catch (error) {
        console.error(`❌ Could not read manifest at ${MANIFEST_PATH}`);
        console.error(`   Run backup-spaces.ts first, or set BACKUP_DIR.`);
        console.error(`   ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }

    const entries = Object.entries(manifest.files).filter(([, e]) => e.status !== "failed");
    console.log(`  📦  Manifest: ${manifest.bucket}@${manifest.region} (backed up ${new Date(manifest.backupDate).toLocaleString()})`);
    console.log(`  📦  ${entries.length.toLocaleString()} files to restore (${formatBytes(manifest.totalBytes)} total)`);
    console.log("");

    if (entries.length === 0) {
        console.log("  ℹ️   No files to restore.");
        return;
    }

    // 2) Upload all files (concurrent)
    console.log(`  ⬆  ${DRY_RUN ? "Simulating uploads..." : "Uploading..."}`);
    let uploaded = 0;
    let skipped = 0;
    let failed = 0;
    let uploadedBytes = 0;
    let completed = 0;
    const failedEntries: { key: string; error?: string }[] = [];

    await mapWithConcurrency(entries, CONCURRENCY, async ([key, entry]) => {
        completed++;

        if (DRY_RUN) {
            const icon = entry.status === "failed" ? "❌" : "⏭️";
            console.log(`  ${icon} [${completed}/${entries.length}] ${key}  (${formatBytes(entry.size)})${DRY_RUN ? " — would upload" : ""}`);
            return;
        }

        const result = await uploadObject(key, entry, (n) => {
            uploadedBytes += n;
        });

        if (result.status === "uploaded") {
            uploaded++;
        } else if (result.status === "skipped") {
            skipped++;
        } else {
            failed++;
            failedEntries.push({ key, error: result.error });
        }

        const icon = result.status === "uploaded" ? "✅" : result.status === "skipped" ? "⏭️" : "❌";
        console.log(
            `  ${icon} [${completed}/${entries.length}] ${key}  (${formatBytes(entry.size)})${result.error ? ` — ${result.error}` : ""}`
        );
    });

    // 3) Summary
    const elapsed = Date.now() - startTime;
    const speed = uploadedBytes / Math.max(0.001, elapsed / 1000);

    console.log("");
    console.log("━━━ RESTORE COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Total files   : ${entries.length.toLocaleString()}`);
    console.log(`  Uploaded      : ${uploaded.toLocaleString()}`);
    console.log(`  Skipped (exist): ${skipped.toLocaleString()}`);
    console.log(`  Failed        : ${failed.toLocaleString()}`);
    if (failed > 0) {
        console.log("");
        console.log("  Failed keys:");
        for (const { key, error } of failedEntries.slice(0, 25)) {
            console.log(`    ✖ ${key} — ${error || "unknown error"}`);
        }
        if (failedEntries.length > 25) {
            console.log(`    … and ${failedEntries.length - 25} more`);
        }
    }
    console.log(`  Upload speed  : ${formatBytes(speed)}/s`);
    console.log(`  Duration      : ${formatDuration(elapsed)}`);
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
