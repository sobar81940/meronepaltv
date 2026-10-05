import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "gallery";
const DB_NAME = "meronepaltv";

export type MediaType = "image" | "video";
export type VideoSource = "upload" | "youtube";

export interface GalleryItem {
    _id?: ObjectId;
    title: string;
    description?: string;
    type: MediaType;
    url: string;
    thumbnailUrl?: string;
    publicId: string;
    category?: string;
    tags: string[];
    width?: number;
    height?: number;
    duration?: number; // For videos, in seconds
    size?: number; // File size in bytes
    videoSource?: VideoSource; // "upload" or "youtube"
    youtubeId?: string; // YouTube video ID for embedded videos
    isPublished?: boolean; // true = visible in public gallery; false = draft/hidden
    showOnHome?: boolean; // true = also show in the homepage gallery section
    createdAt: Date;
    updatedAt: Date;
}

// Public-visibility filter: only items explicitly published through the admin
// gallery. Legacy auto-uploaded records (post images, logos, nav graphics, etc.)
// were created with the "auto-uploaded" tag and no isPublished flag, so they are
// excluded here and never leak into the public gallery.
const PUBLISHED_FILTER = {
    isPublished: true,
    tags: { $ne: "auto-uploaded" },
} as const;

const HOME_FILTER = {
    isPublished: true,
    showOnHome: true,
    tags: { $ne: "auto-uploaded" },
} as const;

// Admin gallery filter: shows every item created through /admin/gallery,
// including drafts/unpublished ones, but still excludes auto-uploaded records
// (post images, logos, nav graphics, ads) that were never meant for the gallery.
const ADMIN_FILTER = {
    tags: { $ne: "auto-uploaded" },
} as const;

export interface CreateGalleryInput {
    title: string;
    description?: string;
    type: MediaType;
    url: string;
    thumbnailUrl?: string;
    publicId: string;
    category?: string;
    tags?: string[];
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    videoSource?: VideoSource;
    youtubeId?: string;
    isPublished?: boolean;
    showOnHome?: boolean;
}

async function getCollection(): Promise<Collection<GalleryItem>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<GalleryItem>(COLLECTION_NAME);
}

export const GalleryModel = {
    // Find all gallery items
    async findAll(type?: MediaType): Promise<WithId<GalleryItem>[]> {
        const collection = await getCollection();
        const filter = type ? { type } : {};
        return collection.find(filter).sort({ createdAt: -1 }).toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<GalleryItem> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Paginated results.
    // includeUnpublished=true is for the admin panel (sees drafts + everything);
    // the default (false) is the public filter used by the public gallery page.
    async paginate(
        page: number = 1,
        limit: number = 20,
        type?: MediaType,
        includeUnpublished: boolean = false
    ): Promise<{ items: WithId<GalleryItem>[]; total: number; pages: number }> {
        const collection = await getCollection();
        const filter: Record<string, unknown> = {
            ...(type ? { type } : {}),
            ...(includeUnpublished ? ADMIN_FILTER : PUBLISHED_FILTER),
        };
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(filter),
        ]);

        return {
            items,
            total,
            pages: Math.ceil(total / limit),
        };
    },

    // Create a new gallery item
    async create(input: CreateGalleryInput): Promise<WithId<GalleryItem>> {
        const collection = await getCollection();
        const now = new Date();

        const item: Omit<GalleryItem, "_id"> = {
            title: input.title,
            description: input.description,
            type: input.type,
            url: input.url,
            thumbnailUrl: input.thumbnailUrl,
            publicId: input.publicId,
            category: input.category,
            tags: input.tags || [],
            width: input.width,
            height: input.height,
            duration: input.duration,
            size: input.size,
            videoSource: input.videoSource,
            youtubeId: input.youtubeId,
            // Items created through the admin gallery default to published and
            // visible on home unless the caller explicitly sets otherwise.
            isPublished: input.isPublished ?? true,
            showOnHome: input.showOnHome ?? true,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(item as GalleryItem);
        return { ...item, _id: result.insertedId } as WithId<GalleryItem>;
    },

    // Update a gallery item
    async update(
        id: string,
        input: Partial<CreateGalleryInput>
    ): Promise<WithId<GalleryItem> | null> {
        const collection = await getCollection();

        const updateData: Partial<GalleryItem> = {
            ...input,
            updatedAt: new Date(),
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key as keyof typeof updateData] === undefined) {
                delete updateData[key as keyof typeof updateData];
            }
        });

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Delete a gallery item
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Count items (public: published only unless includeUnpublished)
    async count(type?: MediaType, includeUnpublished: boolean = false): Promise<number> {
        const collection = await getCollection();
        const filter: Record<string, unknown> = {
            ...(type ? { type } : {}),
            ...(includeUnpublished ? ADMIN_FILTER : PUBLISHED_FILTER),
        };
        return collection.countDocuments(filter);
    },

    // Find by category (public: published only; admin: all gallery items minus auto-uploaded)
    async findByCategory(category: string, includeUnpublished: boolean = false): Promise<WithId<GalleryItem>[]> {
        const collection = await getCollection();
        const filter: Record<string, unknown> = {
            category,
            ...(includeUnpublished ? ADMIN_FILTER : PUBLISHED_FILTER),
        };
        return collection.find(filter).sort({ createdAt: -1 }).toArray();
    },

    // Search by title or tags.
    // Admin search (includeUnpublished=true) sees drafts too but still excludes
    // auto-uploaded records; public search is restricted to published items.
    async search(query: string, includeUnpublished: boolean = false): Promise<WithId<GalleryItem>[]> {
        const collection = await getCollection();
        const textMatch = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { tags: { $in: [new RegExp(query, "i")] } },
            ],
        };
        const filter: Record<string, unknown> = includeUnpublished
            ? { $and: [textMatch, ADMIN_FILTER] }
            : { $and: [textMatch, PUBLISHED_FILTER] };
        return collection.find(filter).sort({ createdAt: -1 }).toArray();
    },

    // Find items grouped by category — used by the homepage gallery section.
    // Only items that are published AND marked showOnHome are returned, so
    // drafts and non-gallery R2 uploads never appear on the home page.
    async findGroupedByCategory(type?: MediaType, limit: number = 6): Promise<Record<string, WithId<GalleryItem>[]>> {
        const collection = await getCollection();
        const filter: Record<string, unknown> = {
            ...(type ? { type } : {}),
            ...HOME_FILTER,
        };

        const items = await collection.find(filter).sort({ createdAt: -1 }).toArray();

        // Group by category
        const grouped: Record<string, WithId<GalleryItem>[]> = {};
        for (const item of items) {
            const category = item.category || "uncategorized";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            if (grouped[category].length < limit) {
                grouped[category].push(item);
            }
        }

        return grouped;
    },

    // Get recent items for home page
    async findRecentByType(type: MediaType, limit: number = 12): Promise<WithId<GalleryItem>[]> {
        const collection = await getCollection();
        return collection
            .find({ type })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    },
};

export default GalleryModel;
