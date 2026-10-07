import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { Post, CreatePostInput } from "@/lib/types";

const COLLECTION_NAME = "posts";
const DB_NAME = "meronepaltv";
const SHARE_INCREMENT = 1;

// Nepali to Roman transliteration map
const NEPALI_TO_ROMAN: Record<string, string> = {
    // Vowels
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    // Vowel signs (matras)
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
    // Consonants
    'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
    'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
    'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
    'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
    'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
    'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'wa', 'श': 'sha',
    'ष': 'sha', 'स': 'sa', 'ह': 'ha',
    // Half consonants (halant removes inherent 'a')
    '्': '',
    // Special
    'ं': 'n', 'ँ': 'n', 'ः': 'h',
    '।': '', '॥': '',
    // Numbers
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function transliterateNepali(text: string): string {
    let result = '';
    const chars = [...text]; // Handle multi-byte unicode properly

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];

        // Check if next char is halant (removes inherent vowel)
        const hasHalant = nextChar === '्';

        if (NEPALI_TO_ROMAN[char] !== undefined) {
            let romanChar = NEPALI_TO_ROMAN[char];
            // If current consonant is followed by halant, remove inherent 'a'
            if (hasHalant && romanChar.endsWith('a')) {
                romanChar = romanChar.slice(0, -1);
            }
            result += romanChar;
        } else if (/[a-zA-Z0-9]/.test(char)) {
            result += char.toLowerCase();
        } else if (char === ' ' || char === '-') {
            result += '-';
        }
        // Skip other characters
    }

    return result
        .replace(/-+/g, '-')  // Multiple hyphens to single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 60); // Limit length
}

function generateSlug(title: string): string {
    // Check if title contains non-ASCII characters (like Nepali)
    const hasNonAscii = /[^\x00-\x7F]/.test(title);

    if (hasNonAscii) {
        // Transliterate Nepali to Roman
        const transliterated = transliterateNepali(title);

        if (transliterated.length >= 5) {
            // Add short random suffix for uniqueness
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            return `${transliterated}-${randomSuffix}`;
        }

        // Fallback to date-based slug if transliteration too short
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        return `news-${dateStr}-${randomSuffix}`;
    }

    // For English titles, use traditional slug generation
    return title
        .trim()
        .toLowerCase()
        .replace(/[\s:,;]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "");
}

async function getCollection(): Promise<Collection<Post>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Post>(COLLECTION_NAME);
}

const POST_LIST_PROJECTION = {
    title: 1,
    excerpt: 1,
    slug: 1,
    author: 1,
    authorId: 1,
    category: 1,
    province: 1,
    tags: 1,
    imageUrl: 1,
    published: 1,
    isHeadline: 1,
    viewCount: 1,
    shareCount: 1,
    shareIPs: 1,
    visitorCount: 1,
    readingTime: 1,
    socialShares: 1,
    contentBlocks: 1,
    createdAt: 1,
    updatedAt: 1,
};

export const PostModel = {
    // Find all posts
    async findAll(filter: Partial<Post> = {}): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection.find(filter).project(POST_LIST_PROJECTION).sort({ createdAt: -1 }).toArray() as Promise<WithId<Post>[]>;
    },

    // Find published posts only
    async findPublished(limit?: number): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        let query = collection.find({ published: true }).project(POST_LIST_PROJECTION).sort({ createdAt: -1 });
        if (limit) {
            query = query.limit(limit);
        }
        return query.toArray() as Promise<WithId<Post>[]>;
    },

    // Find recent posts (excluding current post optionally)
    async findRecentPosts(limit: number = 5, excludeId?: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        const filter: import('mongodb').Filter<Post> = { published: true };
        if (excludeId) {
            filter._id = { $ne: new ObjectId(excludeId) };
        }
        return collection
            .find(filter)
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Find trending posts
    async findTrendingPosts(limit: number = 5, excludeId?: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        const filter: import('mongodb').Filter<Post> = { published: true };
        if (excludeId) {
            filter._id = { $ne: new ObjectId(excludeId) };
        }
        return collection
            .find(filter)
            .project(POST_LIST_PROJECTION)
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<WithId<Post>[]>;
    },


    // Find by ID
    async findById(id: string): Promise<WithId<Post> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by slug
    async findBySlug(slug: string): Promise<WithId<Post> | null> {
        const collection = await getCollection();
        return collection.findOne({ slug });
    },

    // Find by category
    async findByCategory(category: string, limit?: number): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        let query = collection
            .find({ category, published: true })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 });

        if (limit) {
            query = query.limit(limit);
        }

        return query.toArray() as Promise<WithId<Post>[]>;
    },

    // Find related posts by category
    async findRelatedPosts(category: string, limit: number = 4, excludeId?: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        const filter: import('mongodb').Filter<Post> = { category, published: true };
        if (excludeId) {
            filter._id = { $ne: new ObjectId(excludeId) };
        }
        return collection
            .find(filter)
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Find by province
    async findByProvince(province: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection
            .find({ province: province as Post["province"], published: true })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Find by tag
    async findByTag(tag: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();

        // Remove # prefix if present for consistent matching
        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;

        // Escape special regex characters
        const escapedTag = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Match tags with or without # prefix
        return collection
            .find({
                $and: [
                    { published: true },
                    {
                        $or: [
                            { tags: { $regex: new RegExp(`^${escapedTag}$`, 'i') } },
                            { tags: { $regex: new RegExp(`^#${escapedTag}$`, 'i') } }
                        ]
                    }
                ]
            })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Get all unique tags with counts
    async getAllTags(): Promise<{ tag: string; count: number }[]> {
        const collection = await getCollection();
        const result = await collection.aggregate([
            { $match: { published: true } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { tag: "$_id", count: 1, _id: 0 } }
        ]).toArray();
        return result as { tag: string; count: number }[];
    },

    // Get tags weighted by total view count of posts that use them
    // period: 'week' = last 7 days, 'month' = last 30 days, 'all' = all time (default)
    async getMostViewedTags(limit: number = 30, period: 'week' | 'month' | 'all' = 'all'): Promise<{ tag: string; count: number; totalViews: number; score: number }[]> {
        const collection = await getCollection();

        const matchStage: import('mongodb').Filter<Post> & { [key: string]: unknown } = {
            published: true,
            tags: { $exists: true, $ne: [] }
        };

        if (period === 'week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchStage.createdAt = { $gte: sevenDaysAgo };
        } else if (period === 'month') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            matchStage.createdAt = { $gte: thirtyDaysAgo };
        }

        const result = await collection.aggregate([
            { $match: matchStage },
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
                }
            },
            {
                $addFields: {
                    // Score = views (weighted 70%) + post count (weighted 30%, scaled)
                    score: {
                        $add: [
                            { $multiply: ["$totalViews", 0.7] },
                            { $multiply: ["$count", 30] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: limit },
            { $project: { tag: "$_id", count: 1, totalViews: 1, score: 1, _id: 0 } }
        ]).toArray();
        return result as { tag: string; count: number; totalViews: number; score: number }[];
    },

    // Find by author ID (for demo users to see only their posts)
    async findByAuthorId(authorId: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection
            .find({ authorId })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Find headline posts for home page
    async findHeadlines(limit: number = 5): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection
            .find({ published: true, isHeadline: true })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Create a new post
    async create(input: CreatePostInput): Promise<WithId<Post>> {
        const collection = await getCollection();
        const now = new Date();

        // Calculate reading time from main content and content blocks
        let totalContent = input.content.replace(/<[^>]*>/g, '');
        if (input.contentBlocks) {
            input.contentBlocks.forEach(block => {
                if (block.type === 'text' || block.type === 'heading' || block.type === 'quote') {
                    totalContent += ' ' + block.content.replace(/<[^>]*>/g, '');
                }
            });
        }
        const wordCount = totalContent.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        const post: Omit<Post, "_id"> = {
            title: input.title,
            content: input.content,
            contentBlocks: input.contentBlocks,
            excerpt: input.excerpt || input.content.substring(0, 150) + "...",
            slug: generateSlug(input.title),
            author: input.author || "Admin",
            authorId: input.authorId,
            category: input.category,
            province: input.province,
            tags: input.tags || [],
            imageUrl: input.imageUrl,
            published: input.published ?? false,
            isHeadline: input.isHeadline ?? false,
            viewCount: 0,
            shareCount: 0,
            visitorCount: 0,
            sharedIPs: [],
            visitorIPs: [],
            readingTime,
            socialShares: input.socialShares,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(post as Post);
        return { ...post, _id: result.insertedId } as WithId<Post>;
    },

    // Increment share count for a post based on unique IP and require location data
    async incrementShareCount(slug: string, ipAddress?: string, location?: { lat?: number; lon?: number } | null): Promise<{ incremented: boolean }> {
        const collection = await getCollection();

        if (!ipAddress || !location) {
            // Missing required data: do not increment
            return { incremented: false };
        }

        const result = await collection.updateOne(
            { slug, shareIPs: { $ne: ipAddress } },
            {
                $inc: { shareCount: SHARE_INCREMENT },
                $addToSet: { shareIPs: ipAddress }
            }
        );

        if (result.modifiedCount === 0) {
            return { incremented: false };
        }

        return { incremented: true };
    },

    // Update a post
    async update(
        id: string,
        input: Partial<CreatePostInput>
    ): Promise<WithId<Post> | null> {
        const collection = await getCollection();

        const updateData: Partial<Post> = {
            ...input,
            updatedAt: new Date(),
        };

        // Regenerate slug if title changed
        // Create updateData without slug regeneration
        // Only title and other fields are updated


        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Delete a post
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Toggle publish status
    async togglePublish(id: string): Promise<WithId<Post> | null> {
        const collection = await getCollection();
        const post = await this.findById(id);

        if (!post) return null;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    published: !post.published,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: "after" }
        );

        return result;
    },

    // Search posts
    async search(query: string): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection
            .find({
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { content: { $regex: query, $options: "i" } },
                    { tags: { $in: [new RegExp(query, "i")] } },
                ],
                published: true,
            })
            .project(POST_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Count posts
    async count(filter: Partial<Post> = {}): Promise<number> {
        const collection = await getCollection();
        return collection.countDocuments(filter);
    },

    // Paginated posts
    async paginate(
        page: number = 1,
        limit: number = 10,
        filter: import('mongodb').Filter<Post> = {}
    ): Promise<{ posts: WithId<Post>[]; total: number; pages: number }> {
        const collection = await getCollection();
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            collection.find(filter).project(POST_LIST_PROJECTION).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray() as Promise<WithId<Post>[]>,
            collection.countDocuments(filter),
        ]);

        return {
            posts,
            total,
            pages: Math.ceil(total / limit),
        };
    },

    // Paginate posts by multiple category names
    async paginateByCategoryNames(
        categoryNames: string[],
        page: number = 1,
        limit: number = 10
    ): Promise<{ posts: WithId<Post>[]; total: number; pages: number }> {
        const collection = await getCollection();
        const skip = (page - 1) * limit;

        const filter: import('mongodb').Filter<Post> = {
            category: { $in: categoryNames },
            published: true,
        };

        const [posts, total] = await Promise.all([
            collection.find(filter).project(POST_LIST_PROJECTION).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray() as Promise<WithId<Post>[]>,
            collection.countDocuments(filter),
        ]);

        return {
            posts,
            total,
            pages: Math.ceil(total / limit),
        };
    },

    async popularByCategoryNames(
        categoryNames: string[],
        limit: number = 5
    ): Promise<WithId<Post>[]> {
        const collection = await getCollection();
        return collection
            .find({ category: { $in: categoryNames }, published: true })
            .project(POST_LIST_PROJECTION)
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<WithId<Post>[]>;
    },

    // Increment view count and track unique visitors/shares by IP
    async incrementViewCount(slug: string, ipAddress?: string): Promise<void> {
        const collection = await getCollection();
        
        // If IP is provided, check whether it has already been recorded for this post
        if (ipAddress) {
            const post = await collection.findOne({ slug });
            const visitorIPs = post?.visitorIPs || [];
            const hasAlreadyVisited = visitorIPs.includes(ipAddress);
            
            // If the IP already exists, only increment the page view counter
            if (hasAlreadyVisited) {
                await collection.updateOne(
                    { slug },
                    { 
                        $inc: { 
                            viewCount: 1
                        } 
                    }
                );
            } else {
                // First time this IP is seen - increment view, visitor, and share counters
                await collection.updateOne(
                    { slug },
                    { 
                        $inc: { 
                            viewCount: 1,
                            visitorCount: 1,
                        },
                        $addToSet: { visitorIPs: ipAddress }
                    }
                );
            }
        } else {
            // Fallback: no IP provided, just increment view count
            await collection.updateOne(
                { slug },
                { 
                    $inc: { 
                        viewCount: 1
                    } 
                }
            );
        }
    },

    // Get post statistics
    async getStats(): Promise<{
        totalPosts: number;
        publishedPosts: number;
        draftPosts: number;
        headlinePosts: number;
        thisMonthPosts: number;
        thisYearPosts: number;
        totalViews: number;
        totalShares: number;
        totalVisitors: number;
    }> {
        const collection = await getCollection();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [totalPosts, publishedPosts, draftPosts, headlinePosts, thisMonthPosts, thisYearPosts, viewsResult, sharesResult, visitorsResult] = await Promise.all([
            collection.countDocuments(),
            collection.countDocuments({ published: true }),
            collection.countDocuments({ published: false }),
            collection.countDocuments({ isHeadline: true }),
            collection.countDocuments({ createdAt: { $gte: startOfMonth } }),
            collection.countDocuments({ createdAt: { $gte: startOfYear } }),
            collection.aggregate([
                { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$viewCount", 0] } } } }
            ]).toArray(),
            collection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalShares: { $sum: { $ifNull: ["$shareCount", 0] } },
                    },
                },
            ]).toArray(),
            collection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalVisitors: { $sum: { $size: { $ifNull: ["$visitorIPs", []] } } }
                    }
                }
            ]).toArray()
        ]);

        return {
            totalPosts,
            publishedPosts,
            draftPosts,
            headlinePosts,
            thisMonthPosts,
            thisYearPosts,
            totalViews: viewsResult[0]?.totalViews || 0,
            totalShares: sharesResult[0]?.totalShares || 0,
            totalVisitors: visitorsResult[0]?.totalVisitors || 0,
        };
    },

    async resetEngagementStats(): Promise<void> {
        const collection = await getCollection();
        await collection.updateMany(
            {},
            {
                $set: {
                    viewCount: 0,
                    shareCount: 0,
                    visitorCount: 0,
                    shareIPs: [],
                    visitorIPs: [],
                },
                $unset: {
                    sharedIPs: "",
                },
            }
        );
    },
};

export default PostModel;
