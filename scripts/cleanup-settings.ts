import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "meronepaltv";

async function cleanupSettings() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection("settings");
        
        // Count all settings documents
        const count = await collection.countDocuments({});
        console.log(`Found ${count} settings document(s)`);
        
        if (count > 1) {
            // Keep only the first one
            const allSettings = await collection.find({}).toArray();
            console.log("Settings documents:");
            allSettings.forEach((doc, i) => {
                console.log(`  ${i + 1}. ID: ${doc._id}, Updated: ${doc.updatedAt}`);
            });
            
            // Keep the first document, delete the rest
            const [keep, ...toDelete] = allSettings;
            console.log(`\nKeeping: ${keep._id}`);
            
            for (const doc of toDelete) {
                await collection.deleteOne({ _id: doc._id });
                console.log(`Deleted: ${doc._id}`);
            }
            
            console.log("\nCleanup complete!");
        } else {
            console.log("No duplicates found - all good!");
        }
    } finally {
        await client.close();
    }
}

cleanupSettings().catch(console.error);
