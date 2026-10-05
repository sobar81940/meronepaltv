# Mobile App API Documentation

REST API for the Rangamanch mobile app. Base URL:

```
https://rangamanch.com/api/mobile
```

All responses are JSON. Public endpoints require no authentication; user endpoints require a Bearer token.

## Conventions

### Response format

Success:

```json
{
  "success": true,
  "data": { ... }
}
```

Error:

```json
{
  "success": false,
  "error": "Human readable message"
}
```

### Pagination

List endpoints return:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1511,
    "pages": 152
  }
}
```

### Authentication

Register or login to receive a JWT token (valid 1 year). Send it on protected routes:

```
Authorization: Bearer <token>
```

### Post object (list)

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "title": "समाचार शीर्षक",
  "excerpt": "संक्षिप्त विवरण...",
  "slug": "samachar-shirshak-ab12",
  "author": "Admin",
  "authorId": "64f1a2b3c4d5e6f7a8b9c0d0",
  "authorImage": "https://.../profile.jpg",
  "category": "मनोरञ्जन",
  "province": null,
  "tags": ["ट्याग"],
  "imageUrl": "https://.../image.jpg",
  "published": true,
  "isHeadline": false,
  "viewCount": 1520,
  "shareCount": 200,
  "visitorCount": 99,
  "readingTime": 3,
  "socialShares": { "twitter": true, "facebook": true, "instagram": false, "facebookReel": false, "youtube": false },
  "createdAt": "2026-08-08T10:00:00.000Z",
  "updatedAt": "2026-08-08T10:00:00.000Z"
}
```

List responses exclude `content` and `contentBlocks`. IP-tracking arrays (`sharedIPs`, `visitorIPs`) are never exposed.

---

## Endpoints

### 1. Home Feed

`GET /api/mobile/home?page=1&limit=10`

Home screen payload: headlines, latest (paginated), trending, category sections (driven by the admin home layout), categories, web stories, events, celebrities, and site branding.

```json
{
  "success": true,
  "data": {
    "site": {
      "name": "Rangamanch",
      "tagline": "",
      "logoUrl": "https://.../logo.png",
      "logoText": "Rangamanch"
    },
    "headlines": [ "<post>", ... ],        // up to 5
    "latest": [ "<post>", ... ],            // page of non-province posts
    "trending": [ "<post>", ... ],          // top 5 by viewCount
    "sections": [
      {
        "type": "category",
        "title": "मनोरञ्जन",
        "categoryId": "entertainment",
        "layout": "list",
        "posts": [ "<post>", ... ]          // up to 7 per section
      }
    ],
    "categories": [ { "_id", "name", "slug", "color" } ],
    "webStories": [ { "_id", "title", "slug", "coverImage", "category", "author", "viewCount", "createdAt", "updatedAt" } ],
    "events": [ "<event>", ... ],
    "celebrities": [ { "_id", "name", "slug", "title", "shortBio", "imageUrl", "category", "isFeatured" } ],
    "pagination": { "page": 1, "limit": 10, "total": 1000, "pages": 100 }
  }
}
```

### 2. Posts List

`GET /api/mobile/posts?page=1&limit=10&category=entertainment&province=बागमती प्रदेश&tag=नेपाल&search=फिल्म&sort=latest`

| Param      | Type   | Description                                          |
|------------|--------|------------------------------------------------------|
| `page`     | int    | Page number, default `1`                             |
| `limit`    | int    | Page size, default `10`, max `50`                    |
| `category` | string | Category slug or name. `news` also matches `समाचार`, `world` also matches `विश्व` |
| `province` | string | Province name (e.g. `बागमती प्रदेश`)                |
| `tag`      | string | Tag with or without `#`                              |
| `search`   | string | Full-text search on title, content and tags          |
| `sort`     | string | `latest` (default) or `views`                        |

Response: list of posts + pagination object.

### 3. Post Detail

`GET /api/mobile/posts/:slug`

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "content": "<p>Full HTML content</p>",
    "contentBlocks": [
      { "id": "b1", "type": "image", "content": "", "mediaUrl": "https://...", "caption": "...", "order": 0 }
    ],
    "excerpt": "...",
    "slug": "...",
    "author": "...",
    "authorImage": "https://.../profile.jpg",
    "category": "...",
    "province": null,
    "tags": [],
    "imageUrl": "...",
    "readingTime": 4,
    "viewCount": 1520,
    "shareCount": 200,
    "createdAt": "...",
    "updatedAt": "...",
    "related": [ "<post>", ... ]    // up to 6 same-category posts
  }
}
```

404 if the slug does not exist or the post is unpublished.

### 4. Track View

`POST /api/mobile/posts/:slug/view`

Increments `viewCount`. Sends the client IP automatically (X-Forwarded-For / X-Real-IP) for unique-visitor counting. No body required.

```json
{ "success": true, "data": { "slug": "post-slug", "viewCount": 1521 } }
```

### 5. Track Share

`POST /api/mobile/posts/:slug/share`

Optional body — location improves share tracking:

```json
{
  "location": { "lat": 27.7172, "lon": 85.3240 }
}
```

```json
{
  "success": true,
  "data": { "slug": "post-slug", "incremented": true },
  "message": "Share recorded"
}
```

`incremented: false` if the IP already shared or location/IP is missing.

### 6. Categories

`GET /api/mobile/categories`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "name": "मनोरञ्जन",
      "slug": "entertainment",
      "color": "#8B5CF6",
      "description": null,
      "postCount": 230,
      "parentId": null
    }
  ]
}
```

`postCount` counts published posts under that category (matched by name or slug).

### 7. Trending Tags

`GET /api/mobile/tags?limit=20&period=all`

| Param    | Description                              |
|----------|------------------------------------------|
| `limit`  | Default `20`, max `50`                   |
| `period` | `all` (default), `week`, or `month`      |

```json
{
  "success": true,
  "data": [
    { "tag": "नेपाली फिल्म", "count": 12, "totalViews": 3450, "score": 3045 }
  ]
}
```

Ranked by `score` (views weighted 70% + post count).

### 8. Web Stories

`GET /api/mobile/webstories?limit=10`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "title": "Story title",
      "slug": "story-abc",
      "coverImage": "https://.../cover.jpg",
      "category": "मनोरञ्जन",
      "author": "Admin",
      "published": true,
      "featured": false,
      "viewCount": 120,
      "createdAt": "...",
      "updatedAt": "...",
      "slides": []
    }
  ]
}
```

### 9. Web Story Detail

`GET /api/mobile/webstories/:slug`

Full story including slides:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "coverImage": "...",
    "slides": [
      {
        "id": "s1",
        "type": "image",
        "mediaUrl": "https://.../slide.jpg",
        "text": "क्याप्सन",
        "textPosition": "bottom",
        "textColor": "#FFFFFF",
        "backgroundColor": "#000000",
        "duration": 5,
        "link": null,
        "linkText": null
      }
    ],
    "viewCount": 121
  }
}
```

### 10. Horoscope (Rashifal)

`GET /api/mobile/rashifal`

```json
{
  "success": true,
  "data": [
    {
      "rashi": "मेष",
      "rashiEnglish": "Aries",
      "icon": "♈",
      "dateRange": "मार्च २१ - अप्रिल १९",
      "letters": "चु, चे, चो, ...",
      "prediction": "आज तपाईंको दिन शुभ रहनेछ...",
      "lucky": { "number": "९", "color": "रातो", "day": "मंगलबार" },
      "compatibility": "सिंह",
      "mood": "उत्साही",
      "health": "राम्रो",
      "career": "सकारात्मक",
      "love": "मधुर"
    }
  ],
  "date": "2026-08-08T10:00:00.000Z",
  "nepaliDate": "शनि, २३ साउन २०८३"
}
```

Predictions rotate daily. All 12 rashis are always returned.

### 11. Forex Rates

`GET /api/mobile/forex`

Nepal Rastra Bank daily rates, cached for 1 hour:

```json
{
  "success": true,
  "data": [
    {
      "currency": { "iso3": "USD", "name": "US DOLLAR", "unit": 1 },
      "buy": "134.52",
      "sell": "135.12"
    }
  ],
  "date": "2026-08-08",
  "cached": true
}
```

If today's rates are unavailable, yesterday's are returned. On NRB failure, stale cached data is served with `"stale": true`.

### 12. Advertisements

`GET /api/mobile/ads?position=home1`

Positions: `home1`, `home2`, `home3`, `between-posts`, `header-banner`, `footer-banner`, `popup`, `in-article`.

```json
{
  "success": true,
  "data": {
    "position": "home1",
    "ads": [
      { "id": "64f...", "title": "Ad title", "imageUrl": "...", "linkUrl": "...", "position": "home1", "positions": ["home1"], "priority": 10 }
    ]
  }
}
```

Calling without a position returns all placements grouped:

```json
{ "success": true, "data": { "positions": { "home1": [ "<ad>" ], "between-posts": [ "<ad>" ] } } }
```

### 13. Events

`GET /api/mobile/events?limit=10&status=upcoming&category=festival`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "title": "Event title",
      "slug": "event-slug",
      "shortDescription": "...",
      "imageUrl": "...",
      "category": "festival",
      "status": "upcoming",
      "location": { "address": "...", "city": "काठमाडौं", "country": "Nepal", "lat": 27.7, "lng": 85.3, "googleMapsUrl": null },
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": null,
      "startTime": "10:00",
      "endTime": "17:00",
      "organizer": "Organizer",
      "ticketUrl": null,
      "isFeatured": false,
      "registrationRequired": false,
      "tags": []
    }
  ]
}
```

---

## Authentication

### Register

`POST /api/mobile/auth/register`

```json
{ "name": "Ramesh", "email": "ramesh@example.com", "password": "secret123" }
```

Validation: name 2–50 chars (letters, digits, spaces, `.-`), valid email, password ≥ 6 chars.

Success (201):

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "64f...", "email": "ramesh@example.com", "name": "Ramesh", "role": "mobile" }
  },
  "message": "Account created successfully"
}
```

`409` if the email already exists.

### Login

`POST /api/mobile/auth/login`

```json
{ "email": "ramesh@example.com", "password": "secret123" }
```

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "64f...", "email": "ramesh@example.com", "name": "Ramesh", "role": "mobile", "profileImage": null }
  }
}
```

`401` on invalid credentials.

### Current User

`GET /api/mobile/auth/me`

Header: `Authorization: Bearer <token>`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f...",
      "email": "ramesh@example.com",
      "name": "Ramesh",
      "role": "mobile",
      "profileImage": null,
      "createdAt": "2026-08-08T10:00:00.000Z"
    }
  }
}
```

`401` without a valid token.

---

## Error codes

| Status | Meaning                                   |
|--------|-------------------------------------------|
| 400    | Missing/invalid request parameters        |
| 401    | Missing or invalid token / bad credentials |
| 404    | Resource not found                        |
| 409    | Duplicate (email already registered)      |
| 500    | Server error — retry; never shown with `success: true` |

## Notes for mobile clients

- All timestamps are ISO 8601 UTC strings.
- Post `content` is HTML; `contentBlocks` are typed sections (`text`, `image`, `video`, `quote`, `heading`, `embed`) — render `mediaUrl` for media blocks.
- Cache responses locally: home feed changes every ~2 min, posts every ~1 min, categories/web stories/events/ads every ~5 min, tags every ~10 min, forex hourly.
- Send the real client IP (don't strip `X-Forwarded-For`) for accurate view/share analytics.
