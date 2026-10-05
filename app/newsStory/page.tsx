import { redirect } from "next/navigation";
import PostModel from "@/models/Post";

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

export default async function NewsStoryIndexPage() {
    // Fetch only the latest post for better performance
    const posts = await PostModel.findPublished(1); // Limit to 1

    if (posts && posts.length > 0) {
        // Redirect to the latest post's story viewer
        const latestPost = posts[0]; // Posts are sorted by createdAt descending
        redirect(`/newsStory/${latestPost.slug}`);
    }

    // If no posts found, redirect to home
    redirect("/");
}
