import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import PostModel from "@/models/Post";
import CategoryModel from "@/models/Category";
import GalleryModel from "@/models/Gallery";
import WebStoryModel from "@/models/WebStory";
import CelebrityModel from "@/models/Celebrity";
import UserModel from "@/models/User";
import ProvinceNewsSection from "@/components/ProvinceNewsSection";
import RashifalSection from "@/components/RashifalSection";
import EventsSection from "@/components/EventsSection";
import EventModel from "@/models/Event";
import { GallerySection } from "@/components/GallerySection";
import HeadlineSection from "@/components/HeadlineSection";
import { WebStoriesSection } from "@/components/WebStoriesSection";
import { HomePageAds, HeaderAdSection, FooterAdSection, BetweenPostsAdSection, BuilderAdSection } from "@/components/HomeAds";
import { WithId } from "mongodb";
import { Post } from "@/lib/types";
import HeroSection from "@/components/HeroSection";
import LatestNewsSection from "@/components/LatestNewsSection";
import CategorySection from "@/components/CategorySection";
import LiveBroadcast from "@/components/LiveBroadcast";
import FrontPageSection from "@/components/FrontPageSection";
import SportsSection from "@/components/SportsSection";
import InterviewSection from "@/components/InterviewSection";
import SettingsModel, { HomeLayoutSection } from "@/models/Settings";
import CelebritySection from "@/components/CelebritySection";
import EntertainmentSection from "@/components/EntertainmentSection";
import TechnologySection from "@/components/TechnologySection";
import LifestyleSection from "@/components/LifestyleSection";
import WorldSection from "@/components/WorldSection";
import NewsSection from "@/components/NewsSection";
import BusinessSection from "@/components/BusinessSection";
import ShortsSection from "@/components/ShortsSection";
import { stripHtmlTags } from "@/lib/utils";
import { Metadata } from "next";
// Forced rebuild to clear stale cache

// Enable ISR caching with 60 second revalidation for better performance
export const revalidate = 60;

// Helper to safely convert date to ISO string
const toISOString = (date: Date | string | number | null | undefined): string => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date(date).toISOString();
};

// Generate metadata for the home page
export async function generateMetadata(): Promise<Metadata> {
  const settings = await SettingsModel.get().catch(() => undefined);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://meronepaltv.com";
  const siteName = settings?.siteName || "MeroNepalTv";
  const siteDescription = settings?.seoSettings?.siteDescription || settings?.siteTagline || "MeroNepalTv.com is a Nepal-based news and entertainment portal covering Nepali films, entertainment, celebrities, technology, business, sports and the latest news.";
  const homeTitle = `${siteName} | नेपाली मनोरञ्जन, चलचित्र र समाचार`;

  // Ensure OG image URL is always absolute
  const configuredOgImage = settings?.seoSettings?.ogImage;
  const rawOgImage = configuredOgImage && !configuredOgImage.endsWith("/images/og-image.png")
    ? configuredOgImage
    : `/images/og-image.jpg`;
  const ogImageUrl = rawOgImage.startsWith("http") ? rawOgImage : `${siteUrl}${rawOgImage}`;

  return {
    title: { absolute: homeTitle },
    description: siteDescription,
    alternates: {
      canonical: siteUrl,
      languages: { ne: siteUrl },
    },
    keywords: [
      "MeroNepalTv",
      "MeroNepalTv.com",
      "MeroNepalTv Nepal",
      "",
      "नेपाली मनोरञ्जन समाचार",
      "नेपाली चलचित्र समाचार",
    ],
    openGraph: {
      type: "website",
      title: homeTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: siteName,
      locale: "ne_NP",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: homeTitle,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: homeTitle,
      description: siteDescription,
      images: [ogImageUrl],
    },
  };
}


export default async function HomePage() {
  // Fetch all necessary data concurrently with individual error handling
  const [
    posts,
    categories,
    headlinePosts,
    settings,
    users,
    frontPagePosts,
    sportsPosts,
    interviewPosts,
    imagesByCategory,
    videosByCategory,
    webStories,
    events,
    celebrities,
    provinceCategoryPosts,
    businessPosts
  ] = await Promise.all([
    PostModel.findPublished(300).catch(() => [] as WithId<Post>[]),
    CategoryModel.findAll().catch(() => []),
    PostModel.findHeadlines(3).catch(() => [] as WithId<Post>[]),
    SettingsModel.get().catch(() => undefined),
    UserModel.findAll().catch(() => []),
    PostModel.findByCategory("राजनीति", 10).catch(() => [] as WithId<Post>[]),
    PostModel.findByCategory("खेलकुद", 6).catch(() => [] as WithId<Post>[]),
    PostModel.findByCategory("अन्तर्वार्ता", 9).catch(() => [] as WithId<Post>[]),
    GalleryModel.findGroupedByCategory("image", 6).catch(() => ({})),
    GalleryModel.findGroupedByCategory("video", 4).catch(() => ({})),
    WebStoryModel.findPublished(10).catch(() => []),
    EventModel.findUpcoming(4).catch(() => []),
    CelebrityModel.findPublished(6).catch(() => []),
    PostModel.findByCategory("प्रदेश", 9).catch(() => [] as WithId<Post>[]),
    PostModel.findByCategory("अर्थ/व्यापार", 5).catch(() => [] as WithId<Post>[])
  ]);

  // Create a map of author ID to user (for images)
  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  // Fallback map by name (if authorId is missing but author name matches)
  const userNameMap = new Map(users.map(u => [u.name, u]));

  const getAuthorImage = (p: WithId<Post>) => {
    if (p.authorId && userMap.has(p.authorId)) {
      const img = userMap.get(p.authorId)?.profileImage;
      if (img) return img;
    }
    if (p.author && userNameMap.has(p.author)) {
      return userNameMap.get(p.author)?.profileImage;
    }
    return undefined;
  };

  const serializePost = (p: WithId<Post>) => ({
    ...p,
    _id: p._id.toString(),
    createdAt: toISOString(p.createdAt),
    authorImage: getAuthorImage(p),
  });

  const serializedEvents = events.map(e => ({
    ...e,
    _id: e._id.toString(),
    startDate: toISOString(e.startDate),
    createdAt: toISOString(e.createdAt),
    updatedAt: toISOString(e.updatedAt),
    endDate: e.endDate ? toISOString(e.endDate) : undefined,
  }));

  const serializedCelebrities = celebrities.map(c => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    title: c.title,
    shortBio: c.shortBio,
    imageUrl: c.imageUrl,
    category: c.category,
    isFeatured: c.isFeatured,
    knownFor: c.knownFor,
  }));

  // Convert ObjectId to string for client components
  const serializeGalleryItems = (items: Record<string, { _id: { toString(): string }; title: string; type: "image" | "video"; url: string; thumbnailUrl?: string; category?: string; youtubeId?: string; videoSource?: "upload" | "youtube" }[]>) => {
    const result: Record<string, { _id: string; title: string; type: "image" | "video"; url: string; thumbnailUrl?: string; category?: string; youtubeId?: string; videoSource?: "upload" | "youtube" }[]> = {};
    for (const [category, items_] of Object.entries(items)) {
      result[category] = items_.map(item => ({
        _id: item._id.toString(),
        title: item.title,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        category: item.category,
        youtubeId: item.youtubeId,
        videoSource: item.videoSource,
      }));
    }
    return result;
  };

  const serializedImages = serializeGalleryItems(imagesByCategory);
  const serializedVideos = serializeGalleryItems(videosByCategory);

  // Create category lookup map (slug -> name) and (slug -> slug for original)
  const categoryMap = new Map(categories.map(c => [c.slug, c.name]));
  const categorySlugMap = new Map(categories.map(c => [c.slug, c.slug]));
  // Also map by name for cases where category is stored as name
  categories.forEach(c => {
    categoryMap.set(c.name, c.name);
    categorySlugMap.set(c.name, c.slug);
  });

  // Serialize headline posts with resolved category names
  const serializedHeadlines = headlinePosts.map(p => {
    // Try to resolve category slug to name, fallback to original if not found
    const categoryDisplay = p.category ? (categoryMap.get(p.category) || p.category) : undefined;
    // Get original slug for linking
    const originalSlug = p.category ? (categorySlugMap.get(p.category) || p.category) : undefined;
    return {
      _id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      imageUrl: p.imageUrl,
      author: p.author,
      authorImage: getAuthorImage(p),
      category: categoryDisplay,
      categorySlug: originalSlug,
      createdAt: toISOString(p.createdAt),
    };
  });

  // Filter out posts with provinces for featured/latest sections
  // Also filter out headline posts from regular sections
  const headlineIds = new Set(headlinePosts.map(p => p._id.toString()));
  const nonProvincePosts = posts.filter(p => !p.province && !headlineIds.has(p._id.toString()));

  // Track displayed post IDs to prevent duplication across the homepage
  const displayedPostIds = new Set<string>();
  headlinePosts.forEach(p => displayedPostIds.add(p._id.toString()));

  const getUniquePosts = (sourcePosts: WithId<Post>[], limit: number) => {
    const unique = sourcePosts.filter(p => !displayedPostIds.has(p._id.toString())).slice(0, limit);
    unique.forEach(p => displayedPostIds.add(p._id.toString()));
    return unique;
  };

  const shortsPosts = getUniquePosts(
    nonProvincePosts.filter(p => p.socialShares?.facebookReel || p.socialShares?.youtube),
    8
  ).map(serializePost);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://meronepaltv.com";

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": posts.slice(0, 10).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `${siteUrl}/post/${p.slug}`,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            "name": "मुख्य श्रेणीहरू",
            "hasPart": categories.filter((c: { slug: string }) => c.slug !== 'entertainment').map((c: { name: string; slug: string }) => ({
              "@type": "SiteNavigationElement",
              "name": c.name,
              "url": `${siteUrl}/category/${c.slug}`,
            })),
          }),
        }}
      />
      <Header />

      {/* Popup Ad (shows once per session) */}
      <HomePageAds />

      {/* Header Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <HeaderAdSection />
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-4 ">
        <h1 className="sr-only">{settings?.siteName || "MeroNepalTv"}</h1>

  

        {/* Dynamic Home Layout */}
        {(() => {
          const renderSection = (section: HomeLayoutSection) => {
            // Trending Bar
            if (section.type === 'trending') return null;

            // Hero Section
            if (section.type === 'hero') {
              const heroFeatured = getUniquePosts(nonProvincePosts, 1)[0];
              const heroSidebar = getUniquePosts(nonProvincePosts, 4);
              if (!heroFeatured && heroSidebar.length === 0) return null;
              return <HeroSection key={section.id} featuredPost={heroFeatured ? serializePost(heroFeatured) : null} sidebarPosts={heroSidebar.map(serializePost)} />;
            }

            // Latest News
            if (section.type === 'latest') {
              const latestNewsPosts = getUniquePosts(nonProvincePosts, 6);
              if (latestNewsPosts.length === 0) return null;
              return <LatestNewsSection key={section.id} posts={latestNewsPosts.map(serializePost)} title={section.title || "ताजा समाचार"} />;
            }

            // Category Section
            if (section.type === 'category') {
              const categoryName = categories.find(c => c.slug === section.categoryId)?.name;
              // Filter by name or slug to be robust
              let maxPosts = 7;
              if (section.categoryId === 'technology') maxPosts = 10;
              if (section.categoryId === 'lifestyle') maxPosts = 12;
              if (section.categoryId === 'world') maxPosts = 9;
              if (section.categoryId === 'news') maxPosts = 7; // 1 main, 6 list

              // Don't modify the source list, let getUniquePosts handle deduplication
              const sourceCategoryPosts = nonProvincePosts.filter(p =>
                p.category === categoryName ||
                p.category === section.categoryId ||
                (section.categoryId === 'world' && p.category === 'विश्व') ||
                (section.categoryId === 'news' && p.category === 'समाचार')
              );

              // changed from getUniquePosts to ensure absolute newest posts are shown in category blocks
              const categoryPosts = sourceCategoryPosts.slice(0, maxPosts);

              if (categoryPosts.length === 0) return null;

              if (section.categoryId === 'entertainment') {
                return <EntertainmentSection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || "मनोरञ्जन"} categorySlug="entertainment" />;
              }

              if (section.categoryId === 'technology') {
                return <TechnologySection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || categoryName || "सूचना-प्रविधि"} categorySlug="technology" />;
              }

              if (section.categoryId === 'lifestyle') {
                return <LifestyleSection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || categoryName || "जीवनशैली"} categorySlug="lifestyle" />;
              }

              if (section.categoryId === 'world') {
                return <WorldSection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || categoryName || "विश्व"} categorySlug="world" />;
              }

              if (section.categoryId === 'news' || section.title === 'समाचार') {
                return <NewsSection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || categoryName || "समाचार"} categorySlug={section.categoryId || 'news'} />;
              }

              if (section.categoryId === 'arthwyapar' || section.title === 'अर्थ/व्यापार') {
                return <BusinessSection key={section.id} posts={categoryPosts.map(serializePost)} title={section.title || categoryName || "अर्थ/व्यापार"} categorySlug={section.categoryId || 'arthwyapar'} />;
              }

              return <CategorySection key={section.id} posts={categoryPosts.slice(0, 4).map(serializePost)} title={section.title || categoryName || "समाचार"} categorySlug={section.categoryId || ''} layout={section.layout} />;
            }

            // Ad Banner
            if (section.type === 'ad') {
              if (section.adPosition) return <div key={section.id} className="max-w-7xl mx-auto px-4 my-6"><BuilderAdSection position={section.adPosition} /></div>;
              return <div key={section.id} className="max-w-7xl mx-auto px-4 my-6"><BetweenPostsAdSection /></div>;
            }

            // Headline Section
            if (section.type === 'headline') {
              if (serializedHeadlines.length === 0) return null;
              return <HeadlineSection key={section.id} posts={serializedHeadlines} />;
            }

            // Gallery Section
            if (section.type === 'gallery') {
              if (Object.keys(serializedImages).length === 0 && Object.keys(serializedVideos).length === 0) return null;
              return <GallerySection key={section.id} images={serializedImages} videos={serializedVideos} />;
            }

            // Province News Section
            if (section.type === 'province') {
              // Province news is sourced two ways:
              //  1. posts tagged with a Province (province field) from the main list, and
              //  2. posts in the "प्रदेश" category (how legacy/migrated data
              //     classifies province news) — fetched separately because they
              //     may fall outside the latest-300 window of the main list.
              const provinceSource = [
                ...posts.filter(p => p.province),
                ...provinceCategoryPosts,
              ];
              // Dedupe by _id while preserving order.
              const seen = new Set<string>();
              const provincePosts = provinceSource
                .filter(p => {
                  const id = p._id.toString();
                  if (seen.has(id)) return false;
                  seen.add(id);
                  return true;
                })
                .map(p => ({
                  _id: p._id.toString(),
                  title: p.title,
                  slug: p.slug,
                  excerpt: p.excerpt,
                  imageUrl: p.imageUrl,
                  province: p.province,
                  category: p.category,
                  createdAt: toISOString(p.createdAt)
                }));
              if (provincePosts.length === 0) return null;
              return <ProvinceNewsSection key={section.id} posts={provincePosts} />;
            }

            // Business / Economy Section (अर्थ/व्यापार) — uses a dedicated fetch
            // so the posts show even when they fall outside the latest-300 window.
            if (section.type === 'business') {
              if (businessPosts.length === 0) return null;
              return (
                <BusinessSection
                  key={section.id}
                  posts={businessPosts.slice(0, 5).map(serializePost)}
                  title={section.title || "अर्थ/व्यापार"}
                  categorySlug="arthwyapar"
                />
              );
            }

            // Rashifal Section
            if (section.type === 'rashifal') {
              return <RashifalSection key={section.id} />;
            }

            // Web Stories Section
            if (section.type === 'webstories') {
              if (webStories.length === 0) return null;
              const serializedStories = webStories.map(s => ({
                ...s,
                _id: s._id?.toString(),
                createdAt: toISOString(s.createdAt),
                updatedAt: toISOString(s.updatedAt),
              }));
              // @ts-expect-error - Serialized stories have string dates/IDs which match client expectation
              return <WebStoriesSection key={section.id} stories={serializedStories} />;
            }

            // Live Broadcast Section
            if (section.type === 'livebroadcast') {
              if (!settings?.liveBroadcast?.enabled) return null;
              return <LiveBroadcast key={section.id} settings={settings.liveBroadcast} position={settings.liveBroadcast.position || 'section'} />;
            }

            // Front Page Section (राजनीति category posts)
            if (section.type === 'frontpage') {
              const frontPosts = frontPagePosts.slice(0, 10);
              const spPosts = sportsPosts.slice(0, 6);
              const inPosts = interviewPosts.slice(0, 9);

              if (frontPosts.length === 0) return null;

              return (
                <div key={section.id}>
                  <FrontPageSection posts={frontPosts.map(serializePost)} title="राजनीति" categorySlug="political" />
                  {spPosts.length > 0 && (
                    <div className="mt-8">
                      <SportsSection posts={spPosts.map(serializePost)} />
                    </div>
                  )}
                  {inPosts.length > 0 && (
                    <div className="mt-8">
                      <InterviewSection posts={inPosts.map(serializePost)} />
                    </div>
                  )}
                </div>
              );
            }

            // Events Section
            if (section.type === 'events') {
              return <EventsSection key={section.id} events={serializedEvents} title={section.title} />;
            }

            // Celebrity Section
            if (section.type === 'celebrity') {
              if (serializedCelebrities.length === 0) return null;
              return <CelebritySection key={section.id} celebrities={serializedCelebrities} title={section.title || "सेलिब्रिटी जीवनी"} />;
            }

            return null;
          };

          let sortedSections = (settings?.homeLayout?.length ? settings.homeLayout : [
            { id: 'def-trending', type: 'trending', order: 0 } as HomeLayoutSection,
            { id: 'def-headline', type: 'headline', order: 1 } as HomeLayoutSection,
            { id: 'def-hero', type: 'hero', order: 2 } as HomeLayoutSection,
            { id: 'def-latest', type: 'latest', title: 'ताजा समाचार', order: 3 } as HomeLayoutSection,
            { id: 'def-province', type: 'province', order: 4 } as HomeLayoutSection,
            { id: 'def-gallery', type: 'gallery', order: 5 } as HomeLayoutSection,
            { id: 'def-celebrity', type: 'celebrity', order: 6 } as HomeLayoutSection,
            { id: 'def-events', type: 'events', order: 7 } as HomeLayoutSection
          ]).sort((a, b) => a.order - b.order);

          // Fallback if layout is empty
          if (sortedSections.length === 0) {
            sortedSections = [
              { id: 'section-1', type: 'trending', order: 0 },
              { id: 'section-headline', type: 'headline', order: 1 },
              { id: 'section-2', type: 'hero', order: 2 },
              { id: 'section-3', type: 'latest', title: 'प्रमुख समाचार', order: 3 },
              { id: 'ad-home1', type: 'ad', adPosition: 'home1', order: 3.2 }, // Home 1 Ad
              { id: 'section-entertainment', type: 'category', title: 'मनोरञ्जन', categoryId: 'entertainment', order: 3.5 },
              { id: 'ad-home2', type: 'ad', adPosition: 'home2', order: 3.8 }, // Home 2 Ad
              { id: 'section-business', type: 'category', title: 'विजनेस', categoryId: 'business', order: 3.9, layout: 'grid' },
              { id: 'section-4', type: 'category', title: 'राजनीति', categoryId: 'politics', order: 4 },
              { id: 'ad-home3', type: 'ad', adPosition: 'home3', order: 4.5 }, // Home 3 Ad
              { id: 'section-province', type: 'province', order: 5 },
              { id: 'section-arthwyapar', type: 'business', title: 'अर्थ/व्यापार', order: 5.1 },
              { id: 'ad-home4', type: 'ad', adPosition: 'home4', order: 5.2 }, // Home 4 Ad

              { id: 'ad-home5', type: 'ad', adPosition: 'home5', order: 6 },   // Home 5 Ad
              // removed old entertainment from here
              { id: 'section-events', type: 'events', order: 7 },
              { id: 'ad-home6', type: 'ad', adPosition: 'home6', order: 7.5 }, // Home 6 Ad
              { id: 'section-gallery', type: 'gallery', order: 8 },
              { id: 'ad-home7', type: 'ad', adPosition: 'home7', order: 8.5 }, // Home 7 Ad
              { id: 'ad-home8', type: 'ad', adPosition: 'home8', order: 9 },   // Home 8 Ad
              { id: 'ad-home9', type: 'ad', adPosition: 'home9', order: 9.5 }, // Home 9 Ad
            ];
          } else {
            // Temporary: Inject Rashifal if missing from DB settings
            if (!sortedSections.find(s => s.type === 'rashifal')) {
              const provinceIndex = sortedSections.findIndex(s => s.type === 'province');
              const order = provinceIndex !== -1
                ? sortedSections[provinceIndex].order + 0.5
                : sortedSections[sortedSections.length - 1].order + 1;

              sortedSections.push({ id: 'rashifal-auto', type: 'rashifal', order });
            }

            // Temporary: Inject Entertainment if missing
            if (!sortedSections.find(s => s.categoryId === 'entertainment')) {
              const latestIndex = sortedSections.findIndex(s => s.type === 'latest');
              const order = latestIndex !== -1 ? sortedSections[latestIndex].order + 0.5 : 3.5;
              sortedSections.push({ id: 'entertainment-auto', type: 'category', title: 'मनोरञ्जन', categoryId: 'entertainment', order });
            }

            // Inject अर्थ/व्यापार (Business) section if missing — placed right
            // after the province section (or near the end as a fallback).
            if (!sortedSections.find(s => s.type === 'business')) {
              const provinceIndex = sortedSections.findIndex(s => s.type === 'province');
              const order = provinceIndex !== -1
                ? sortedSections[provinceIndex].order + 0.1
                : sortedSections[sortedSections.length - 1].order + 1;
              sortedSections.push({ id: 'arthwyapar-auto', type: 'business', title: 'अर्थ/व्यापार', order });
            }

            // Temporary: Inject Home 1 Ad if missing (Between Latest and Entertainment)
            if (!sortedSections.find(s => s.type === 'ad' && s.adPosition === 'home1')) {
              // Try to find Latest News and put it after
              const latestIndex = sortedSections.findIndex(s => s.type === 'latest');
              const entIndex = sortedSections.findIndex(s => s.categoryId === 'entertainment');

              let order = 3.2; // Default fallback

              if (latestIndex !== -1 && entIndex !== -1) {
                // Put exactly between them
                order = (sortedSections[latestIndex].order + sortedSections[entIndex].order) / 2;
              } else if (latestIndex !== -1) {
                // After latest
                order = sortedSections[latestIndex].order + 0.2;
              } else if (entIndex !== -1) {
                // Before entertainment
                order = sortedSections[entIndex].order - 0.2;
              }

              sortedSections.push({ id: 'ad-home1-auto', type: 'ad', adPosition: 'home1', order });
            }

            // Temporary: Inject Business if missing
            if (!sortedSections.find(s => s.categoryId === 'business')) {
              const entIndex = sortedSections.findIndex(s => s.categoryId === 'entertainment');
              const order = entIndex !== -1 ? sortedSections[entIndex].order + 0.1 : 3.6;
              sortedSections.push({ id: 'business-auto', type: 'category', title: 'विजनेस', categoryId: 'business', order, layout: 'grid' });
            }

            // Temporary: Inject Technology if missing
            if (!sortedSections.find(s => s.categoryId === 'technology')) {
              const busIndex = sortedSections.findIndex(s => s.categoryId === 'business');
              const order = busIndex !== -1 ? sortedSections[busIndex].order + 0.1 : 3.7;
              sortedSections.push({ id: 'technology-auto', type: 'category', title: 'सूचना-प्रविधि', categoryId: 'technology', order });
            }

            // Temporary: Inject Lifestyle if missing
            if (!sortedSections.find(s => s.categoryId === 'lifestyle')) {
              const techIndex = sortedSections.findIndex(s => s.categoryId === 'technology');
              const order = techIndex !== -1 ? sortedSections[techIndex].order + 0.1 : 3.8;
              sortedSections.push({ id: 'lifestyle-auto', type: 'category', title: 'जीवनशैली', categoryId: 'lifestyle', order });
            }

            // Temporary: Inject News if missing
            if (!sortedSections.find(s => s.categoryId === 'news')) {
              const techIndex = sortedSections.findIndex(s => s.categoryId === 'technology');
              const order = techIndex !== -1 ? sortedSections[techIndex].order + 0.05 : 3.65;
              sortedSections.push({ id: 'news-auto', type: 'category', title: 'समाचार', categoryId: 'news', order });
            }

            // Temporary: Inject World if missing
            if (!sortedSections.find(s => s.categoryId === 'world')) {
              const lifeIndex = sortedSections.findIndex(s => s.categoryId === 'lifestyle');
              const order = lifeIndex !== -1 ? sortedSections[lifeIndex].order + 0.1 : 3.9;
              sortedSections.push({ id: 'world-auto', type: 'category', title: 'विश्व', categoryId: 'world', order });
            }

            sortedSections.sort((a, b) => a.order - b.order);
          }

          // Ensure events section is present if not in layout (Temporary auto-fix)
          if (!sortedSections.some(s => s.type === 'events')) {
            sortedSections.push({ id: 'auto-events', type: 'events', order: 99 } as HomeLayoutSection);
          }

          // Grouping logic for layout containers
          const groupedSections: { type: 'group' | 'block'; layout?: string; sections: HomeLayoutSection[] }[] = [];
          let currentGroup: HomeLayoutSection[] = [];
          let currentLayout: string | undefined = undefined;

          sortedSections.forEach((section) => {
            const layout = section.containerLayout || 'block';

            if (layout === 'block') {
              // Push any pending group
              if (currentGroup.length > 0) {
                groupedSections.push({ type: 'group', layout: currentLayout, sections: [...currentGroup] });
                currentGroup = [];
                currentLayout = undefined;
              }
              // Push current block
              groupedSections.push({ type: 'block', sections: [section] });
            } else {
              // It's grid or flex
              if (currentLayout && currentLayout !== layout) {
                // Close previous group if layout changed (e.g. grid to flex)
                groupedSections.push({ type: 'group', layout: currentLayout, sections: [...currentGroup] });
                currentGroup = [];
              }
              currentLayout = layout;
              currentGroup.push(section);
            }
          });
          // Push remaining
          if (currentGroup.length > 0) {
            groupedSections.push({ type: 'group', layout: currentLayout, sections: [...currentGroup] });
          }


          return groupedSections.map((group, groupIndex) => {
            if (group.type === 'block') {
              return renderSection(group.sections[0]);
            }

            // Render container group
            const containerClass = group.layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
              : 'flex flex-col md:flex-row gap-6 mb-8 overflow-x-auto';

            return (
              <div key={`group-${groupIndex}`} className={containerClass}>
                {group.sections.map(section => (
                  <div key={section.id} className={group.layout === 'grid' ? '' : 'flex-1 min-w-[300px]'}>
                    {renderSection(section)}
                  </div>
                ))}
              </div>
            );
          });
        })()}

        {/* More News */}
        {(() => {
          // changed from getUniquePosts to ensure absolute newest posts are shown
          const morePostsArr = nonProvincePosts.slice(0, 9).map(serializePost);
          if (morePostsArr.length === 0) return null;

          return (
            <section className="bg-[#FFF5F6] p-6 rounded-xl my-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Highlighted Post (Left) */}
                <div className="lg:col-span-1">
                  <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden h-full flex flex-col group">
                    {morePostsArr[0].imageUrl && (
                      <div className="aspect-[4/3] w-full relative overflow-hidden">
                        <Image
                          src={morePostsArr[0].imageUrl}
                          alt={morePostsArr[0].title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition duration-500"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        {morePostsArr[0].category && (
                          <span className="text-xs font-bold text-primary block uppercase tracking-wider">
                            {morePostsArr[0].category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary transition">
                        <Link href={`/post/${morePostsArr[0].slug}`} className="hover:underline decoration-2 underline-offset-4">
                          {morePostsArr[0].title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 line-clamp-4 text-sm leading-relaxed mb-4 flex-1">
                        {stripHtmlTags(morePostsArr[0].excerpt)}
                      </p>
                    </div>
                  </article>
                </div>

                {/* Grid of Smaller Posts (Right) */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {morePostsArr.slice(1, 9).map((post) => (
                      <article
                        key={post._id.toString()}
                        className="bg-white rounded-lg shadow-sm p-3 flex gap-4 hover:shadow-md transition group h-24 items-center"
                      >
                        {post.imageUrl && (
                          <div className="w-24 h-16 flex-shrink-0 relative overflow-hidden rounded">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              sizes="100px"
                              className="object-cover group-hover:scale-110 transition duration-300"
                              unoptimized
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-3 group-hover:text-primary transition">
                          <Link href={`/post/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}


        {/* Empty State */}
        {
          posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">कुनै समाचार उपलब्ध छैन</p>
              <p className="text-gray-400 mt-2">
                एडमिन प्यानलबाट पोस्ट थप्नुहोस्
              </p>
              <Link
                href="/admin/posts/new"
                className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                पोस्ट थप्नुहोस्
              </Link>
            </div>
          )
        }
      </main>

      {/* Footer Banner Ad */}
      <div className="max-w-7xl mx-auto px-4">
        <FooterAdSection />
      </div>

      {/* Footer */}
      < Footer
        settings={settings?.footerSettings || {
          aboutText: "",
          showAbout: true,
          columns: [],
          contactEmail: "",
          contactPhone: "",
          contactAddress: "",
          showContact: true,
          socialLinks: [],
          showSocial: true,
          showNewsletter: true,
          newsletterTitle: "",
          newsletterDescription: "",
          showAppDownload: false,
          appStoreUrl: "",
          playStoreUrl: "",
          copyrightText: "",
          showCopyright: true,
          backgroundColor: "#0f172a",
          textColor: "#94a3b8",
          accentColor: "#e61e2b",
          layout: "modern",
        } as import("@/models/Settings").FooterSettings}
        siteName={settings?.siteName || "MeroNepalTv"}
        logoUrl={settings?.logoUrl || ""}
        logoText={settings?.logoText || "MeroNepalTv"}
      />
    </div >
  );
}
