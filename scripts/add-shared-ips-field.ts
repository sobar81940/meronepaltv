import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/news-portal";

async function addSharedIPsField() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db("news-portal");
        const postsCollection = db.collection("posts");
        
        console.log("Adding 'sharedIPs' field to existing posts...");
        
        const result = await postsCollection.updateMany(
            { sharedIPs: { $exists: false } },
            { $set: { sharedIPs: [] } }
        );
        
        console.log(`✅ Updated ${result.modifiedCount} posts`);
        console.log(`⏭️  ${result.upsertedCount} posts already had the field`);
        
    } catch (error) {
        console.error("❌ Error adding sharedIPs field:", error);
        throw error;
    } finally {
        await client.close();
    }
}

addSharedIPsField()
    .then(() => {
        console.log("✅ Migration completed successfully!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    });
