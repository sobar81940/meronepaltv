/* eslint-disable */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('news-portal');

  const posts = await db.collection('posts').find({ isHeadline: true, published: true }).limit(1).toArray();
  const users = await db.collection('users').find({}).toArray();

  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  const p = posts[0];

  let authorImage = undefined;
  if (p.authorId && userMap.has(p.authorId)) {
    console.log("Matched by ID!");
    authorImage = userMap.get(p.authorId)?.profileImage;
  }

  console.log("authorId:", p.authorId);
  console.log("Has in userMap:", userMap.has(p.authorId));
  console.log("Author Image:", authorImage);

  await client.close();
}
run();
