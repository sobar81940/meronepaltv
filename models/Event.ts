import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "events";
const DB_NAME = "meronepaltv";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type EventCategory = "conference" | "seminar" | "workshop" | "festival" | "sports" | "cultural" | "political" | "religious" | "other";

export interface EventLocation {
    address: string;
    city: string;
    province?: string;
    country: string;
    lat?: number;
    lng?: number;
    googleMapsUrl?: string;
}

export interface Event {
    _id?: ObjectId;
    title: string;
    slug: string;
    description: string;
    shortDescription?: string;
    imageUrl: string;
    category: EventCategory;
    status: EventStatus;
    location: EventLocation;
    startDate: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    organizer: string;
    organizerContact?: string;
    organizerEmail?: string;
    ticketUrl?: string;
    isFeatured: boolean;
    isPublished: boolean;
    registrationRequired: boolean;
    maxAttendees?: number;
    currentAttendees: number;
    tags: string[];
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEventInput {
    title: string;
    description: string;
    shortDescription?: string;
    imageUrl: string;
    category: EventCategory;
    status?: EventStatus;
    location: EventLocation;
    startDate: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    organizer: string;
    organizerContact?: string;
    organizerEmail?: string;
    ticketUrl?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    registrationRequired?: boolean;
    maxAttendees?: number;
    tags?: string[];
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\u0900-\u097F\w\s-]/g, '') // Keep Nepali characters, words, spaces, hyphens
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .concat('-', Date.now().toString(36));
}

async function getCollection(): Promise<Collection<Event>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Event>(COLLECTION_NAME);
}

export const EventModel = {
    // Find all events
    async findAll(options?: {
        status?: EventStatus;
        category?: EventCategory;
        featured?: boolean;
        published?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<WithId<Event>[]> {
        const collection = await getCollection();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (options?.status) filter.status = options.status;
        if (options?.category) filter.category = options.category;
        if (options?.featured !== undefined) filter.isFeatured = options.featured;
        if (options?.published !== undefined) filter.isPublished = options.published;

        let query = collection.find(filter).sort({ startDate: 1, createdAt: -1 });

        if (options?.skip) query = query.skip(options.skip);
        if (options?.limit) query = query.limit(options.limit);

        return query.toArray();
    },

    // Find upcoming events
    async findUpcoming(limit: number = 10): Promise<WithId<Event>[]> {
        const collection = await getCollection();
        const now = new Date();
        return collection
            .find({
                isPublished: true,
                startDate: { $gte: now },
                status: { $in: ["upcoming", "ongoing"] }
            })
            .sort({ startDate: 1 })
            .limit(limit)
            .toArray();
    },

    // Find featured events
    async findFeatured(limit: number = 5): Promise<WithId<Event>[]> {
        const collection = await getCollection();
        return collection
            .find({
                isPublished: true,
                isFeatured: true,
                status: { $in: ["upcoming", "ongoing"] }
            })
            .sort({ startDate: 1 })
            .limit(limit)
            .toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<Event> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by slug
    async findBySlug(slug: string): Promise<WithId<Event> | null> {
        const collection = await getCollection();
        return collection.findOne({ slug });
    },

    // Create new event
    async create(input: CreateEventInput): Promise<WithId<Event>> {
        const collection = await getCollection();
        const now = new Date();

        const event: Omit<Event, "_id"> = {
            title: input.title,
            slug: generateSlug(input.title),
            description: input.description,
            shortDescription: input.shortDescription,
            imageUrl: input.imageUrl,
            category: input.category,
            status: input.status ?? "upcoming",
            location: input.location,
            startDate: input.startDate,
            endDate: input.endDate,
            startTime: input.startTime,
            endTime: input.endTime,
            organizer: input.organizer,
            organizerContact: input.organizerContact,
            organizerEmail: input.organizerEmail,
            ticketUrl: input.ticketUrl,
            isFeatured: input.isFeatured ?? false,
            isPublished: input.isPublished ?? false,
            registrationRequired: input.registrationRequired ?? false,
            maxAttendees: input.maxAttendees,
            currentAttendees: 0,
            tags: input.tags ?? [],
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(event as Event);
        return { ...event, _id: result.insertedId } as WithId<Event>;
    },

    // Update event
    async update(
        id: string,
        input: Partial<CreateEventInput>
    ): Promise<WithId<Event> | null> {
        const collection = await getCollection();

        const updateData: Partial<Event> = {
            ...input,
            updatedAt: new Date(),
        };

        // Regenerate slug if title changed
        if (input.title) {
            updateData.slug = generateSlug(input.title);
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Delete event
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Increment view count
    async incrementViewCount(id: string): Promise<void> {
        const collection = await getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { viewCount: 1 } }
        );
    },

    // Toggle featured
    async toggleFeatured(id: string): Promise<WithId<Event> | null> {
        const collection = await getCollection();
        const event = await this.findById(id);
        if (!event) return null;

        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isFeatured: !event.isFeatured, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },

    // Toggle published
    async togglePublished(id: string): Promise<WithId<Event> | null> {
        const collection = await getCollection();
        const event = await this.findById(id);
        if (!event) return null;

        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isPublished: !event.isPublished, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },

    // Update status
    async updateStatus(id: string, status: EventStatus): Promise<WithId<Event> | null> {
        const collection = await getCollection();
        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },

    // Search events
    async search(query: string, limit: number = 20): Promise<WithId<Event>[]> {
        const collection = await getCollection();
        return collection
            .find({
                isPublished: true,
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                    { "location.city": { $regex: query, $options: "i" } },
                    { tags: { $in: [new RegExp(query, "i")] } },
                ]
            })
            .sort({ startDate: 1 })
            .limit(limit)
            .toArray();
    },

    // Get events by location (within radius using lat/lng)
    async findByLocation(
        lat: number,
        lng: number,
        radiusKm: number = 50,
        limit: number = 20
    ): Promise<WithId<Event>[]> {
        const collection = await getCollection();
        // Simple distance filtering (for more accurate results, use MongoDB geospatial queries)
        // This is a basic implementation
        return collection
            .find({
                isPublished: true,
                "location.lat": { $exists: true },
                "location.lng": { $exists: true },
            })
            .limit(limit * 5) // Fetch more to filter
            .toArray()
            .then(events => {
                return events.filter(event => {
                    if (!event.location.lat || !event.location.lng) return false;
                    const distance = this.calculateDistance(
                        lat, lng,
                        event.location.lat, event.location.lng
                    );
                    return distance <= radiusKm;
                }).slice(0, limit);
            });
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
};

export default EventModel;
