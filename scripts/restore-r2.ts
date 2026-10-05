/**
 * Restore media from backups/spaces to Cloudflare R2.
 *
 * The command is deliberately a local-only dry run unless
 * R2_RESTORE_DRY_RUN=false is set exactly. Dry runs validate the manifest,
 * paths, local sizes, and file signatures without contacting R2.
 * Only jpg/jpeg/png/gif/webp/svg/jfif/ico/mp4/webm/mov/mp3/wav/pdf keys are
 * considered. Their content is detected independently from the extension, and
 * the detected type is sent as ContentType.
 *
 * Required for a live restore:
 *   R2_ACCOUNT_ID or R2_ENDPOINT
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME
 *
 * Optional:
 *   R2_RESTORE_PREFIX       only restore object keys starting with this value
 *   R2_RESTORE_CONCURRENCY  parallel remote operations (default: 5, max: 32)
 *   R2_RESTORE_RETRIES      retries after the first attempt (default: 2, max: 10)
 *   R2_RESTORE_FORCE        "true" to overwrite existing objects
 *   R2_RESTORE_DRY_RUN      "false" to perform uploads (default: dry run)
 *
 * Usage:
 *   bun run restore:r2
 *   R2_RESTORE_DRY_RUN=false bun run restore:r2
 */

import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";

const BACKUP_DIR = path.resolve("backups/spaces");
const FILES_DIR = path.join(BACKUP_DIR, "files");
const MANIFEST_PATH = path.join(BACKUP_DIR, "manifest.json");
const SIGNATURE_READ_BYTES = 64 * 1024;
const SIGNATURE_TAIL_BYTES = 32;
const MINIMUM_JPEG_BYTES = 64;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const EXPECTED_MEDIA_BY_EXTENSION = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    gif: "gif",
    webp: "webp",
    svg: "svg",
    jfif: "jpeg",
    ico: "ico",
    mp4: "mp4",
    webm: "webm",
    mov: "mov",
    mp3: "mp3",
    wav: "wav",
    pdf: "pdf",
} as const;

const DETECTED_MEDIA = {
    jpeg: { label: "JPEG", contentType: "image/jpeg" },
    png: { label: "PNG", contentType: "image/png" },
    gif: { label: "GIF", contentType: "image/gif" },
    webp: { label: "WebP", contentType: "image/webp" },
    svg: { label: "SVG", contentType: "image/svg+xml" },
    ico: { label: "ICO", contentType: "image/x-icon" },
    mp4: { label: "MP4", contentType: "video/mp4" },
    webm: { label: "WebM", contentType: "video/webm" },
    mov: { label: "QuickTime", contentType: "video/quicktime" },
    mp3: { label: "MP3", contentType: "audio/mpeg" },
    wav: { label: "WAV", contentType: "audio/wav" },
    pdf: { label: "PDF", contentType: "application/pdf" },
} as const;

type MediaExtension = keyof typeof EXPECTED_MEDIA_BY_EXTENSION;
type DetectedMediaKind = keyof typeof DETECTED_MEDIA;
type ManifestStatus = "downloaded" | "skipped" | "failed";

interface SignatureBytes {
    head: Buffer;
    tail: Buffer;
}

interface DetectedMedia {
    kind: DetectedMediaKind;
    label: string;
    contentType: string;
}

interface ManifestFileEntry {
    size: number;
    localPath: string;
    status: ManifestStatus;
}

interface Manifest {
    bucket?: string;
    region?: string;
    backupDate?: string;
    files: Record<string, ManifestFileEntry>;
}

interface Candidate {
    key: string;
    entry: ManifestFileEntry;
    localPath: string;
    media: DetectedMedia;
}

interface Issue {
    key: string;
    reason: string;
}

interface PolicyCounts {
    prefix: number;
    manifestFailed: number;
    unsupported: number;
    unsafe: number;
    signature: number;
}

type UploadResult =
    | { status: "uploaded" }
    | { status: "skipped-existing" }
    | { status: "failed"; error: string };

function readBoundedInteger(name: string, fallback: number, minimum: number, maximum: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw === "") return fallback;

    if (!/^\d+$/.test(raw)) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    }

    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    }
    return value;
}

const CONCURRENCY = readBoundedInteger("R2_RESTORE_CONCURRENCY", 5, 1, 32);
const RETRIES = readBoundedInteger("R2_RESTORE_RETRIES", 2, 0, 10);
const PREFIX = process.env.R2_RESTORE_PREFIX || "";
const FORCE = process.env.R2_RESTORE_FORCE === "true";
const DRY_RUN = process.env.R2_RESTORE_DRY_RUN !== "false";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifest(value: unknown): Manifest {
    if (!isRecord(value) || !isRecord(value.files)) {
        throw new Error("Manifest must contain a files object");
    }

    const files: Record<string, ManifestFileEntry> = {};
    for (const [key, rawEntry] of Object.entries(value.files)) {
        if (!isRecord(rawEntry)) {
            throw new Error(`Invalid manifest entry for ${JSON.stringify(key)}`);
        }

        const { size, localPath, status } = rawEntry;
        if (
            typeof size !== "number" ||
            !Number.isSafeInteger(size) ||
            size < 0 ||
            typeof localPath !== "string" ||
            (status !== "downloaded" && status !== "skipped" && status !== "failed")
        ) {
            throw new Error(`Invalid manifest entry for ${JSON.stringify(key)}`);
        }
        files[key] = { size, localPath, status };
    }

    return {
        files,
        ...(typeof value.bucket === "string" ? { bucket: value.bucket } : {}),
        ...(typeof value.region === "string" ? { region: value.region } : {}),
        ...(typeof value.backupDate === "string" ? { backupDate: value.backupDate } : {}),
    };
}

async function loadManifest(): Promise<Manifest> {
    let source: string;
    try {
        source = await fs.readFile(MANIFEST_PATH, "utf8");
    } catch (error) {
        throw new Error(`Cannot read ${MANIFEST_PATH}: ${errorMessage(error)}`);
    }

    try {
        return parseManifest(JSON.parse(source) as unknown);
    } catch (error) {
        throw new Error(`Invalid manifest ${MANIFEST_PATH}: ${errorMessage(error)}`);
    }
}

function fileExtension(key: string): string {
    return path.posix.extname(key).slice(1).toLowerCase();
}

function expectedMediaKind(extension: string): DetectedMediaKind | undefined {
    if (!Object.prototype.hasOwnProperty.call(EXPECTED_MEDIA_BY_EXTENSION, extension)) return undefined;
    return EXPECTED_MEDIA_BY_EXTENSION[extension as MediaExtension];
}

function unsafeKeyReason(key: string): string | undefined {
    if (key.length === 0) return "empty object key";
    if (Buffer.byteLength(key, "utf8") > 1024) return "object key is longer than 1,024 bytes";
    if (/[\u0000-\u001f\u007f]/.test(key)) return "object key contains control characters";
    if (key.includes("\\")) return "object key contains a backslash";
    if (path.posix.isAbsolute(key) || path.win32.isAbsolute(key)) return "absolute object key";
    if (key.endsWith("/")) return "directory-marker object key";

    const segments = key.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
        return "object key contains an unsafe path segment";
    }
    if (path.posix.normalize(key) !== key) return "object key is not normalized";
    return undefined;
}

function isWithin(parent: string, child: string): boolean {
    const relative = path.relative(parent, child);
    return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function bytesEqual(buffer: Buffer, expected: readonly number[], offset = 0): boolean {
    return expected.every((value, index) => buffer[offset + index] === value);
}

function hasAscii(buffer: Buffer, value: string, offset: number): boolean {
    return buffer.length >= offset + value.length && buffer.toString("ascii", offset, offset + value.length) === value;
}

function webmDocTypeIsValid(buffer: Buffer): boolean {
    if (!bytesEqual(buffer, [0x1a, 0x45, 0xdf, 0xa3])) return false;

    for (let offset = 4; offset < buffer.length - 3; offset++) {
        if (buffer[offset] !== 0x42 || buffer[offset + 1] !== 0x82) continue;

        const firstLengthByte = buffer[offset + 2];
        let lengthBytes = 1;
        let marker = 0x80;
        while (lengthBytes <= 8 && (firstLengthByte & marker) === 0) {
            marker >>= 1;
            lengthBytes++;
        }
        if (lengthBytes > 8) continue;

        let length = firstLengthByte & (marker - 1);
        for (let index = 1; index < lengthBytes; index++) {
            const byte = buffer[offset + 2 + index];
            if (byte === undefined) return false;
            length = length * 256 + byte;
        }

        const valueOffset = offset + 2 + lengthBytes;
        if (length === 4 && hasAscii(buffer, "webm", valueOffset)) return true;
    }
    return false;
}

function isoBaseMediaKind(buffer: Buffer, fileSize: number): "mp4" | "mov" | undefined {
    if (buffer.length < 16 || !hasAscii(buffer, "ftyp", 4)) return undefined;

    const boxSize = buffer.readUInt32BE(0);
    const extended = boxSize === 1;
    const minimumBoxSize = extended ? 24 : 16;
    if (extended) {
        if (buffer.length < minimumBoxSize) return undefined;
        const extendedSize = buffer.readBigUInt64BE(8);
        if (extendedSize < BigInt(minimumBoxSize) || extendedSize > BigInt(fileSize)) return undefined;
    } else if (boxSize !== 0 && (boxSize < minimumBoxSize || boxSize > fileSize)) {
        return undefined;
    }

    const brandOffset = extended ? 16 : 8;
    const brand = buffer.toString("ascii", brandOffset, brandOffset + 4);
    if (!/^[\x20-\x7e]{4}$/.test(brand)) return undefined;
    return brand === "qt  " ? "mov" : "mp4";
}

function mp3SignatureIsValid(buffer: Buffer): boolean {
    if (hasAscii(buffer, "ID3", 0)) return true;
    if (buffer.length < 4 || buffer[0] !== 0xff || (buffer[1] & 0xe0) !== 0xe0) return false;

    const version = (buffer[1] >> 3) & 0x03;
    const layer = (buffer[1] >> 1) & 0x03;
    const bitrate = (buffer[2] >> 4) & 0x0f;
    const sampleRate = (buffer[2] >> 2) & 0x03;
    return version !== 0x01 && layer !== 0x00 && bitrate !== 0x00 && bitrate !== 0x0f && sampleRate !== 0x03;
}

function svgSignatureIsValid(buffer: Buffer): boolean {
    if (buffer.includes(0)) return false;
    const text = buffer.toString("utf8");
    return /^\uFEFF?\s*(?:<\?xml\b[^?]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+svg\b[\s\S]*?>\s*)?<svg(?:\s|>)/i.test(
        text
    );
}

function jpegSignatureIsValid(signature: SignatureBytes, fileSize: number): boolean {
    return (
        fileSize >= MINIMUM_JPEG_BYTES &&
        bytesEqual(signature.head, [0xff, 0xd8, 0xff]) &&
        signature.tail.length >= 2 &&
        bytesEqual(signature.tail, [0xff, 0xd9], signature.tail.length - 2)
    );
}

function icoSignatureIsValid(buffer: Buffer, fileSize: number): boolean {
    if (buffer.length < 6 || !bytesEqual(buffer, [0x00, 0x00, 0x01, 0x00])) return false;
    const imageCount = buffer.readUInt16LE(4);
    return imageCount > 0 && fileSize >= 6 + imageCount * 16;
}

function detectMedia(signature: SignatureBytes, fileSize: number): DetectedMedia | undefined {
    const { head } = signature;
    let kind: DetectedMediaKind | undefined;

    if (jpegSignatureIsValid(signature, fileSize)) kind = "jpeg";
    else if (bytesEqual(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) kind = "png";
    else if (hasAscii(head, "GIF87a", 0) || hasAscii(head, "GIF89a", 0)) kind = "gif";
    else if (hasAscii(head, "RIFF", 0) && hasAscii(head, "WEBP", 8)) kind = "webp";
    else if (svgSignatureIsValid(head)) kind = "svg";
    else if (icoSignatureIsValid(head, fileSize)) kind = "ico";
    else kind = isoBaseMediaKind(head, fileSize);

    if (!kind && webmDocTypeIsValid(head)) kind = "webm";
    if (!kind && mp3SignatureIsValid(head)) kind = "mp3";
    if (!kind && hasAscii(head, "RIFF", 0) && hasAscii(head, "WAVE", 8)) kind = "wav";
    if (!kind && hasAscii(head, "%PDF-", 0)) kind = "pdf";
    if (!kind) return undefined;

    return { kind, ...DETECTED_MEDIA[kind] };
}

async function readSignature(localPath: string, fileSize: number): Promise<SignatureBytes> {
    const handle = await fs.open(localPath, "r");
    try {
        const headBuffer = Buffer.alloc(Math.min(SIGNATURE_READ_BYTES, fileSize));
        const headRead = await handle.read(headBuffer, 0, headBuffer.length, 0);
        const tailBuffer = Buffer.alloc(Math.min(SIGNATURE_TAIL_BYTES, fileSize));
        const tailRead = await handle.read(tailBuffer, 0, tailBuffer.length, fileSize - tailBuffer.length);
        return {
            head: headBuffer.subarray(0, headRead.bytesRead),
            tail: tailBuffer.subarray(0, tailRead.bytesRead),
        };
    } finally {
        await handle.close();
    }
}

async function mapWithConcurrency<T>(
    items: readonly T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>
): Promise<void> {
    let nextIndex = 0;
    const runnerCount = Math.min(concurrency, items.length);
    await Promise.all(
        Array.from({ length: runnerCount }, async () => {
            while (nextIndex < items.length) {
                const index = nextIndex++;
                await worker(items[index], index);
            }
        })
    );
}

function endpointFromEnvironment(): string | undefined {
    const explicitEndpoint = process.env.R2_ENDPOINT?.trim();
    if (explicitEndpoint) {
        let endpoint: URL;
        try {
            endpoint = new URL(explicitEndpoint);
        } catch {
            throw new Error("R2_ENDPOINT must be a valid URL");
        }
        if (endpoint.protocol !== "https:") throw new Error("R2_ENDPOINT must use HTTPS");
        if (endpoint.username || endpoint.password) throw new Error("R2_ENDPOINT must not contain credentials");
        return endpoint.toString().replace(/\/$/, "");
    }

    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    if (!accountId) return undefined;
    if (!/^[A-Za-z0-9_-]+$/.test(accountId)) {
        throw new Error("R2_ACCOUNT_ID contains invalid characters");
    }
    return `https://${accountId}.r2.cloudflarestorage.com`;
}

function createR2Client(): { client: S3Client; bucket: string; endpoint: string } {
    const endpoint = endpointFromEnvironment();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
    const bucket = process.env.R2_BUCKET_NAME?.trim() || "";
    const missing: string[] = [];

    if (!endpoint) missing.push("R2_ACCOUNT_ID or R2_ENDPOINT");
    if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!bucket) missing.push("R2_BUCKET_NAME");
    if (missing.length > 0) {
        throw new Error(`Live restore requires: ${missing.join(", ")}`);
    }
    if (!endpoint) throw new Error("Live restore endpoint is missing");

    return {
        bucket,
        endpoint,
        client: new S3Client({
            endpoint,
            region: "auto",
            credentials: { accessKeyId, secretAccessKey },
        }),
    };
}

function isNotFound(error: unknown): boolean {
    if (!isRecord(error)) return false;
    const metadata = isRecord(error.$metadata) ? error.$metadata : undefined;
    return error.name === "NotFound" || error.name === "NoSuchKey" || metadata?.httpStatusCode === 404;
}

async function retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
            }
        }
    }
    throw lastError;
}

async function remoteSize(client: S3Client, bucket: string, key: string): Promise<number | null> {
    try {
        const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        if (
            typeof response.ContentLength !== "number" ||
            !Number.isSafeInteger(response.ContentLength) ||
            response.ContentLength < 0
        ) {
            throw new Error("R2 HeadObject response did not include a valid ContentLength");
        }
        return response.ContentLength;
    } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
    }
}

async function assertCandidateStillValid(candidate: Candidate, filesRealPath: string): Promise<void> {
    const stat = await fs.lstat(candidate.localPath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("local source is not a regular file");
    if (stat.size !== candidate.entry.size) {
        throw new Error(`local size changed: expected ${candidate.entry.size}, got ${stat.size}`);
    }

    const realPath = await fs.realpath(candidate.localPath);
    if (!isWithin(filesRealPath, realPath)) throw new Error("local source resolves outside backup files directory");

    const signature = await readSignature(candidate.localPath, stat.size);
    const media = detectMedia(signature, stat.size);
    if (!media || media.kind !== candidate.media.kind) {
        throw new Error(`local detected media changed from ${candidate.media.label}`);
    }
}

async function restoreCandidate(
    client: S3Client,
    bucket: string,
    candidate: Candidate,
    filesRealPath: string
): Promise<UploadResult> {
    try {
        const existingSize = await retry(() => remoteSize(client, bucket, candidate.key));
        if (existingSize !== null && !FORCE) {
            if (existingSize === candidate.entry.size) return { status: "skipped-existing" };
            return {
                status: "failed",
                error: `remote size mismatch: local ${candidate.entry.size}, remote ${existingSize}; use R2_RESTORE_FORCE=true to overwrite`,
            };
        }

        await retry(async () => {
            await assertCandidateStillValid(candidate, filesRealPath);
            const body = await fs.readFile(candidate.localPath);
            await client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: candidate.key,
                    Body: body,
                    ContentLength: candidate.entry.size,
                    ContentType: candidate.media.contentType,
                    CacheControl: CACHE_CONTROL,
                })
            );

            const verifiedSize = await remoteSize(client, bucket, candidate.key);
            if (verifiedSize !== candidate.entry.size) {
                throw new Error(
                    `post-upload verification failed: expected ${candidate.entry.size} bytes, got ${verifiedSize ?? "missing object"}`
                );
            }
        });

        return { status: "uploaded" };
    } catch (error) {
        return { status: "failed", error: errorMessage(error) };
    }
}

async function main(): Promise<void> {
    const startedAt = Date.now();
    if (/[\u0000-\u001f\u007f]/.test(PREFIX)) {
        throw new Error("R2_RESTORE_PREFIX must not contain control characters");
    }

    const manifest = await loadManifest();
    const filesRealPath = await fs.realpath(FILES_DIR).catch((error: unknown) => {
        throw new Error(`Cannot access backup files directory ${FILES_DIR}: ${errorMessage(error)}`);
    });
    const entries = Object.entries(manifest.files);
    const candidatesByIndex: Array<Candidate | undefined> = new Array(entries.length);
    const sourceIssues: Issue[] = [];
    const policyIssues: Issue[] = [];
    const extensionWarnings: Issue[] = [];
    const policy: PolicyCounts = { prefix: 0, manifestFailed: 0, unsupported: 0, unsafe: 0, signature: 0 };

    console.log(`R2 restore ${DRY_RUN ? "DRY RUN (local validation only)" : "LIVE"}`);
    console.log(`Source: ${MANIFEST_PATH} (${entries.length.toLocaleString()} manifest entries)`);
    if (PREFIX) console.log(`Key prefix: ${PREFIX}`);

    await mapWithConcurrency(entries, CONCURRENCY, async ([key, entry], index) => {
        if (PREFIX && !key.startsWith(PREFIX)) {
            policy.prefix++;
            return;
        }
        if (entry.status === "failed") {
            policy.manifestFailed++;
            return;
        }

        const keyProblem = unsafeKeyReason(key);
        const expectedLocalPath = `files/${key}`;
        if (keyProblem || entry.localPath !== expectedLocalPath) {
            policy.unsafe++;
            policyIssues.push({
                key,
                reason: keyProblem || `manifest localPath does not match ${JSON.stringify(expectedLocalPath)}`,
            });
            return;
        }

        const extension = fileExtension(key);
        const expectedKind = expectedMediaKind(extension);
        if (!expectedKind) {
            policy.unsupported++;
            return;
        }

        const localPath = path.resolve(BACKUP_DIR, ...entry.localPath.split("/"));
        if (!isWithin(FILES_DIR, localPath)) {
            policy.unsafe++;
            policyIssues.push({ key, reason: "local path escapes backup files directory" });
            return;
        }

        try {
            const stat = await fs.lstat(localPath);
            if (!stat.isFile() || stat.isSymbolicLink()) {
                sourceIssues.push({ key, reason: "local source is not a regular file" });
                return;
            }
            if (stat.size !== entry.size) {
                sourceIssues.push({ key, reason: `local size mismatch: manifest ${entry.size}, disk ${stat.size}` });
                return;
            }

            const realPath = await fs.realpath(localPath);
            if (!isWithin(filesRealPath, realPath)) {
                policy.unsafe++;
                policyIssues.push({ key, reason: "local source resolves outside backup files directory" });
                return;
            }

            const signature = await readSignature(localPath, stat.size);
            const media = detectMedia(signature, stat.size);
            if (!media) {
                policy.signature++;
                policyIssues.push({ key, reason: `content is not a valid supported media file despite .${extension} extension` });
                return;
            }

            if (expectedKind !== media.kind) {
                extensionWarnings.push({
                    key,
                    reason: extension
                        ? `.${extension} extension, detected ${media.label}; uploading as ${media.contentType}`
                        : `no extension, detected ${media.label}; uploading as ${media.contentType}`,
                });
            }

            candidatesByIndex[index] = { key, entry, localPath, media };
        } catch (error) {
            sourceIssues.push({ key, reason: errorMessage(error) });
        }
    });

    const candidates = candidatesByIndex.filter((candidate): candidate is Candidate => candidate !== undefined);
    const eligibleBytes = candidates.reduce((total, candidate) => total + candidate.entry.size, 0);
    let uploaded = 0;
    let existing = 0;
    const uploadIssues: Issue[] = [];

    if (!DRY_RUN && candidates.length > 0) {
        const { client, bucket, endpoint } = createR2Client();
        console.log(`Destination: ${bucket} at ${endpoint}`);

        let completed = 0;
        try {
            await mapWithConcurrency(candidates, CONCURRENCY, async (candidate) => {
                const result = await restoreCandidate(client, bucket, candidate, filesRealPath);
                if (result.status === "uploaded") uploaded++;
                else if (result.status === "skipped-existing") existing++;
                else uploadIssues.push({ key: candidate.key, reason: result.error });

                completed++;
                if (completed % 100 === 0 || completed === candidates.length) {
                    console.log(`Progress: ${completed.toLocaleString()}/${candidates.length.toLocaleString()}`);
                }
            });
        } finally {
            client.destroy();
        }
    }

    policyIssues.sort((left, right) => left.key.localeCompare(right.key));
    extensionWarnings.sort((left, right) => left.key.localeCompare(right.key));
    sourceIssues.sort((left, right) => left.key.localeCompare(right.key));
    uploadIssues.sort((left, right) => left.key.localeCompare(right.key));

    for (const issue of policyIssues) console.log(`POLICY SKIP: ${issue.key} — ${issue.reason}`);
    for (const issue of extensionWarnings) console.warn(`EXTENSION WARNING: ${issue.key} — ${issue.reason}`);
    for (const issue of sourceIssues) console.error(`SOURCE FAILURE: ${issue.key} — ${issue.reason}`);
    for (const issue of uploadIssues) console.error(`UPLOAD FAILURE: ${issue.key} — ${issue.reason}`);

    const policyTotal = Object.values(policy).reduce((total, count) => total + count, 0);
    console.log("");
    console.log("R2 restore summary");
    console.log(`Eligible media: ${candidates.length.toLocaleString()} (${formatBytes(eligibleBytes)})`);
    if (DRY_RUN) console.log(`Would check/upload: ${candidates.length.toLocaleString()}`);
    else {
        console.log(`Uploaded and verified: ${uploaded.toLocaleString()}`);
        console.log(`Skipped (same remote size): ${existing.toLocaleString()}`);
    }
    console.log(
        `Policy skips: ${policyTotal.toLocaleString()} (prefix ${policy.prefix}, manifest-failed ${policy.manifestFailed}, unsupported ${policy.unsupported}, unsafe ${policy.unsafe}, signature ${policy.signature})`
    );
    console.log(`Extension warnings: ${extensionWarnings.length.toLocaleString()}`);
    console.log(`Source failures: ${sourceIssues.length.toLocaleString()}`);
    if (!DRY_RUN) console.log(`Upload failures: ${uploadIssues.length.toLocaleString()}`);
    console.log(`Duration: ${formatDuration(Date.now() - startedAt)}`);

    if (sourceIssues.length > 0 || uploadIssues.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
    console.error(`R2 restore failed: ${errorMessage(error)}`);
    process.exitCode = 1;
});
