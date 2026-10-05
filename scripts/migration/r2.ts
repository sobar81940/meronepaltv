/**
 * Migration-only Cloudflare R2 client.
 *
 * Mirrors the project's lib/spaces.ts conventions (same env variable names,
 * same @aws-sdk/client-s3 driver, same CacheControl, R2 = no ACL) but adds:
 *   - deterministic keys:  posts/<legacyId>/<filename>
 *   - idempotency: HeadObject check so a rerun does NOT re-upload an image
 *   - returns the full public URL (project convention stores URL in imageUrl)
 *
 * We keep this separate from lib/spaces.ts because that module auto-generates
 * random UUID keys and is tuned for the live app upload path; the migration
 * needs stable, legacy-id-based keys to stay idempotent.
 */

import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { MigrationEnv } from "./env.ts";

const withoutTrailingSlash = (v: string) => v.replace(/\/+$/, "");

const MIME_BY_EXT: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".avif": "image/avif",
};

export function contentTypeForFilename(filename: string): string {
    const dot = filename.lastIndexOf(".");
    const ext = dot === -1 ? "" : filename.slice(dot).toLowerCase();
    return MIME_BY_EXT[ext] || "application/octet-stream";
}

export interface R2UploadResult {
    url: string;
    key: string;
    skipped: boolean; // true if object already existed (no re-upload)
}

export class MigrationR2 {
    private client: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor(env: MigrationEnv) {
        this.bucket = env.R2_BUCKET_NAME;
        this.publicUrl = withoutTrailingSlash(env.R2_PUBLIC_URL);
        this.client = new S3Client({
            endpoint: withoutTrailingSlash(env.R2_ENDPOINT),
            region: "auto",
            credentials: {
                accessKeyId: env.R2_ACCESS_KEY_ID,
                secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            },
            forcePathStyle: false,
        });
    }

    /** Deterministic key: posts/<legacyId>/<filename>. */
    buildKey(legacyId: number, filename: string): string {
        const safeName = filename.replace(/^\/+/, "");
        return `posts/${legacyId}/${safeName}`;
    }

    publicUrlForKey(key: string): string {
        return `${this.publicUrl}/${key.replace(/^\/+/, "")}`;
    }

    /** Returns true if the object already exists in the bucket. */
    async exists(key: string): Promise<boolean> {
        try {
            await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
            return true;
        } catch (err) {
            const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
            if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
            // Re-throw anything that isn't a clean "not found".
            throw err;
        }
    }

    /**
     * Idempotent upload. If the deterministic key already exists, we skip the
     * upload (dedupe on rerun) and simply return its public URL.
     */
    async uploadImage(
        legacyId: number,
        filename: string,
        body: Buffer,
    ): Promise<R2UploadResult> {
        const key = this.buildKey(legacyId, filename);

        if (await this.exists(key)) {
            return { url: this.publicUrlForKey(key), key, skipped: true };
        }

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentTypeForFilename(filename),
                CacheControl: "max-age=31536000",
            }),
        );

        return { url: this.publicUrlForKey(key), key, skipped: false };
    }

    /** Lightweight connectivity check used by dry-run. */
    async checkConnection(): Promise<void> {
        // HeadObject on a key that almost certainly does not exist. A clean
        // "NotFound" proves auth + bucket are reachable; other errors surface.
        await this.exists(`__migration_connectivity_check__/${Date.now()}`);
    }
}
