import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { nepaliToRoman } from "@/lib/utils";

const COLLECTION_NAME = "categories";
const DB_NAME = "meronepaltv";

export interface Category {
    _id?: ObjectId;
    name: string;
    nameNe?: string;
    nameEn?: string;
    slug: string;
    description?: string;
    color?: string;
    parentId?: ObjectId | null; // Reference to parent category for subcategories
    createdAt: Date;
    updatedAt: Date;
}

// Extended type for hierarchical display
export interface CategoryWithChildren extends WithId<Category> {
    children?: CategoryWithChildren[];
}

export interface CreateCategoryInput {
    name?: string;
    nameNe?: string;
    nameEn?: string;
    slug?: string; // Optional custom slug - if not provided, auto-generated
    description?: string;
    color?: string;
    parentId?: string | null; // Parent category ID for creating subcategories
}

function generateSlug(name: string): string {
    // Check if name contains non-ASCII characters (like Nepali)
    const hasNonAscii = /[^\x00-\x7F]/.test(name);

    if (hasNonAscii) {
        // For Nepali/non-ASCII names, convert to Roman transliteration
        return nepaliToRoman(name);
    }

    // For English names, use traditional slug generation
    return name
        .trim()
        .toLowerCase()
        // Replace spaces and common separators with hyphens
        .replace(/[\s:,;]+/g, "-")
        // Remove special characters, keep only letters, numbers, hyphens
        .replace(/[^a-z0-9-]/g, "")
        // Replace multiple hyphens with single hyphen
        .replace(/-+/g, "-")
        // Remove leading/trailing hyphens
        .replace(/(^-|-$)/g, "");
}

async function getCollection(): Promise<Collection<Category>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<Category>(COLLECTION_NAME);
}

export const CategoryModel = {
    // Find all categories
    async findAll(): Promise<WithId<Category>[]> {
        const collection = await getCollection();
        return collection.find({}).sort({ name: 1 }).toArray();
    },

    // Find by ID
    async findById(id: string): Promise<WithId<Category> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find by slug
    async findBySlug(slug: string): Promise<WithId<Category> | null> {
        const collection = await getCollection();
        return collection.findOne({ slug });
    },

    // Find by name (used to resolve category links from post.category)
    async findByName(name: string): Promise<WithId<Category> | null> {
        const collection = await getCollection();
        return collection.findOne({ name });
    },

    // Create a new category
    async create(input: CreateCategoryInput): Promise<WithId<Category>> {
        const collection = await getCollection();
        const now = new Date();
        const name = input.nameNe || input.nameEn || input.name || "";

        const category: Omit<Category, "_id"> = {
            name,
            nameNe: input.nameNe || (input.name && /[^\x00-\x7F]/.test(input.name) ? input.name : undefined),
            nameEn: input.nameEn || (input.name && !/[^\x00-\x7F]/.test(input.name) ? input.name : undefined),
            slug: input.slug || generateSlug(name),
            description: input.description,
            color: input.color || "#3B82F6",
            parentId: input.parentId ? new ObjectId(input.parentId) : null,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(category as Category);
        return { ...category, _id: result.insertedId } as WithId<Category>;
    },

    // Update a category
    async update(
        id: string,
        input: Partial<CreateCategoryInput>
    ): Promise<WithId<Category> | null> {
        const collection = await getCollection();

        // Build update data, converting parentId string to ObjectId
        const updateData: Partial<Category> = {
            name: input.nameNe || input.nameEn || input.name,
            nameNe: input.nameNe,
            nameEn: input.nameEn,
            description: input.description,
            color: input.color,
            updatedAt: new Date(),
        };

        // Handle parentId conversion
        if (input.parentId !== undefined) {
            updateData.parentId = input.parentId ? new ObjectId(input.parentId) : null;
        }

        // Use custom slug if provided, otherwise generate from name if name changed
        if (input.slug) {
            updateData.slug = input.slug;
        } else if (input.nameNe || input.nameEn || input.name) {
            updateData.slug = generateSlug(input.nameNe || input.nameEn || input.name || "");
        }

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

    // Delete a category
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Count categories
    async count(): Promise<number> {
        const collection = await getCollection();
        return collection.countDocuments();
    },

    // Seed default categories
    async seedDefaults(): Promise<void> {
        const defaults = [
            { name: "Technology", color: "#3B82F6" },
            { name: "Politics", color: "#EF4444" },
            { name: "Sports", color: "#10B981" },
            { name: "Business", color: "#F59E0B" },
            { name: "Entertainment", color: "#8B5CF6" },
            { name: "Health", color: "#EC4899" },
            { name: "Local", color: "#06B6D4" },
            { name: "World", color: "#6366F1" },
        ];

        for (const cat of defaults) {
            const existing = await this.findBySlug(generateSlug(cat.name));
            if (!existing) {
                await this.create(cat);
            }
        }
    },

    // Find categories by parent ID (get subcategories)
    async findByParentId(parentId: string): Promise<WithId<Category>[]> {
        const collection = await getCollection();
        return collection.find({ parentId: new ObjectId(parentId) }).sort({ name: 1 }).toArray();
    },

    // Find root categories (no parent)
    async findRootCategories(): Promise<WithId<Category>[]> {
        const collection = await getCollection();
        return collection.find({
            $or: [{ parentId: null }, { parentId: { $exists: false } }]
        }).sort({ name: 1 }).toArray();
    },

    // Find all categories with nested children structure
    async findWithChildren(): Promise<CategoryWithChildren[]> {
        const allCategories = await this.findAll();

        // Create a map for quick lookup
        const categoryMap = new Map<string, CategoryWithChildren>();
        allCategories.forEach(cat => {
            categoryMap.set(cat._id.toString(), { ...cat, children: [] });
        });

        // Build tree structure
        const rootCategories: CategoryWithChildren[] = [];

        categoryMap.forEach(category => {
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId.toString());
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(category);
                } else {
                    // Parent not found, treat as root
                    rootCategories.push(category);
                }
            } else {
                rootCategories.push(category);
            }
        });

        return rootCategories;
    },
};

export default CategoryModel;
