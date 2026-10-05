/**
 * Cache invalidation utility for POST operations
 * Used when creating, updating, or deleting posts to keep cache fresh
 */

import { invalidateCache } from "@/lib/cache";

/**
 * Invalidate caches after creating a post
 */
export async function invalidatePostCaches(category?: string, isHeadline?: boolean) {
  try {
    // Invalidate posts by category
    if (category) {
      invalidateCache.posts(category);
    } else {
      invalidateCache.posts();
    }

    // If it's a headline, also invalidate headlines cache
    if (isHeadline) {
      // Headlines cache will be cleared by general posts cache invalidation
    }

    console.log('✅ Post caches invalidated');
  } catch (error) {
    console.error('Error invalidating post caches:', error);
  }
}

/**
 * Invalidate caches after updating a post
 */
export function invalidatePostUpdateCaches(postId: string, category?: string) {
  try {
    // Invalidate the specific post
    invalidateCache.posts(category);
    
    console.log(`✅ Post ${postId} caches invalidated`);
  } catch (error) {
    console.error('Error invalidating post update caches:', error);
  }
}

/**
 * Invalidate caches after deleting a post
 */
export function invalidatePostDeleteCaches(category?: string) {
  try {
    invalidateCache.posts(category);
    invalidateCache.posts(); // Also invalidate general posts cache
    
    console.log('✅ Post deletion caches invalidated');
  } catch (error) {
    console.error('Error invalidating post deletion caches:', error);
  }
}
