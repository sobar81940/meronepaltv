import { ObjectId, Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const COLLECTION_NAME = "users";
const DB_NAME = "meronepaltv";

export interface UserPermissions {
    canCreatePosts: boolean;
    canManageGallery: boolean;
    canManageCategories: boolean;
    canManageSettings: boolean;
    canManageUsers: boolean;
    postLimit?: number; // null = unlimited
}

export interface User {
    _id?: ObjectId;
    email: string;
    password: string;
    name: string;
    role: "admin" | "editor" | "demo" | "mobile";
    permissions: UserPermissions;
    profileImage?: string; // URL to profile image
    postCount: number; // Track how many posts user has created
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: "admin" | "editor" | "demo" | "mobile";
    permissions?: Partial<UserPermissions>;
}

// Default permissions by role
const defaultPermissions: Record<string, UserPermissions> = {
    admin: {
        canCreatePosts: true,
        canManageGallery: true,
        canManageCategories: true,
        canManageSettings: true,
        canManageUsers: true,
    },
    editor: {
        canCreatePosts: true,
        canManageGallery: true,
        canManageCategories: false,
        canManageSettings: false,
        canManageUsers: false,
    },
    demo: {
        canCreatePosts: true,
        canManageGallery: true,
        canManageCategories: false,
        canManageSettings: false,
        canManageUsers: false,
        postLimit: 2, // Demo users can only create 2 posts
    },
    mobile: {
        canCreatePosts: false,
        canManageGallery: false,
        canManageCategories: false,
        canManageSettings: false,
        canManageUsers: false,
    },
};

async function getCollection(): Promise<Collection<User>> {
    const db = await getDatabase(DB_NAME);
    return db.collection<User>(COLLECTION_NAME);
}

export const UserModel = {
    // Find user by email
    async findByEmail(email: string): Promise<WithId<User> | null> {
        const collection = await getCollection();
        return collection.findOne({ email: email.toLowerCase() });
    },

    // Find user by ID
    async findById(id: string): Promise<WithId<User> | null> {
        const collection = await getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // Find user by name
    async findByName(name: string): Promise<WithId<User> | null> {
        const collection = await getCollection();
        return collection.findOne({ name });
    },

    // Create a new user
    async create(input: CreateUserInput): Promise<WithId<User>> {
        const collection = await getCollection();
        const now = new Date();
        const role = input.role || "editor";

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        const user: Omit<User, "_id"> = {
            email: input.email.toLowerCase(),
            password: hashedPassword,
            name: input.name,
            role,
            permissions: { ...defaultPermissions[role], ...input.permissions },
            postCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(user as User);
        return { ...user, _id: result.insertedId } as WithId<User>;
    },

    // Verify password
    async verifyPassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    },

    // Find all users
    async findAll(): Promise<WithId<User>[]> {
        const collection = await getCollection();
        return collection.find({}).sort({ createdAt: -1 }).toArray();
    },

    // Update user
    async update(
        id: string,
        input: Partial<Omit<CreateUserInput, "password" | "permissions">> & { permissions?: UserPermissions; profileImage?: string }
    ): Promise<WithId<User> | null> {
        const collection = await getCollection();

        // Build update object excluding undefined values
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (input.email) updateData.email = input.email.toLowerCase();
        if (input.name) updateData.name = input.name;
        if (input.role) updateData.role = input.role;
        if (input.permissions) updateData.permissions = input.permissions;
        if (input.profileImage !== undefined) updateData.profileImage = input.profileImage;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        return result;
    },

    // Update password
    async updatePassword(id: string, newPassword: string): Promise<boolean> {
        const collection = await getCollection();
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        return result.modifiedCount === 1;
    },

    // Increment post count
    async incrementPostCount(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { postCount: 1 } }
        );
        return result.modifiedCount === 1;
    },

    // Check if user can create post
    async canCreatePost(id: string): Promise<{ allowed: boolean; reason?: string }> {
        const user = await this.findById(id);
        if (!user) return { allowed: false, reason: "User not found" };

        if (!user.permissions.canCreatePosts) {
            return { allowed: false, reason: "No permission to create posts" };
        }

        // Only check postLimit if it's a valid number (not null, undefined, or 0)
        const postLimit = user.permissions.postLimit;
        if (typeof postLimit === 'number' && postLimit > 0) {
            if (user.postCount >= postLimit) {
                return {
                    allowed: false,
                    reason: `Demo limit reached. You can only create ${postLimit} posts.`
                };
            }
        }

        return { allowed: true };
    },

    // Delete user
    async delete(id: string): Promise<boolean> {
        const collection = await getCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    },

    // Count users
    async count(): Promise<number> {
        const collection = await getCollection();
        return collection.countDocuments();
    },

    // Ensure admin exists (for initial setup)
    async ensureAdminExists(): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@news.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        const existing = await this.findByEmail(adminEmail);
        if (!existing) {
            await this.create({
                email: adminEmail,
                password: adminPassword,
                name: "Admin",
                role: "admin",
            });
            console.log("Default admin user created");
        }
    },

    // Ensure demo user exists
    async ensureDemoExists(): Promise<void> {
        const demoEmail = "demo@news.com";
        const demoPassword = "demo123";

        const existing = await this.findByEmail(demoEmail);
        if (!existing) {
            await this.create({
                email: demoEmail,
                password: demoPassword,
                name: "Demo User",
                role: "demo",
            });
            console.log("Demo user created (email: demo@news.com, password: demo123)");
        }
    },
};

export default UserModel;

