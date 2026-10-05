import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  console.warn("⚠️ MONGODB_URI is not defined in environment variables.");
  // Create a rejected promise that will throw when awaited, but doesn't crash the import
  clientPromise = Promise.reject(new Error("MONGODB_URI is not defined. Please add it to your environment variables."));
} else if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise
export default clientPromise;

// Helper function to get the database
export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
