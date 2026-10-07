/**
 * Core posts migration: MySQL `news` (parsed from the SQL dump) -> MongoDB
 * `MeroNepalTv.posts`, with images uploaded to Cloudflare R2.
 *
 * Design goals (per migration spec, Option A):
 *   - idempotent: upsert keyed on legacyId (= news.id); rerun never duplicates
 *   - image dedupe: deterministic R2 key, HeadObject skip on rerun
 *   - non-destructive: never clears posts, never touches news-portal, never
 *     modifies the dump or backup/uploads
 *   - batched: posts processed in chunks so memory stays bounded
 *   - resilient: a failing post/image is logged, not fatal
 *
 * Field mapping (news -> Post in lib/types.ts):
 *   id              -> legacyId (unique index)
 *   title           -> title
 *   content         -> content
 *   slug            -> slug
 *   language        -> language (extra field; preserved)
 *   status (1/0)    -> published (true/false)
 *   views           -> viewCount
 *   category_id     -> category (resolved categories.name)
 *   auther_id       -> author   (resolved admins.name)
 *   news_tags/tags  -> tags[]   (resolved tags.name)
 *   image           -> imageUrl (full public R2 URL)
 *   meta_title      -> metaTitle (extra; preserved)
 *   meta_description-> metaDescription (extra; preserved)
 *   is_breaking_news/show_at_slider/show_at_popular/is_approved -> preserved flags
 *   created_at      -> createdAt (original timestamp preserved)
 *   updated_at      -> updatedAt (original timestamp preserved)
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Collection, Db } from "mongodb";
import { parseDump } from "./sql-parser.ts";
import type { ParsedDump, NewsRow } from "./sql-parser.ts";
import { MigrationR2 } from "./r2.ts";
import type { MigrationEnv } from "./env.ts";
import { projectRoot } from "./env.ts";

const BATCH_SIZE = 100;

export interface MigrationOptions {
    dryRun: boolean;
    env: MigrationEnv;
    db: Db; // MeroNepalTv
    limit?: number; // optional cap for testing
}

export interface MigrationStats {
    totalNews: number;
    processed: number;
    inserted: number;
    updated: number;
    skipped: number;
    imagesUploaded: number;
    imagesReused: number; // already in R2 (dedupe)
    imagesMissing: number; // referenced in SQL but file not on disk
    postsWithoutImage: number; // news.image empty/null
    failedR2Uploads: number;
    failedPosts: number;
    categoriesResolved: number;
    categoriesMissing: number;
    authorsResolved: number;
    authorsMissing: number;
    tagsResolved: number;
    tagsMissing: number;
    imageRefsTotal: number;
    imageFilesFound: number;
    failures: { legacyId: number; reason: string }[];
}

function emptyStats(total: number): MigrationStats {
    return {
        totalNews: total,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        imagesUploaded: 0,
        imagesReused: 0,
        imagesMissing: 0,
        postsWithoutImage: 0,
        failedR2Uploads: 0,
        failedPosts: 0,
        categoriesResolved: 0,
        categoriesMissing: 0,
        authorsResolved: 0,
        authorsMissing: 0,
        tagsResolved: 0,
        tagsMissing: 0,
        imageRefsTotal: 0,
        imageFilesFound: 0,
        failures: [],
    };
}

/** Strip any directory prefix (uploads/, /uploads/, storage/, full path) -> basename. */
export function normalizeImageBasename(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let value = raw.trim();
    if (!value) return null;
    // Drop query strings / fragments defensively.
    value = value.split("?")[0].split("#")[0];
    // Normalize backslashes then take the last path segment.
    value = value.replace(/\\/g, "/");
    const name = basename(value);
    return name || null;
}

/** Parse a MySQL timestamp string ("YYYY-MM-DD HH:MM:SS") into a Date (UTC). */
export function parseSqlDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    // Treat as UTC to preserve the stored wall-clock value deterministically.
    const iso = value.replace(" ", "T") + "Z";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface MappedPost {
    legacyId: number;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    language: string | null;
    author: string;
    category: string | undefined;
    tags: string[];
    imageUrl: string | undefined;
    published: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    isBreakingNews: boolean;
    showAtSlider: boolean;
    showAtPopular: boolean;
    isApproved: boolean;
    viewCount: number;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class PostsMigrator {
    private readonly opts: MigrationOptions;
    private readonly r2: MigrationR2;
    private readonly uploadsDir: string;
    private readonly dumpPath: string;

    constructor(opts: MigrationOptions) {
        this.opts = opts;
        this.r2 = new MigrationR2(opts.env);
        const root = projectRoot();
        this.uploadsDir = join(root, "backup", "uploads");
        this.dumpPath = join(root, "backup", "mero_MeroNepalTv.sql");
    }

    get sqlDumpPath(): string {
        return this.dumpPath;
    }

    get localUploadsDir(): string {
        return this.uploadsDir;
    }

    parse(): ParsedDump {
        return parseDump(this.dumpPath);
    }

    /** Resolve relations and build the Mongo-shaped document for a news row. */
    private mapRow(row: NewsRow, dump: ParsedDump, stats: MigrationStats): MappedPost {
        // Category
        let category: string | undefined;
        if (row.category_id != null) {
            const cat = dump.categoriesById.get(row.category_id);
            if (cat?.name) {
                category = cat.name;
                stats.categoriesResolved++;
            } else {
                stats.categoriesMissing++;
            }
        } else {
            stats.categoriesMissing++;
        }

        // Author
        let author = "Admin";
        if (row.auther_id != null) {
            const admin = dump.adminsById.get(row.auther_id);
            if (admin?.name) {
                author = admin.name;
                stats.authorsResolved++;
            } else {
                stats.authorsMissing++;
            }
        } else {
            stats.authorsMissing++;
        }

        // Tags
        const tagIds = dump.tagsByNewsId.get(row.id) ?? [];
        const tags: string[] = [];
        for (const tid of tagIds) {
            const tag = dump.tagsById.get(tid);
            if (tag?.name) {
                tags.push(tag.name.trim());
                stats.tagsResolved++;
            } else {
                stats.tagsMissing++;
            }
        }

        const content = row.content ?? "";
        const excerpt = stripHtml(content).slice(0, 150);

        return {
            legacyId: row.id,
            title: row.title ?? "(untitled)",
            content,
            excerpt: excerpt ? excerpt + "..." : "",
            slug: (row.slug ?? "").trim() || `legacy-${row.id}`,
            language: row.language ?? null,
            author,
            category,
            tags,
            imageUrl: undefined, // filled after R2 upload
            published: row.status === 1,
            metaTitle: row.meta_title ?? null,
            metaDescription: row.meta_description ?? null,
            isBreakingNews: row.is_breaking_news === 1,
            showAtSlider: row.show_at_slider === 1,
            showAtPopular: row.show_at_popular === 1,
            isApproved: row.is_approved === 1,
            viewCount: row.views ?? 0,
            videoUrl: row.video_url ?? row.video ?? null,
            createdAt: parseSqlDate(row.created_at) ?? new Date(),
            updatedAt: parseSqlDate(row.updated_at) ?? parseSqlDate(row.created_at) ?? new Date(),
        };
    }

    /** Resolve + (optionally) upload the post image; returns the public URL or undefined. */
    private async handleImage(
        row: NewsRow,
        stats: MigrationStats,
    ): Promise<string | undefined> {
        const name = normalizeImageBasename(row.image);
        if (!name) {
            stats.postsWithoutImage++;
            return undefined;
        }
        stats.imageRefsTotal++;

        const localPath = join(this.uploadsDir, name);
        if (!existsSync(localPath)) {
            stats.imagesMissing++;
            console.warn(`   ⚠ image missing on disk for news ${row.id}: ${name}`);
            return undefined;
        }
        stats.imageFilesFound++;

        if (this.opts.dryRun) {
            // Don't upload during dry-run; just report it would be uploaded.
            return this.r2.publicUrlForKey(this.r2.buildKey(row.id, name));
        }

        try {
            const body = readFileSync(localPath);
            const result = await this.r2.uploadImage(row.id, name, body);
            if (result.skipped) stats.imagesReused++;
            else stats.imagesUploaded++;
            return result.url;
        } catch (err) {
            stats.failedR2Uploads++;
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`   ⚠ R2 upload failed for news ${row.id} (${name}): ${msg}`);
            return undefined;
        }
    }

    /** Upsert one post into Mongo keyed on legacyId. */
    private async upsertPost(
        collection: Collection,
        mapped: MappedPost,
    ): Promise<"inserted" | "updated"> {
        const now = new Date();
        const wordCount = stripHtml(mapped.content).split(/\s+/).filter(Boolean).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        // $set holds every migratable field (safe to re-apply on rerun).
        const setDoc: Record<string, unknown> = {
            legacyId: mapped.legacyId,
            legacySource: "mysql:news",
            title: mapped.title,
            content: mapped.content,
            excerpt: mapped.excerpt,
            slug: mapped.slug,
            language: mapped.language,
            author: mapped.author,
            category: mapped.category,
            tags: mapped.tags,
            published: mapped.published,
            metaTitle: mapped.metaTitle,
            metaDescription: mapped.metaDescription,
            isBreakingNews: mapped.isBreakingNews,
            showAtSlider: mapped.showAtSlider,
            showAtPopular: mapped.showAtPopular,
            isApproved: mapped.isApproved,
            viewCount: mapped.viewCount,
            videoUrl: mapped.videoUrl,
            readingTime,
            createdAt: mapped.createdAt,
            updatedAt: mapped.updatedAt,
            migratedAt: now,
        };
        // Only set imageUrl when we actually have one, so a transient R2 failure
        // on rerun doesn't wipe a previously-migrated URL.
        if (mapped.imageUrl) {
            setDoc.imageUrl = mapped.imageUrl;
        }

        // Defaults applied only on first insert (never overwrite live app state).
        const setOnInsert: Record<string, unknown> = {
            isHeadline: false,
            shareCount: 500,
            visitorCount: 0,
            sharedIPs: [],
            visitorIPs: [],
        };

        try {
            const result = await collection.updateOne(
                { legacyId: mapped.legacyId },
                { $set: setDoc, $setOnInsert: setOnInsert },
                { upsert: true },
            );
            return result.upsertedCount > 0 ? "inserted" : "updated";
        } catch (err) {
            // The live app enforces a unique index on `slug`. The legacy data
            // contains duplicate slugs across different news rows. When a slug
            // collides, make this post's slug deterministically unique by
            // appending its legacyId, then retry. This keeps the upsert
            // idempotent (same suffix every rerun) without touching the post
            // that already owns the base slug.
            const e = err as { code?: number; message?: string };
            const isDupSlug =
                e.code === 11000 && /index:\s*slug/.test(e.message ?? "");
            if (!isDupSlug) throw err;

            setDoc.slug = `${mapped.slug}-${mapped.legacyId}`;
            const retry = await collection.updateOne(
                { legacyId: mapped.legacyId },
                { $set: setDoc, $setOnInsert: setOnInsert },
                { upsert: true },
            );
            return retry.upsertedCount > 0 ? "inserted" : "updated";
        }
    }

    /** Ensure the unique index on legacyId exists (idempotent). */
    async ensureIndexes(collection: Collection): Promise<void> {
        // Unique only among documents that have legacyId, so existing non-migrated
        // posts (if any) are unaffected.
        await collection.createIndex(
            { legacyId: 1 },
            { unique: true, partialFilterExpression: { legacyId: { $exists: true } }, name: "legacyId_unique" },
        );
    }

    /** Run the full migration (or dry-run). */
    async run(): Promise<MigrationStats> {
        const dump = this.parse();
        let newsRows = dump.news;
        if (this.opts.limit && this.opts.limit > 0) {
            newsRows = newsRows.slice(0, this.opts.limit);
        }

        const stats = emptyStats(newsRows.length);
        const collection = this.opts.db.collection("posts");

        if (!this.opts.dryRun) {
            await this.ensureIndexes(collection);
        }

        for (let start = 0; start < newsRows.length; start += BATCH_SIZE) {
            const batch = newsRows.slice(start, start + BATCH_SIZE);
            for (const row of batch) {
                try {
                    const mapped = this.mapRow(row, dump, stats);
                    mapped.imageUrl = await this.handleImage(row, stats);

                    if (this.opts.dryRun) {
                        stats.skipped++;
                    } else {
                        const outcome = await this.upsertPost(collection, mapped);
                        if (outcome === "inserted") stats.inserted++;
                        else stats.updated++;
                    }
                } catch (err) {
                    stats.failedPosts++;
                    const msg = err instanceof Error ? err.message : String(err);
                    stats.failures.push({ legacyId: row.id, reason: msg });
                    console.warn(`   ✗ failed news ${row.id}: ${msg}`);
                }
                stats.processed++;
            }
            const mode = this.opts.dryRun ? "validated" : "migrated";
            console.log(`   ...${mode} ${Math.min(start + BATCH_SIZE, newsRows.length)}/${newsRows.length}`);
        }

        return stats;
    }
}

export function printStats(stats: MigrationStats, dryRun: boolean): void {
    console.log("\n==================== SUMMARY ====================");
    console.log(`   mode:                 ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
    console.log(`   total news parsed:    ${stats.totalNews}`);
    console.log(`   processed:            ${stats.processed}`);
    if (!dryRun) {
        console.log(`   inserted:             ${stats.inserted}`);
        console.log(`   updated:              ${stats.updated}`);
    } else {
        console.log(`   would upsert:         ${stats.skipped}`);
    }
    console.log(`   categories resolved:  ${stats.categoriesResolved}`);
    console.log(`   categories missing:   ${stats.categoriesMissing}`);
    console.log(`   authors resolved:     ${stats.authorsResolved}`);
    console.log(`   authors missing:      ${stats.authorsMissing}`);
    console.log(`   tags resolved:        ${stats.tagsResolved}`);
    console.log(`   tags missing:         ${stats.tagsMissing}`);
    console.log(`   image references:     ${stats.imageRefsTotal}`);
    console.log(`   image files found:    ${stats.imageFilesFound}`);
    console.log(`   images uploaded:      ${stats.imagesUploaded}`);
    console.log(`   images reused (R2):   ${stats.imagesReused}`);
    console.log(`   images missing:       ${stats.imagesMissing}`);
    console.log(`   posts without image:  ${stats.postsWithoutImage}`);
    console.log(`   failed R2 uploads:    ${stats.failedR2Uploads}`);
    console.log(`   failed posts:         ${stats.failedPosts}`);
    if (stats.failures.length) {
        console.log("   --- failures ---");
        for (const f of stats.failures.slice(0, 20)) {
            console.log(`     legacyId ${f.legacyId}: ${f.reason}`);
        }
        if (stats.failures.length > 20) {
            console.log(`     ...and ${stats.failures.length - 20} more`);
        }
    }
    console.log("=================================================\n");
}
