import { MongoClient } from 'mongodb';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("No MONGODB_URI");

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
    } else if (p.author) {
        const userNameMap = new Map(users.map(u => [u.name, u]));
        if (userNameMap.has(p.author)) {
            console.log("Matched by Name!");
            authorImage = userNameMap.get(p.author)?.profileImage;
        }
    }

    console.log("authorId:", p.authorId);
    console.log("Has in userMap:", userMap.has(p.authorId));
    console.log("Author Name:", p.author);
    console.log("Author Image:", authorImage);

    await client.close();
}

run();
