import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "celebrities";
const DB_NAME = "meronepaltv";

export type CelebrityCategory = "actor" | "singer" | "musician" | "politician" | "sports" | "writer" | "business" | "social" | "other";

export interface SocialLinks {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
}

export interface FilmEntry {
    title: string;
    year?: string;
    role?: string; // e.g., "Lead Actor", "Supporting"
}

export interface VideoEntry {
    youtubeId: string;
    title?: string;
}

export interface Celebrity {
    _id?: ObjectId;
    name: string;
    slug: string;
    title: string; // e.g., "Actor", "Singer", "Politician"
    bio: string;
    shortBio?: string;
    imageUrl: string;
    coverImageUrl?: string;
    category: CelebrityCategory;
    birthDate?: Date;
    birthPlace?: string;
    nationality?: string;
    knownFor?: string[]; // Notable works or achievements
    awards?: string[];
    filmography?: FilmEntry[]; // Films/movies
    videos?: VideoEntry[]; // YouTube videos
    socialLinks?: SocialLinks;
    isFeatured: boolean;
    isPublished: boolean;
    order: number; // For sorting on homepage
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCelebrityInput {
    name: string;
    title: string;
    bio: string;
    shortBio?: string;
    imageUrl: string;
    coverImageUrl?: string;
    category: CelebrityCategory;
    birthDate?: Date;
    birthPlace?: string;
    nationality?: string;
    knownFor?: string[];
    awards?: string[];
    filmography?: FilmEntry[];
    videos?: VideoEntry[];
    socialLinks?: SocialLinks;
    isFeatured?: boolean;
    isPublished?: boolean;
    order?: number;
}

// Nepali to Roman transliteration for slug generation
const NEPALI_TO_ROMAN: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
    'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
    'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
    'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
    'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
    'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
    'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'wa', 'श': 'sha',
    'ष': 'sha', 'स': 'sa', 'ह': 'ha',
    '्': '',
    'ं': 'n', 'ँ': 'n', 'ः': 'h',
    '।': '', '॥': '',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function transliterateNepali(text: string): string {
    let result = '';
    const chars = [...text];

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];
        const hasHalant = nextChar === '्';

        if (NEPALI_TO_ROMAN[char] !== undefined) {
            let romanChar = NEPALI_TO_ROMAN[char];
            if (hasHalant && romanChar.endsWith('a')) {
                romanChar = romanChar.slice(0, -1);
            }
            result += romanChar;
        } else if (/[a-zA-Z0-9]/.test(char)) {
            result += char.toLowerCase();
        } else if (char === ' ' || char === '-') {
            result += '-';
        }
    }

    return result
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

function generateSlug(name: string): string {
    const hasNonAscii = /[^\x00-\x7F]/.test(name);

    if (hasNonAscii) {
        const transliterated = transliterateNepali(name);
        if (transliterated.length >= 3) {
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            return `${transliterated}-${randomSuffix}`;
        }
    }

    // For English names
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${randomSuffix}`;
}

async function getCollection(): Promise<Collection<Celebrity>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Celebrity>(COLLECTION_NAME);
}

export const CelebrityModel = {
    // Find all celebrities
    async findAll(options?: {
        category?: CelebrityCategory;
        featured?: boolean;
        published?: boolean;
        limit?: number;
        skip?: number;
    }): Promise<WithId<Celebrity>[]> {
        const collection = await getCollection();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (options?.category) filter.category = options.category;
        if (options?.featured !== undefined) filter.isFeatured = options.featured;
        if (options?.published !== undefined) filter.isPublished = options.published;

        let query = collection.find(filter).sort({ order: 1, createdAt: -1 });

        if (options?.skip) query = query.skip(options.skip);
        if (options?.limit) query = query.limit(options.limit);

        return query.toArray();
    },

    // Find published celebrities for frontend
    async findPublished(limit: number = 10): Promise<WithId<Celebrity>[]> {
        const collection = await getCollection();
        return collection
            .find({ isPublished: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .toArray();
    },

    // Find featured celebrities
    async findFeatured(limit: number = 6): Promise<WithId<Celebrity>[]> {
        const collection = await getCollection();
        return collection
            .find({ isPublished: true, isFeatured: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<Celebrity> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by slug
    async findBySlug(slug: string): Promise<WithId<Celebrity> | null> {
        const collection = await getCollection();
        return collection.findOne({ slug });
    },

    // Find by category
    async findByCategory(category: CelebrityCategory, limit: number = 10): Promise<WithId<Celebrity>[]> {
        const collection = await getCollection();
        return collection
            .find({ isPublished: true, category })
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .toArray();
    },

    // Create new celebrity
    async create(input: CreateCelebrityInput): Promise<WithId<Celebrity>> {
        const collection = await getCollection();
        const now = new Date();

        const celebrity: Omit<Celebrity, "_id"> = {
            name: input.name,
            slug: generateSlug(input.name),
            title: input.title,
            bio: input.bio,
            shortBio: input.shortBio,
            imageUrl: input.imageUrl,
            coverImageUrl: input.coverImageUrl,
            category: input.category,
            birthDate: input.birthDate,
            birthPlace: input.birthPlace,
            nationality: input.nationality,
            knownFor: input.knownFor ?? [],
            awards: input.awards ?? [],
            filmography: input.filmography ?? [],
            videos: input.videos ?? [],
            socialLinks: input.socialLinks ?? {},
            isFeatured: input.isFeatured ?? false,
            isPublished: input.isPublished ?? false,
            order: input.order ?? 0,
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(celebrity as Celebrity);
        return { ...celebrity, _id: result.insertedId } as WithId<Celebrity>;
    },

    // Update celebrity
    async update(
        id: string,
        input: Partial<CreateCelebrityInput> & { slug?: string }
    ): Promise<WithId<Celebrity> | null> {
        const collection = await getCollection();

        // Explicitly exclude _id and createdAt - keep slug if provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { _id, createdAt, ...cleanInput } = input as any;

        const updateData: Partial<Celebrity> = {
            ...cleanInput,
            updatedAt: new Date(),
        };

        // Only update slug if explicitly provided in input
        // Don't regenerate slug when name changes - keep existing slug for stable URLs
        if (input.slug) {
            updateData.slug = input.slug;
        } else {
            // Remove slug from update data if not provided - keep existing
            delete updateData.slug;
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Delete celebrity
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Toggle featured
    async toggleFeatured(id: string): Promise<WithId<Celebrity> | null> {
        const collection = await getCollection();
        const celebrity = await this.findById(id);
        if (!celebrity) return null;

        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isFeatured: !celebrity.isFeatured, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },

    // Toggle published
    async togglePublished(id: string): Promise<WithId<Celebrity> | null> {
        const collection = await getCollection();
        const celebrity = await this.findById(id);
        if (!celebrity) return null;

        return collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { isPublished: !celebrity.isPublished, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    },

    // Increment view count
    async incrementViewCount(id: string): Promise<void> {
        const collection = await getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { viewCount: 1 } }
        );
    },

    // Search celebrities
    async search(query: string, limit: number = 20): Promise<WithId<Celebrity>[]> {
        const collection = await getCollection();
        return collection
            .find({
                isPublished: true,
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { title: { $regex: query, $options: "i" } },
                    { bio: { $regex: query, $options: "i" } },
                    { knownFor: { $in: [new RegExp(query, "i")] } },
                ]
            })
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .toArray();
    },

    // Get count
    async count(filter: Partial<Celebrity> = {}): Promise<number> {
        const collection = await getCollection();
        return collection.countDocuments(filter);
    },
};

export default CelebrityModel;
