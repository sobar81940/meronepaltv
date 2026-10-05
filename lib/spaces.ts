import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

type StorageProvider = "r2" | "spaces";

interface StorageConfig {
    provider: StorageProvider;
    region: string;
    bucketName: string;
    endpoint: string;
    publicUrl: string;
    accessKeyId: string;
    secretAccessKey: string;
}

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
const r2BucketName = process.env.R2_BUCKET_NAME?.trim() || "";
const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() || "";
const r2Endpoint = process.env.R2_ENDPOINT?.trim()
    || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");
const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim() || "";

const isR2Configured = Boolean(
    r2AccessKeyId
    && r2SecretAccessKey
    && r2BucketName
    && r2Endpoint
    && r2PublicUrl
);

const spacesRegion = process.env.SPACES_REGION?.trim() || "sgp1";
const spacesBucketName = process.env.SPACES_BUCKET_NAME?.trim() || "dunz0";
const spacesEndpoint = process.env.SPACES_ENDPOINT?.trim()
    || `https://${spacesRegion}.digitaloceanspaces.com`;
const spacesPublicUrl = process.env.SPACES_CDN_ENDPOINT?.trim()
    || `https://${spacesBucketName}.${spacesRegion}.cdn.digitaloceanspaces.com`;

const storageConfig: StorageConfig = isR2Configured
    ? {
        provider: "r2",
        region: "auto",
        bucketName: r2BucketName,
        endpoint: withoutTrailingSlash(r2Endpoint),
        publicUrl: withoutTrailingSlash(r2PublicUrl),
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
    }
    : {
        provider: "spaces",
        region: spacesRegion,
        bucketName: spacesBucketName,
        endpoint: withoutTrailingSlash(spacesEndpoint),
        publicUrl: withoutTrailingSlash(spacesPublicUrl),
        accessKeyId: process.env.SPACES_KEY?.trim() || "",
        secretAccessKey: process.env.SPACES_SECRET?.trim() || "",
    };

const s3Client = new S3Client({
    endpoint: storageConfig.endpoint,
    region: storageConfig.region,
    credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
    },
    forcePathStyle: false,
});

/** Whether either a complete R2 configuration or Spaces credentials are available. */
export function isStorageConfigured(): boolean {
    return isR2Configured || Boolean(storageConfig.accessKeyId && storageConfig.secretAccessKey);
}

/** Public base URL for whichever object-storage provider is active. */
export function getStoragePublicUrl(): string {
    return storageConfig.publicUrl;
}

function getPublicUrl(key: string): string {
    return `${storageConfig.publicUrl}/${key.replace(/^\/+/, "")}`;
}

export interface SpacesUploadResult {
    url: string;
    key: string;
    publicId: string;
}

/**
 * Upload an image to the configured S3-compatible object store.
 */
export async function uploadToSpaces(
    file: Buffer,
    options: {
        folder?: string;
        filename?: string;
        contentType?: string;
    } = {}
): Promise<SpacesUploadResult> {
    const { folder = "news-portal", filename, contentType = "image/jpeg" } = options;

    // Generate unique filename
    const extension = getExtensionFromMimeType(contentType);
    const uniqueFilename = filename || `${uuidv4()}${extension}`;
    const key = `${folder}/${uniqueFilename}`;

    // R2 buckets do not support S3 object ACLs. Spaces retains its existing
    // public-read behavior for backward compatibility.
    const command = new PutObjectCommand({
        Bucket: storageConfig.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: "max-age=31536000", // 1 year cache
        ...(storageConfig.provider === "spaces" ? { ACL: "public-read" as const } : {}),
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    return {
        url,
        key,
        publicId: key,
    };
}

/**
 * Upload a video to the configured S3-compatible object store.
 */
export async function uploadVideoToSpaces(
    file: Buffer,
    options: {
        folder?: string;
        filename?: string;
        contentType?: string;
    } = {}
): Promise<SpacesUploadResult> {
    const { folder = "news-portal/videos", filename, contentType = "video/mp4" } = options;

    const extension = getExtensionFromMimeType(contentType);
    const uniqueFilename = filename || `${uuidv4()}${extension}`;
    const key = `${folder}/${uniqueFilename}`;

    const command = new PutObjectCommand({
        Bucket: storageConfig.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: "max-age=31536000",
        ...(storageConfig.provider === "spaces" ? { ACL: "public-read" as const } : {}),
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    return {
        url,
        key,
        publicId: key,
    };
}

/**
 * Delete a file from the configured object store.
 */
export async function deleteFromSpaces(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: storageConfig.bucketName,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "application/pdf": ".pdf",
    };

    return mimeToExt[mimeType] || ".bin";
}

/**
 * Get the public URL for an object key. The legacy name is kept for callers.
 */
export function getSpacesUrl(key: string): string {
    return getPublicUrl(key);
}

/**
 * List images from a folder in the configured object store.
 */
export interface SpacesListResult {
    images: {
        key: string;
        url: string;
        lastModified?: Date;
        size?: number;
    }[];
    nextCursor?: string;
}

export async function listFromSpaces(
    options: {
        folder?: string;
        maxResults?: number;
        continuationToken?: string;
    } = {}
): Promise<SpacesListResult> {
    const { folder = "news-portal", maxResults = 50, continuationToken } = options;

    const command = new ListObjectsV2Command({
        Bucket: storageConfig.bucketName,
        Prefix: folder + "/",
        MaxKeys: maxResults,
        ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    const images = (response.Contents || [])
        .filter(obj => {
            // Filter only image files
            const key = obj.Key || "";
            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(key);
        })
        .map(obj => ({
            key: obj.Key || "",
            url: getPublicUrl(obj.Key || ""),
            lastModified: obj.LastModified,
            size: obj.Size,
        }));

    return {
        images,
        nextCursor: response.NextContinuationToken,
    };
}
