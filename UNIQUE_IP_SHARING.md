# Unique IP Share Tracking Implementation

## Overview
Share count now tracks **unique IP addresses** instead of generic visitor counts. Each IP can only contribute once per post.

## Changes Made

### 1. **Data Model** (`lib/types.ts`)
- Added `sharedIPs?: string[]` field to Post interface
- Stores array of unique IP addresses that have shared the post
- Default: empty array

### 2. **Post Model Logic** (`models/Post.ts`)
Updated `incrementViewCount()` method with IP tracking:

```typescript
async incrementViewCount(slug: string, ipAddress?: string): Promise<void>
```

**Logic:**
- **First visit from new IP**: 
  - ✅ View count +1
  - ✅ Share count +20
  - ✅ IP added to `sharedIPs` array
  
- **Repeat visit from same IP**:
  - ✅ View count +1
  - ❌ Share count stays same (already counted)
  - ❌ IP not added again

### 3. **Page Component** (`app/post/[slug]/page.tsx`)
- Added IP extraction helper function: `getClientIP()`
- Checks headers in priority order:
  1. `x-forwarded-for` (proxy chains)
  2. `x-real-ip` (direct header)
  3. `x-client-ip` (alternative header)
  4. Fallback: `127.0.0.1`

- Passes client IP to `incrementViewCount()` call

### 4. **Database Migration** (`scripts/add-shared-ips-field.ts`)
Adds the `sharedIPs` field to all existing posts:

```bash
npx ts-node scripts/add-shared-ips-field.ts
```

## Share Count Behavior

**Default state:**
- New posts: `shareCount: 200`, `sharedIPs: []`

**Per visitor (unique IP):**
- First visit: `shareCount += 20`
- Subsequent visits: No change to `shareCount`

**Example Timeline:**
```
Post Created:
  shareCount: 200
  sharedIPs: []
  
IP 192.168.1.1 visits:
  shareCount: 220 ✅
  sharedIPs: ["192.168.1.1"]
  
IP 192.168.1.2 visits:
  shareCount: 240 ✅
  sharedIPs: ["192.168.1.1", "192.168.1.2"]
  
IP 192.168.1.1 visits again:
  shareCount: 240 ❌ (no change, IP already counted)
  sharedIPs: ["192.168.1.1", "192.168.1.2"]
```

## Database Index Recommendation

Add this index for better performance:
```javascript
db.posts.createIndex({ slug: 1, sharedIPs: 1 })
```

## Deployment Steps

1. **Migrate existing posts:**
   ```bash
   npx ts-node scripts/add-shared-ips-field.ts
   ```

2. **Deploy code changes** to production

3. **Monitor** the share count tracking:
   - View counts should increase normally
   - Share counts should increase by 20 per unique IP only

## Testing

**Test with curl from different "IPs":**
```bash
# Simulate different IPs
curl -H "x-forwarded-for: 192.168.1.1" http://localhost:3000/post/test-slug
curl -H "x-forwarded-for: 192.168.1.2" http://localhost:3000/post/test-slug
curl -H "x-forwarded-for: 192.168.1.1" http://localhost:3000/post/test-slug
```

Expected behavior:
- First request: shareCount +20 (new IP)
- Second request: shareCount +20 (new IP)
- Third request: shareCount no change (repeat IP)

## Notes

- ✅ Works with proxy headers (Cloudflare, Nginx, etc.)
- ✅ Case-sensitive IP matching
- ✅ No performance impact (single check per page view)
- ✅ Backward compatible with existing posts
