import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "pages";
const DB_NAME = "meronepaltv";

export interface Page {
    _id?: ObjectId;
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    published: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePageInput {
    title: string;
    slug: string;
    content?: string;
    metaTitle?: string;
    metaDescription?: string;
    published?: boolean;
    order?: number;
}

const STATIC_PAGE_SLUGS = [
    "about",
    "contact",
    "privacy-policy",
    "terms-of-service",
    "advertise",
    "careers",
    "cookies",
    "team",
];

async function getCollection(): Promise<Collection<Page>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Page>(COLLECTION_NAME);
}

export const PageModel = {
    async findAll(): Promise<WithId<Page>[]> {
        const collection = await getCollection();
        const count = await collection.countDocuments();
        if (count === 0) {
            await this.seedDefaults();
        }
        // Deduplicate by slug: keep only the most recently updated doc per slug
        const docs = await collection.aggregate<WithId<Page>>([
            { $sort: { updatedAt: -1 } },
            {
                $group: {
                    _id: "$slug",
                    doc: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { order: 1 } },
        ]).toArray();
        return docs;
    },

    async findBySlug(slug: string): Promise<WithId<Page> | null> {
        const collection = await getCollection();
        const count = await collection.countDocuments();
        if (count === 0) {
            await this.seedDefaults();
        }
        // Sort by updatedAt desc to get the most recently updated document for this slug
        const doc = await collection.find({ slug }).sort({ updatedAt: -1 }).limit(1).next();
        return doc;
    },

    async findPublished(): Promise<WithId<Page>[]> {
        const collection = await getCollection();
        const count = await collection.countDocuments();
        if (count === 0) {
            await this.seedDefaults();
        }
        // Deduplicate by slug: keep only the most recently updated published doc per slug
        const docs = await collection.aggregate<WithId<Page>>([
            { $match: { published: true } },
            { $sort: { updatedAt: -1 } },
            {
                $group: {
                    _id: "$slug",
                    doc: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { order: 1 } },
        ]).toArray();
        return docs;
    },

    async findPublishedBySlug(slug: string): Promise<WithId<Page> | null> {
        const collection = await getCollection();
        const count = await collection.countDocuments();
        if (count === 0) {
            await this.seedDefaults();
        }
        // Sort by updatedAt desc to get the most recently updated published document for this slug
        return collection.find({ slug, published: true }).sort({ updatedAt: -1 }).limit(1).next();
    },

    async findById(id: string): Promise<WithId<Page> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    async create(input: CreatePageInput): Promise<WithId<Page>> {
        const collection = await getCollection();
        const now = new Date();

        const page: Omit<Page, "_id"> = {
            title: input.title,
            slug: input.slug,
            content: input.content || "",
            metaTitle: input.metaTitle || input.title,
            metaDescription: input.metaDescription || "",
            published: input.published ?? true,
            order: input.order ?? 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(page as Page);
        return { ...page, _id: result.insertedId } as WithId<Page>;
    },

    async update(id: string, input: Partial<CreatePageInput & { content?: string }>): Promise<WithId<Page> | null> {
        const collection = await getCollection();
        const updateData: Partial<Page> = {
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

    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    async seedDefaults(): Promise<void> {
        const collection = await getCollection();
        const existing = await collection.countDocuments();
        if (existing > 0) return;

        const defaults: Omit<Page, "_id">[] = [
            {
                title: "हाम्रो बारेमा",
                slug: "about",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "हाम्रो बारेमा",
                metaDescription: "हाम्रो बारेमा जानकारी",
                published: true,
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "सम्पर्क",
                slug: "contact",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "सम्पर्क",
                metaDescription: "हामीसँग सम्पर्क गर्नुहोस्",
                published: true,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "गोपनीयता नीति",
                slug: "privacy-policy",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "गोपनीयता नीति",
                metaDescription: "गोपनीयता नीति",
                published: true,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "सेवाका शर्तहरू",
                slug: "terms-of-service",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "सेवाका शर्तहरू",
                metaDescription: "सेवाका शर्तहरू",
                published: true,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "विज्ञापन",
                slug: "advertise",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "विज्ञापन",
                metaDescription: "विज्ञापन सम्बन्धी जानकारी",
                published: true,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "करियर",
                slug: "careers",
                content: "<p>यस पृष्ठको सामग्री व्यवस्थापकद्वारा तयार गरिनेछ।</p>",
                metaTitle: "करियर",
                metaDescription: "करियर अवसरहरू",
                published: true,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await collection.insertMany(defaults);
    },
};

export default PageModel;
