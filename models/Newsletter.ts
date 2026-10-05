import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "newsletter_subscribers";
const DB_NAME = "meronepaltv";

export interface NewsletterSubscriber {
    _id?: ObjectId;
    email: string;
    name?: string;
    isActive: boolean;
    subscribedAt: Date;
    unsubscribedAt?: Date;
    source?: string; // where they subscribed from (footer, popup, etc.)
}

export interface CreateSubscriberInput {
    email: string;
    name?: string;
    source?: string;
}

async function getCollection(): Promise<Collection<NewsletterSubscriber>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<NewsletterSubscriber>(COLLECTION_NAME);
}

export const NewsletterModel = {
    // Find all subscribers
    async findAll(activeOnly: boolean = false): Promise<WithId<NewsletterSubscriber>[]> {
        const collection = await getCollection();
        const filter = activeOnly ? { isActive: true } : {};
        return collection.find(filter).sort({ subscribedAt: -1 }).toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<NewsletterSubscriber> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by email
    async findByEmail(email: string): Promise<WithId<NewsletterSubscriber> | null> {
        const collection = await getCollection();
        return collection.findOne({ email: email.toLowerCase() });
    },

    // Subscribe (create new or reactivate)
    async subscribe(input: CreateSubscriberInput): Promise<WithId<NewsletterSubscriber>> {
        const collection = await getCollection();
        const email = input.email.toLowerCase().trim();

        // Check if already exists
        const existing = await this.findByEmail(email);

        if (existing) {
            // Reactivate if unsubscribed
            if (!existing.isActive) {
                await collection.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            isActive: true,
                            name: input.name || existing.name,
                            subscribedAt: new Date(),
                            source: input.source || existing.source,
                        },
                        $unset: { unsubscribedAt: "" }
                    }
                );
                return { ...existing, isActive: true, subscribedAt: new Date() };
            }
            // Already subscribed
            return existing;
        }

        // Create new subscriber
        const subscriber: Omit<NewsletterSubscriber, "_id"> = {
            email,
            name: input.name,
            isActive: true,
            subscribedAt: new Date(),
            source: input.source || "footer",
        };

        const result = await collection.insertOne(subscriber as NewsletterSubscriber);
        return { ...subscriber, _id: result.insertedId } as WithId<NewsletterSubscriber>;
    },

    // Unsubscribe
    async unsubscribe(email: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.updateOne(
            { email: email.toLowerCase() },
            {
                $set: {
                    isActive: false,
                    unsubscribedAt: new Date()
                }
            }
        );
        return result.modifiedCount > 0;
    },

    // Delete subscriber
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Count subscribers
    async count(activeOnly: boolean = false): Promise<number> {
        const collection = await getCollection();
        const filter = activeOnly ? { isActive: true } : {};
        return collection.countDocuments(filter);
    },

    // Paginate subscribers
    async paginate(
        page: number = 1,
        limit: number = 20,
        activeOnly: boolean = false
    ): Promise<{ subscribers: WithId<NewsletterSubscriber>[]; total: number; pages: number }> {
        const collection = await getCollection();
        const filter = activeOnly ? { isActive: true } : {};
        const skip = (page - 1) * limit;

        const [subscribers, total] = await Promise.all([
            collection.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(filter),
        ]);

        return {
            subscribers,
            total,
            pages: Math.ceil(total / limit),
        };
    },

    // Export all emails (for external email services)
    async exportEmails(activeOnly: boolean = true): Promise<string[]> {
        const subscribers = await this.findAll(activeOnly);
        return subscribers.map(s => s.email);
    },
};

export default NewsletterModel;
