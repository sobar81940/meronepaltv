import clientPromise from "@/lib/mongodb";
import { uploadToSpaces, uploadVideoToSpaces } from "@/lib/spaces";

const DB_NAME = "meronepaltv";
const CLOUDINARY_PATTERN = /https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/[^"'\s]+/g;

interface MigrationResult {
    collection: string;
    documentId: string;
    field: string;
    oldUrl: string;
    newUrl: string;
    success: boolean;
    error?: string;
}

async function downloadFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function getContentTypeFromUrl(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase().split("?")[0] || "";
    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
    };
    return mimeTypes[ext] || "image/jpeg";
}

function isVideoUrl(url: string): boolean {
    const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv"];
    const ext = url.split(".").pop()?.toLowerCase().split("?")[0] || "";
    return videoExtensions.includes(ext) || url.includes("/video/upload/");
}

async function migrateUrl(oldUrl: string): Promise<string> {
    console.log(`  Downloading: ${oldUrl.substring(0, 80)}...`);
    
    const buffer = await downloadFromUrl(oldUrl);
    const contentType = getContentTypeFromUrl(oldUrl);
    const isVideo = isVideoUrl(oldUrl);
    
    console.log(`  Uploading to Spaces (${isVideo ? "video" : "image"}, ${(buffer.length / 1024).toFixed(1)}KB)...`);
    
    if (isVideo) {
        const result = await uploadVideoToSpaces(buffer, {
            folder: "news-portal/migrated",
            contentType,
        });
        return result.url;
    } else {
        const result = await uploadToSpaces(buffer, {
            folder: "news-portal/migrated",
            contentType,
        });
        return result.url;
    }
}

async function findAndReplaceCloudinaryUrls(
    obj: Record<string, unknown>,
    urlMap: Map<string, string>
): Promise<boolean> {
    let modified = false;
    
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        
        if (typeof value === "string" && value.includes("res.cloudinary.com")) {
            // Check if we already migrated this URL
            if (urlMap.has(value)) {
                obj[key] = urlMap.get(value);
                modified = true;
            } else {
                // Find all Cloudinary URLs in this string
                const matches = value.match(CLOUDINARY_PATTERN);
                if (matches) {
                    let newValue = value;
                    for (const match of matches) {
                        if (!urlMap.has(match)) {
                            try {
                                const newUrl = await migrateUrl(match);
                                urlMap.set(match, newUrl);
                            } catch (error) {
                                console.error(`  Failed to migrate: ${match}`, error);
                                continue;
                            }
                        }
                        newValue = newValue.replace(match, urlMap.get(match)!);
                    }
                    if (newValue !== value) {
                        obj[key] = newValue;
                        modified = true;
                    }
                }
            }
        } else if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                if (typeof value[i] === "object" && value[i] !== null) {
                    const arrayModified = await findAndReplaceCloudinaryUrls(
                        value[i] as Record<string, unknown>,
                        urlMap
                    );
                    if (arrayModified) modified = true;
                } else if (typeof value[i] === "string" && value[i].includes("res.cloudinary.com")) {
                    const matches = (value[i] as string).match(CLOUDINARY_PATTERN);
                    if (matches) {
                        let newValue = value[i] as string;
                        for (const match of matches) {
                            if (!urlMap.has(match)) {
                                try {
                                    const newUrl = await migrateUrl(match);
                                    urlMap.set(match, newUrl);
                                } catch (error) {
                                    console.error(`  Failed to migrate: ${match}`, error);
                                    continue;
                                }
                            }
                            newValue = newValue.replace(match, urlMap.get(match)!);
                        }
                        if (newValue !== value[i]) {
                            value[i] = newValue;
                            modified = true;
                        }
                    }
                }
            }
        } else if (typeof value === "object" && value !== null) {
            const objModified = await findAndReplaceCloudinaryUrls(
                value as Record<string, unknown>,
                urlMap
            );
            if (objModified) modified = true;
        }
    }
    
    return modified;
}

export async function migrateCloudinaryToSpaces(dryRun: boolean = true): Promise<{
    totalFound: number;
    migrated: number;
    failed: number;
    results: MigrationResult[];
}> {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const collections = ["posts", "settings", "galleries", "webstories", "celebrities", "events", "users"];
    const results: MigrationResult[] = [];
    const urlMap = new Map<string, string>();
    
    let totalFound = 0;
    let migrated = 0;
    let failed = 0;
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`CLOUDINARY TO SPACES MIGRATION ${dryRun ? "(DRY RUN)" : "(LIVE)"}`);
    console.log(`${"=".repeat(60)}\n`);
    
    for (const collectionName of collections) {
        console.log(`\n📂 Processing collection: ${collectionName}`);
        
        const collection = db.collection(collectionName);
        
        // Find documents with Cloudinary URLs
        const documents = await collection.find({
            $or: [
                { featuredImage: { $regex: "cloudinary" } },
                { imageUrl: { $regex: "cloudinary" } },
                { logoUrl: { $regex: "cloudinary" } },
                { coverImage: { $regex: "cloudinary" } },
                { thumbnail: { $regex: "cloudinary" } },
                { images: { $elemMatch: { $regex: "cloudinary" } } },
                { "slides.imageUrl": { $regex: "cloudinary" } },
                { content: { $regex: "cloudinary" } },
            ]
        }).toArray();
        
        console.log(`  Found ${documents.length} documents with Cloudinary URLs`);
        totalFound += documents.length;
        
        for (const doc of documents) {
            console.log(`\n  📄 Document ID: ${doc._id}`);
            
            try {
                const docCopy = JSON.parse(JSON.stringify(doc));
                delete docCopy._id;
                
                const modified = await findAndReplaceCloudinaryUrls(docCopy, urlMap);
                
                if (modified) {
                    if (!dryRun) {
                        await collection.updateOne(
                            { _id: doc._id },
                            { $set: docCopy }
                        );
                        console.log(`  ✅ Updated document`);
                    } else {
                        console.log(`  🔍 Would update document (dry run)`);
                    }
                    migrated++;
                    
                    results.push({
                        collection: collectionName,
                        documentId: doc._id.toString(),
                        field: "multiple",
                        oldUrl: "cloudinary",
                        newUrl: "spaces",
                        success: true,
                    });
                }
            } catch (error) {
                console.error(`  ❌ Failed to process document: ${doc._id}`, error);
                failed++;
                
                results.push({
                    collection: collectionName,
                    documentId: doc._id.toString(),
                    field: "unknown",
                    oldUrl: "cloudinary",
                    newUrl: "",
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`MIGRATION COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Total documents found: ${totalFound}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Unique URLs migrated: ${urlMap.size}`);
    console.log(`${"=".repeat(60)}\n`);
    
    return { totalFound, migrated, failed, results };
}

// Export for API route
export { migrateUrl, downloadFromUrl };
