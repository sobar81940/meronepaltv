import { ObjectId, Collection, WithId, Filter } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "advertisements";
const DB_NAME = "meronepaltv";

export type AdPosition =
    | "home4"
    | "home5"
    | "home6"
    | "home7"
    | "home8"
    | "home9"
    | "top-leaderboard"
    | "header-banner"
    | "sidebar-top"
    | "sidebar-bottom"
    | "in-article"
    | "footer-banner"
    | "popup"
    | "between-posts"
    | "home1"
    | "home2"
    | "home3"
    | "headline-1"
    | "headline-2"
    | "headline-3";

export interface Advertisement {
    _id?: ObjectId;
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: AdPosition; // Legacy single position
    positions?: AdPosition[]; // New: multiple positions
    isActive: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    clicks: number;
    impressions: number;
    priority: number; // Higher priority = shown first
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAdInput {
    title: string;
    imageUrl: string;
    linkUrl: string;
    position?: AdPosition;
    positions?: AdPosition[];
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
}

async function getCollection(): Promise<Collection<Advertisement>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Advertisement>(COLLECTION_NAME);
}

export const AdvertisementModel = {
    // Find all ads
    async findAll(): Promise<WithId<Advertisement>[]> {
        const collection = await getCollection();
        return collection.find({}).sort({ priority: -1, createdAt: -1 }).toArray();
    },

    // Find active ads
    async findActive(): Promise<WithId<Advertisement>[]> {
        const collection = await getCollection();
        const now = new Date();
        const filter: Filter<Advertisement> = {
            isActive: true,
            $or: [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $and: [
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        };
        return collection
            .find(filter)
            .sort({ priority: -1, createdAt: -1 })
            .toArray();
    },

    // Find by position (checks both legacy position field and new positions array)
    async findByPosition(position: AdPosition): Promise<WithId<Advertisement>[]> {
        const collection = await getCollection();
        const now = new Date();
        const filter: Filter<Advertisement> = {
            $or: [
                { position: position },
                { positions: position }
            ],
            isActive: true,
            $and: [
                {
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: null },
                        { startDate: { $lte: now } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        };
        return collection
            .find(filter)
            .sort({ priority: -1 })
            .toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<Advertisement> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Create new ad
    async create(input: CreateAdInput): Promise<WithId<Advertisement>> {
        const collection = await getCollection();
        const now = new Date();

        const ad: Omit<Advertisement, "_id"> = {
            title: input.title,
            imageUrl: input.imageUrl,
            linkUrl: input.linkUrl,
            position: input.position || (input.positions ? input.positions[0] : "sidebar-top"),
            positions: input.positions,
            isActive: input.isActive ?? false,
            startDate: input.startDate,
            endDate: input.endDate,
            priority: input.priority ?? 0,
            clicks: 0,
            impressions: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(ad as Advertisement);
        return { ...ad, _id: result.insertedId } as WithId<Advertisement>;
    },

    // Update ad
    async update(
        id: string,
        input: Partial<CreateAdInput>
    ): Promise<WithId<Advertisement> | null> {
        const collection = await getCollection();

        const updateData: Partial<Advertisement> = {
            ...input,
            updatedAt: new Date(),
        };

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Delete ad
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Record click
    async recordClick(id: string): Promise<void> {
        const collection = await getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { clicks: 1 } }
        );
    },

    // Record impression
    async recordImpression(id: string): Promise<void> {
        const collection = await getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { impressions: 1 } }
        );
    },

    // Toggle active status
    async toggleActive(id: string): Promise<WithId<Advertisement> | null> {
        const collection = await getCollection();
        const ad = await this.findById(id);
        if (!ad) return null;

        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isActive: !ad.isActive, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },
};

export default AdvertisementModel;
