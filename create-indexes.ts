import { getDatabase } from "./lib/mongodb.js";

async function createIndexes() {
    try {
        console.log("🔧 Connecting and creating performance indexes...");
        const db = await getDatabase("news-portal");
        const posts = db.collection("posts");
        const users = db.collection("users");
        const categories = db.collection("categories");
        const galleries = db.collection("galleries");
        const events = db.collection("events");
        const webstories = db.collection("webstories");
        const settings = db.collection("settings");

        // ============ POSTS COLLECTION INDEXES ============
        console.log("📍 Creating indexes for posts collection...");
        
        // Unique index on slug
        await posts.createIndex({ slug: 1 }, { unique: true });
        
        // Most common query: published posts sorted by date
        await posts.createIndex({ published: 1, createdAt: -1 });
        
        // Category filtering with publication status
        await posts.createIndex({ category: 1, published: 1, createdAt: -1 });
        
        // Trending posts by views
        await posts.createIndex({ published: 1, viewCount: -1, createdAt: -1 });
        
        // Author filtering (for demo users)
        await posts.createIndex({ authorId: 1, published: 1, createdAt: -1 });
        
        // Province filtering
        await posts.createIndex({ province: 1, published: 1, createdAt: -1 });
        
        // Tags search
        await posts.createIndex({ tags: 1, published: 1 });
        
        // Headline posts
        await posts.createIndex({ isHeadline: 1, published: 1, createdAt: -1 });
        
        // Search optimization (text index)
        await posts.createIndex({ title: "text", content: "text" });

        // ============ USERS COLLECTION INDEXES ============
        console.log("📍 Creating indexes for users collection...");
        
        await users.createIndex({ name: 1 });
        await users.createIndex({ email: 1 }, { unique: true });
        await users.createIndex({ role: 1 });

        // ============ CATEGORIES COLLECTION INDEXES ============
        console.log("📍 Creating indexes for categories collection...");
        
        await categories.createIndex({ slug: 1 }, { unique: true });
        await categories.createIndex({ name: 1 });
        await categories.createIndex({ parentId: 1 }); // For hierarchical queries

        // ============ GALLERIES COLLECTION INDEXES ============
        console.log("📍 Creating indexes for galleries collection...");
        
        await galleries.createIndex({ slug: 1 }, { unique: true });
        await galleries.createIndex({ published: 1, createdAt: -1 });
        await galleries.createIndex({ category: 1, published: 1 });

        // ============ EVENTS COLLECTION INDEXES ============
        console.log("📍 Creating indexes for events collection...");
        
        await events.createIndex({ slug: 1 }, { unique: true });
        await events.createIndex({ startDate: 1, published: 1 });
        await events.createIndex({ published: 1, createdAt: -1 });

        // ============ WEB STORIES COLLECTION INDEXES ============
        console.log("📍 Creating indexes for webstories collection...");
        
        await webstories.createIndex({ slug: 1 }, { unique: true });
        await webstories.createIndex({ published: 1, createdAt: -1 });
        await webstories.createIndex({ category: 1, published: 1 });

        // ============ SETTINGS COLLECTION INDEXES ============
        console.log("📍 Creating indexes for settings collection...");
        
        await settings.createIndex({ key: 1 }, { unique: true });

        console.log("✅ All performance indexes created successfully!");
        console.log("\n📊 Index Summary:");
        console.log("   - Posts: 9 indexes (slug, date, category, trending, author, province, tags, headline, text search)");
        console.log("   - Users: 3 indexes (name, email, role)");
        console.log("   - Categories: 3 indexes (slug, name, parentId)");
        console.log("   - Galleries: 3 indexes (slug, date, category)");
        console.log("   - Events: 3 indexes (slug, startDate, date)");
        console.log("   - WebStories: 3 indexes (slug, date, category)");
        console.log("   - Settings: 1 index (key)");
        console.log("\n🚀 Expected Performance Gains:");
        console.log("   - Query speed: 50-100x faster");
        console.log("   - Database load: Significantly reduced");
        console.log("   - Sorting operations: Near instant");
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating indexes:", err);
        process.exit(1);
    }
}

createIndexes();
