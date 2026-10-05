/**
 * Rewrite stored DigitalOcean Spaces URLs to the configured Cloudflare R2
 * public URL while preserving every object key. The migration is a dry run by
 * default and updates string fields only, including URLs embedded in HTML and
 * nested arrays. BSON values such as ObjectId, Date, and Binary are untouched.
 *
 * Usage:
 *   bun run scripts/migrate-storage-urls.ts
 *   STORAGE_URL_MIGRATION_DRY_RUN=false bun run scripts/migrate-storage-urls.ts
 *
 * Required env:
 *   MONGODB_URI, R2_PUBLIC_URL
 *
 * Optional env:
 *   STORAGE_URL_MIGRATION_DATABASES  comma-separated database allow-list
 *   STORAGE_URL_MIGRATION_BATCH      bulk-write size (default: 250)
 *   STORAGE_URL_MIGRATION_DRY_RUN    "false" to write (default: true)
 */

import {
    MongoClient,
    type AnyBulkWriteOperation,
    type Document,
} from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
const DRY_RUN = process.env.STORAGE_URL_MIGRATION_DRY_RUN !== "false";
const BATCH_SIZE = Math.max(
    1,
    Number.parseInt(process.env.STORAGE_URL_MIGRATION_BATCH || "250", 10) || 250
);
const ONLY_DATABASES = (process.env.STORAGE_URL_MIGRATION_DATABASES || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

const SYSTEM_DATABASES = new Set(["admin", "config", "local"]);
const LEGACY_PREFIXES = [
    "https://dunz0.sgp1.cdn.digitaloceanspaces.com/",
    "https://dunz0.sgp1.digitaloceanspaces.com/",
    "https://sgp1.digitaloceanspaces.com/dunz0/",
    "http://dunz0.sgp1.cdn.digitaloceanspaces.com/",
    "http://dunz0.sgp1.digitaloceanspaces.com/",
    "http://sgp1.digitaloceanspaces.com/dunz0/",
];

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI must be set");
    process.exit(1);
}

if (!R2_PUBLIC_URL) {
    console.error("❌ R2_PUBLIC_URL must be set");
    process.exit(1);
}

interface RewriteResult {
    value: string;
    replacements: number;
}

interface CollectionResult {
    database: string;
    collection: string;
    documentsScanned: number;
    documentsChanged: number;
    stringsChanged: number;
    urlsChanged: number;
    modifiedDocuments: number;
    unsafePaths: number;
}

function replaceLegacyUrls(value: string): RewriteResult {
    let rewritten = value;
    let replacements = 0;

    for (const prefix of LEGACY_PREFIXES) {
        if (!rewritten.includes(prefix)) continue;
        const parts = rewritten.split(prefix);
        replacements += parts.length - 1;
        rewritten = parts.join(`${R2_PUBLIC_URL}/`);
    }

    return { value: rewritten, replacements };
}

function isTraversableObject(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== "object") return false;
    if (value instanceof Date || Buffer.isBuffer(value)) return false;
    if ("_bsontype" in value) return false;
    return true;
}

function containsLegacyUrl(value: unknown): boolean {
    if (typeof value === "string") {
        return LEGACY_PREFIXES.some((prefix) => value.includes(prefix));
    }
    if (Array.isArray(value)) return value.some(containsLegacyUrl);
    if (!isTraversableObject(value)) return false;
    return Object.values(value).some(containsLegacyUrl);
}

function collectStringUpdates(
    value: unknown,
    path: string[],
    updates: Record<string, string>,
    counters: { strings: number; urls: number; unsafePaths: number }
): void {
    if (typeof value === "string") {
        const rewritten = replaceLegacyUrls(value);
        if (rewritten.replacements > 0 && path.length > 0) {
            updates[path.join(".")] = rewritten.value;
            counters.strings++;
            counters.urls += rewritten.replacements;
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            collectStringUpdates(item, [...path, String(index)], updates, counters)
        );
        return;
    }

    if (!isTraversableObject(value)) return;

    for (const [key, nested] of Object.entries(value)) {
        // Dot notation cannot safely address literal dots or leading dollars in
        // MongoDB field names. Skip and report those rare paths instead.
        if (key.includes(".") || key.startsWith("$")) {
            if (containsLegacyUrl(nested)) counters.unsafePaths++;
            continue;
        }
        collectStringUpdates(nested, [...path, key], updates, counters);
    }
}

async function flushBatch(
    collection: ReturnType<ReturnType<MongoClient["db"]>["collection"]>,
    operations: AnyBulkWriteOperation<Document>[]
): Promise<number> {
    if (operations.length === 0) return 0;
    const result = await collection.bulkWrite(operations, { ordered: false });
    operations.length = 0;
    return result.modifiedCount;
}

async function migrateCollection(
    client: MongoClient,
    database: string,
    collectionName: string
): Promise<CollectionResult> {
    const collection = client.db(database).collection(collectionName);
    const operations: AnyBulkWriteOperation<Document>[] = [];
    const result: CollectionResult = {
        database,
        collection: collectionName,
        documentsScanned: 0,
        documentsChanged: 0,
        stringsChanged: 0,
        urlsChanged: 0,
        modifiedDocuments: 0,
        unsafePaths: 0,
    };

    for await (const document of collection.find({})) {
        result.documentsScanned++;
        const updates: Record<string, string> = {};
        const counters = { strings: 0, urls: 0, unsafePaths: 0 };
        collectStringUpdates(document, [], updates, counters);
        result.unsafePaths += counters.unsafePaths;

        if (Object.keys(updates).length === 0) continue;
        result.documentsChanged++;
        result.stringsChanged += counters.strings;
        result.urlsChanged += counters.urls;

        if (!DRY_RUN) {
            operations.push({
                updateOne: {
                    filter: { _id: document._id },
                    update: { $set: updates },
                },
            });

            if (operations.length >= BATCH_SIZE) {
                result.modifiedDocuments += await flushBatch(collection, operations);
            }
        }
    }

    if (!DRY_RUN) {
        result.modifiedDocuments += await flushBatch(collection, operations);
    }

    return result;
}

async function main(): Promise<void> {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    try {
        const listed = await client.db().admin().listDatabases();
        const databases = listed.databases
            .map((database) => database.name)
            .filter((name) => !SYSTEM_DATABASES.has(name))
            .filter((name) => ONLY_DATABASES.length === 0 || ONLY_DATABASES.includes(name))
            .sort((a, b) => a.localeCompare(b));

        console.log("");
        console.log("━━━ STORAGE URL MIGRATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`  Databases : ${databases.length}`);
        console.log(`  Target    : ${new URL(R2_PUBLIC_URL).host}`);
        console.log(`  Mode      : ${DRY_RUN ? "DRY RUN (nothing will be written)" : "LIVE UPDATE"}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const results: CollectionResult[] = [];
        for (const database of databases) {
            const collections = (
                await client.db(database).listCollections({}, { nameOnly: true }).toArray()
            )
                .filter((collection) => collection.type !== "view")
                .map((collection) => collection.name)
                .sort((a, b) => a.localeCompare(b));

            for (const collection of collections) {
                const result = await migrateCollection(client, database, collection);
                results.push(result);
                if (result.urlsChanged > 0) {
                    console.log(
                        `  ${DRY_RUN ? "→" : "✓"} ${database}.${collection}: ` +
                        `${result.urlsChanged.toLocaleString()} URL(s) in ` +
                        `${result.documentsChanged.toLocaleString()} document(s)`
                    );
                }
            }
        }

        const summary = results.reduce(
            (total, result) => ({
                documentsScanned: total.documentsScanned + result.documentsScanned,
                documentsChanged: total.documentsChanged + result.documentsChanged,
                stringsChanged: total.stringsChanged + result.stringsChanged,
                urlsChanged: total.urlsChanged + result.urlsChanged,
                modifiedDocuments: total.modifiedDocuments + result.modifiedDocuments,
                unsafePaths: total.unsafePaths + result.unsafePaths,
            }),
            {
                documentsScanned: 0,
                documentsChanged: 0,
                stringsChanged: 0,
                urlsChanged: 0,
                modifiedDocuments: 0,
                unsafePaths: 0,
            }
        );

        console.log("");
        console.log("━━━ MIGRATION SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`  Documents scanned : ${summary.documentsScanned.toLocaleString()}`);
        console.log(`  Documents matched : ${summary.documentsChanged.toLocaleString()}`);
        console.log(`  String fields      : ${summary.stringsChanged.toLocaleString()}`);
        console.log(`  URLs               : ${summary.urlsChanged.toLocaleString()}`);
        if (!DRY_RUN) {
            console.log(`  Documents modified: ${summary.modifiedDocuments.toLocaleString()}`);
        }
        console.log(`  Unsafe paths skipped: ${summary.unsafePaths.toLocaleString()}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("");

        if (summary.unsafePaths > 0) process.exitCode = 1;
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error("\n❌ Storage URL migration failed:", error);
    process.exit(1);
});
