/**
 * backup-spaces.ts
 * ============================================================================
 * Full backup of a DigitalOcean Spaces bucket to local disk.
 *
 * This script downloads EVERY object in the bucket (mirroring the folder
 * structure) so you have a local, restorable copy of all images/files.
 *
 * USAGE:
 *   bun run scripts/backup-spaces.ts
 *
 * REQUIRED ENV (in .env.local, auto-loaded by bun):
 *   SPACES_KEY, SPACES_SECRET
 *
 * OPTIONAL ENV:
 *   SPACES_BUCKET_NAME  (default: dunz0)
 *   SPACES_REGION       (default: sgp1)
 *   SPACES_ENDPOINT     (default: https://<region>.digitaloceanspaces.com)
 *   BACKUP_DIR          (default: backups/spaces)
 *   BACKUP_CONCURRENCY  parallel downloads (default: 5)
 *   BACKUP_RETRIES      retries per object     (default: 2)
 *   BACKUP_PREFIX       only backup keys under this prefix (e.g. news-portal)
 *   BACKUP_FORCE        "true" to re-download files that already match by size
 *
 * OUTPUT:
 *   backups/spaces/
 *     files/            - exact mirror of bucket contents
 *     manifest.json     - machine-readable manifest used by restore-spaces.ts
 * ============================================================================
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
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
const CONCURRENCY = Math.max(1, parseInt(process.env.BACKUP_CONCURRENCY || "5", 10) || 5);
const RETRIES = Math.max(0, parseInt(process.env.BACKUP_RETRIES || "2", 10) || 0);
const PREFIX = process.env.BACKUP_PREFIX || "";
const FORCE = process.env.BACKUP_FORCE === "true";

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

interface ListedObject {
    Key: string;
    Size: number;
    LastModified?: Date;
    ETag?: string;
}

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

/** Normalize the S3 response body into a writeable stream (works with Node & Web streams / Blob). */
async function streamBodyToFile(body: unknown, writeStream: NodeJS.WritableStream): Promise<void> {
    if (!body) {
        writeStream.end();
        return;
    }
    const nodeStream = body as NodeJS.ReadableStream;
    if (typeof (nodeStream as any).pipe === "function") {
        await pipeline(nodeStream, writeStream);
    } else {
        const webStream = body as import("stream/web").ReadableStream;
        if (typeof (webStream as any).getReader === "function") {
            await pipeline(Readable.fromWeb(webStream as any), writeStream);
        } else {
            const blob = body as Blob;
            if (typeof (blob as any).arrayBuffer === "function") {
                const buf = Buffer.from(await blob.arrayBuffer());
                writeStream.end(buf);
            } else {
                writeStream.end(Buffer.from(body as Uint8Array));
            }
        }
    }
}

// ─── Listing ────────────────────────────────────────────────────────────────

async function listAllObjects(): Promise<ListedObject[]> {
    const objects: ListedObject[] = [];
    let token: string | undefined;

    do {
        const command = new ListObjectsV2Command({
            Bucket: SPACES_BUCKET,
            ContinuationToken: token,
            ...(PREFIX ? { Prefix: PREFIX } : {}),
        });
        const response = await s3.send(command);
        objects.push(
            ...(response.Contents || [])
                // Skip directory-marker keys (e.g. "folder/") which are zero-byte
                // placeholders, not real files — they cannot be restored as files.
                .filter((obj) => {
                    const key = obj.Key || "";
                    return key.length > 0 && !key.endsWith("/");
                })
                .map((obj) => ({
                    Key: obj.Key || "",
                    Size: obj.Size || 0,
                    LastModified: obj.LastModified,
                    ETag: obj.ETag,
                }))
        );
        token = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (token);

    return objects;
}

// ─── Download worker ────────────────────────────────────────────────────────

async function downloadObject(
    obj: ListedObject,
    onBytes: (n: number) => void
): Promise<ManifestFileEntry> {
    const key = obj.Key;
    const localPath = path.join(FILES_DIR, key);
    const entry: ManifestFileEntry = {
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
        etag: obj.ETag,
        localPath: path.relative(BACKUP_DIR, localPath),
        status: "failed",
    };

    // Resume: skip if an existing local file already matches the remote size
    if (!FORCE) {
        try {
            const stat = await fs.stat(localPath);
            if (stat.size === obj.Size) {
                entry.status = "skipped";
                return entry;
            }
        } catch {
            // file doesn't exist yet — continue
        }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            await fs.mkdir(path.dirname(localPath), { recursive: true });

            const command = new GetObjectCommand({ Bucket: SPACES_BUCKET, Key: key });
            const response = await s3.send(command);
            const writeStream = createWriteStream(localPath, { flags: "w" });

            // Track bytes for progress display
            const body = response.Body as Readable;
            if (body && typeof (body as any).on === "function") {
                body.on("data", (chunk: Buffer | string) => onBytes(chunk.length));
            }

            await streamBodyToFile(response.Body as Readable | ReadableStream | Blob | undefined, writeStream);

            // Verify the downloaded size matches what the listing reported
            const stat = await fs.stat(localPath);
            if (stat.size !== obj.Size) {
                throw new Error(`Size mismatch: expected ${obj.Size} bytes, got ${stat.size}`);
            }

            entry.status = "downloaded";
            return entry;
        } catch (error) {
            lastError = error;
            // Remove partial file so a later run re-downloads it
            try {
                await fs.rm(localPath, { force: true });
            } catch {
                // ignore cleanup errors
            }
            if (attempt < RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    entry.status = "failed";
    entry.error = lastError instanceof Error ? lastError.message : String(lastError);
    return entry;
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

// ─── Progress rendering (single status block below the log output) ─────────

interface ProgressState {
    completed: number;
    completedBytes: number;
    downloaded: number;
    skipped: number;
    failed: number;
    active: Map<string, { done: number; total: number; start: number }>;
}

let lastRender = 0;

function renderProgress(state: ProgressState, startTime: number, totalFiles: number, totalBytes: number): void {
    const now = Date.now();
    if (now - lastRender < 150) return;
    lastRender = now;

    const elapsedSec = (now - startTime) / 1000;
    const overallSpeed = elapsedSec > 0 ? state.completedBytes / elapsedSec : 0;
    const percent = totalBytes > 0 ? ((state.completedBytes / totalBytes) * 100).toFixed(1) : "100.0";

    const activeLines = [...state.active.entries()]
        .slice(0, CONCURRENCY)
        .map(([key, p]) => {
            const pct = p.total > 0 ? ((p.done / p.total) * 100).toFixed(0) : "100";
            return `      ⬇  ${key}  (${pct}%)`;
        })
        .join("\n");

    const text = [
        `  ▶  ${state.completed}/${totalFiles} files · ${formatBytes(state.completedBytes)} / ${formatBytes(totalBytes)} (${percent}%) · ${formatBytes(overallSpeed)}/s`,
        ...(activeLines ? [activeLines] : []),
    ].join("\n");

    process.stdout.write(`\r\x1b[J${text}\n`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const startTime = Date.now();

    console.log("");
    console.log("━━━ SPACES BACKUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Bucket  : ${SPACES_BUCKET}  (${SPACES_REGION})`);
    console.log(`  Endpoint: ${SPACES_ENDPOINT}`);
    console.log(`  Target  : ${BACKUP_DIR}`);
    console.log(`  Concurr. : ${CONCURRENCY} · Retries: ${RETRIES}${PREFIX ? ` · Prefix: ${PREFIX}` : ""}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // Create output directories
    await fs.mkdir(FILES_DIR, { recursive: true });

    // 1) List all objects (paginated)
    console.log("  📦  Listing objects in bucket...");
    const objects = (await listAllObjects()).sort((a, b) => a.Key.localeCompare(b.Key));
    if (objects.length === 0) {
        console.log("  ℹ️   No objects found in the bucket.");
        return;
    }

    const totalBytes = objects.reduce((sum, o) => sum + o.Size, 0);
    console.log(`  📦  Found ${objects.length.toLocaleString()} objects (${formatBytes(totalBytes)} total)`);
    console.log("");

    // 2) Download all objects (concurrent, resumable)
    console.log("  ⬇  Downloading...");
    const state: ProgressState = {
        completed: 0,
        completedBytes: 0,
        downloaded: 0,
        skipped: 0,
        failed: 0,
        active: new Map(),
    };

    const manifestFiles: Manifest["files"] = {};

    const renderTimer = setInterval(() => renderProgress(state, startTime, objects.length, totalBytes), 200);

    await mapWithConcurrency(objects, CONCURRENCY, async (obj) => {
        state.active.set(obj.Key, { done: 0, total: obj.Size, start: Date.now() });

        const entry = await downloadObject(obj, (n) => {
            const active = state.active.get(obj.Key);
            if (active) active.done += n;
            state.completedBytes += n;
        });

        state.active.delete(obj.Key);
        state.completed++;

        if (entry.status === "downloaded") {
            state.downloaded++;
        } else if (entry.status === "skipped") {
            state.skipped++;
        } else {
            state.failed++;
        }

        manifestFiles[obj.Key] = entry;

        // Stop the ticking renderer for the final line, then print the completion log line
        if (state.completed >= objects.length) {
            clearInterval(renderTimer);
        }

        const icon = entry.status === "downloaded" ? "✅" : entry.status === "skipped" ? "⏭️" : "❌";
        process.stdout.write("\r\x1b[J");
        console.log(`  ${icon} [${state.completed}/${objects.length}] ${obj.Key}  (${formatBytes(obj.Size)})${entry.error ? ` — ${entry.error}` : ""}`);
    });
    clearInterval(renderTimer);
    process.stdout.write("\r\x1b[J");

    // 3) Write manifest
    const manifest: Manifest = {
        bucket: SPACES_BUCKET,
        region: SPACES_REGION,
        endpoint: SPACES_ENDPOINT,
        backupDate: new Date().toISOString(),
        tool: "backup-spaces.ts",
        totalFiles: objects.length,
        totalBytes,
        downloaded: state.downloaded,
        skipped: state.skipped,
        failed: state.failed,
        files: manifestFiles,
    };
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");

    // 4) Summary
    const elapsed = Date.now() - startTime;
    const speed = state.completedBytes / Math.max(0.001, elapsed / 1000);

    console.log("");
    console.log("━━━ BACKUP COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Total objects : ${objects.length.toLocaleString()}`);
    console.log(`  Total size    : ${formatBytes(totalBytes)}`);
    console.log(`  Downloaded    : ${state.downloaded.toLocaleString()}`);
    console.log(`  Skipped (same): ${state.skipped.toLocaleString()}`);
    console.log(`  Failed        : ${state.failed.toLocaleString()}`);
    if (state.failed > 0) {
        console.log("");
        console.log("  Failed keys:");
        const failedKeys = Object.entries(manifestFiles).filter(([, e]) => e.status === "failed");
        for (const [key, entry] of failedKeys.slice(0, 25)) {
            console.log(`    ✖ ${key} — ${entry.error || "unknown error"}`);
        }
        if (failedKeys.length > 25) {
            console.log(`    … and ${failedKeys.length - 25} more`);
        }
    }
    console.log(`  Average speed  : ${formatBytes(speed)}/s`);
    console.log(`  Duration       : ${formatDuration(elapsed)}`);
    console.log(`  Manifest       : ${MANIFEST_PATH}`);
    console.log(`  Restore with   : bun run scripts/restore-spaces.ts`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    if (state.failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("\n❌ Backup failed:", error);
    process.exit(1);
});