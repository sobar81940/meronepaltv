/* eslint-disable */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('news-portal');
    console.log("Connected to the database");

    const posts = await db.collection('posts').find({ isHeadline: true, published: true }).limit(3).toArray();
    console.log("HEADLINE POSTS:", JSON.stringify(posts.map(p => ({ title: p.title, author: p.author, authorId: p.authorId })), null, 2));

    const users = await db.collection('users').find({}).toArray();
    console.log("\nUSERS:", JSON.stringify(users.map(u => ({ _id: u._id, name: u.name, profileImage: u.profileImage })), null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
