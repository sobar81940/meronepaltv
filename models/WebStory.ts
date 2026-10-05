import { Collection, ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "meronepaltv";

export interface StorySlide {
    id: string;
    type: "image" | "video";
    mediaUrl: string;
    text?: string;
    textPosition?: "top" | "center" | "bottom";
    textColor?: string;
    backgroundColor?: string;
    duration?: number; // in seconds, default 5
    link?: string;
    linkText?: string;
}

export interface WebStory {
    _id?: ObjectId;
    title: string;
    slug: string;
    coverImage: string;
    slides: StorySlide[];
    category?: string;
    author?: string;
    published: boolean;
    featured: boolean;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

async function getCollection(): Promise<Collection<WebStory>> {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    return db.collection<WebStory>("webstories");
}

// Generate slug from title - English friendly
function generateSlug(title: string): string {
    // Extract any English words from the title
    const englishWords = title
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII (including Nepali)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // Generate a unique suffix based on timestamp
    const timestamp = Date.now().toString(36);

    // If there are English words, use them; otherwise use 'story' prefix
    const prefix = englishWords || 'story';

    return `${prefix}-${timestamp}`;
}

const WebStoryModel = {
    // Create a new web story
    async create(data: Omit<WebStory, "_id" | "createdAt" | "updatedAt" | "viewCount">): Promise<WebStory> {
        const collection = await getCollection();

        const slug = data.slug || generateSlug(data.title);
        const webStory: Omit<WebStory, "_id"> = {
            ...data,
            slug,
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(webStory as WebStory);
        return { ...webStory, _id: result.insertedId };
    },

    // Find all web stories
    async findAll(publishedOnly: boolean = false): Promise<WebStory[]> {
        const collection = await getCollection();
        const filter = publishedOnly ? { published: true } : {};
        return collection.find(filter).sort({ createdAt: -1 }).toArray();
    },

    // Find published stories
    async findPublished(limit?: number): Promise<WebStory[]> {
        const collection = await getCollection();
        let query = collection.find({ published: true }).sort({ createdAt: -1 });
        if (limit) query = query.limit(limit);
        return query.toArray();
    },

    // Find featured stories
    async findFeatured(limit: number = 10): Promise<WebStory[]> {
        const collection = await getCollection();
        return collection
            .find({ published: true, featured: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WebStory | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by slug
    async findBySlug(slug: string): Promise<WebStory | null> {
        const collection = await getCollection();
        return collection.findOne({ slug });
    },

    // Find by category
    async findByCategory(category: string, limit?: number): Promise<WebStory[]> {
        const collection = await getCollection();
        let query = collection
            .find({ published: true, category })
            .sort({ createdAt: -1 });
        if (limit) query = query.limit(limit);
        return query.toArray();
    },

    // Update a web story
    async update(id: string, data: Partial<Omit<WebStory, "_id" | "createdAt">>): Promise<WebStory | null> {
        const collection = await getCollection();
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...data, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result;
    },

    // Delete a web story
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    },

    // Increment view count
    async incrementViewCount(slug: string): Promise<void> {
        const collection = await getCollection();
        await collection.updateOne(
            { slug },
            { $inc: { viewCount: 1 } }
        );
    },

    // Get story count
    async count(publishedOnly: boolean = false): Promise<number> {
        const collection = await getCollection();
        const filter = publishedOnly ? { published: true } : {};
        return collection.countDocuments(filter);
    },

    // Paginate stories
    async paginate(page: number = 1, limit: number = 12, publishedOnly: boolean = true): Promise<{
        items: WebStory[];
        total: number;
        pages: number;
        page: number;
    }> {
        const collection = await getCollection();
        const filter = publishedOnly ? { published: true } : {};
        const total = await collection.countDocuments(filter);
        const pages = Math.ceil(total / limit);
        const items = await collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return { items, total, pages, page };
    },
};

export default WebStoryModel;
