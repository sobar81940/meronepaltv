import type { Metadata } from "next";
import { Geist, Geist_Mono, Khand } from "next/font/google";
import "./globals.css";
import SettingsModel from "@/models/Settings";
import ThemeProvider from "@/components/ThemeProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import Script from "next/script";
import { getStoragePublicUrl } from "@/lib/spaces";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent FOIT, improve performance
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const khand = Khand({
  variable: "--font-khand",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const DEFAULT_SITE_URL = "https://meronepaltv.com";
const DEFAULT_SITE_NAME = "MeroNepalTv";
const DEFAULT_DESCRIPTION = "MeroNepalTv.com is Nepal's entertainment and news portal for Nepali films, celebrities, music, technology, sports and the latest news.";

const normalizeSiteUrl = (url: string) => url.replace(/\/$/, "");

const getSiteUrlFromSettings = (settings?: {
  seoSettings?: { canonicalUrl?: string };
}) => {
  return normalizeSiteUrl(settings?.seoSettings?.canonicalUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
};

// Generate dynamic metadata including favicon and Open Graph
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await SettingsModel.get();

    const siteUrl = getSiteUrlFromSettings(settings);
    const siteName = settings.siteName || DEFAULT_SITE_NAME;
    const siteDescription = settings.seoSettings?.siteDescription || settings.siteTagline || DEFAULT_DESCRIPTION;

    const configuredOgImage = settings.seoSettings?.ogImage;
    const ogImage = configuredOgImage && !configuredOgImage.endsWith("/images/og-image.png")
      ? configuredOgImage
      : "/images/og-image.jpg";

    const faviconUrl = settings.faviconUrl || "/favicon.ico";
    const icons: Metadata['icons'] = {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    };

    return {
      title: {
        default: siteName,
        template: `%s | ${siteName}`,
      },
      description: siteDescription,
      icons,
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
      },

      // Open Graph - Facebook, Instagram, LinkedIn
      openGraph: {
        type: "website",
        siteName: siteName,
        title: siteName,
        description: siteDescription,
        url: siteUrl,
        locale: "ne_NP",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: siteName,
            type: "image/jpeg",
          },
        ],
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        site: settings.seoSettings?.twitterHandle || undefined,
        title: siteName,
        description: siteDescription,
        images: [ogImage],
      },

      // Keywords
      keywords: settings.seoSettings?.siteKeywords || undefined,

      // Webmaster Tools Verification
      verification: {
        google: settings.seoSettings?.googleSiteVerification || "_MJLvjoQcmKVhzWjn5xJUtJqiUclqm6EXyMLtkUu1MA",
        other: settings.seoSettings?.bingSiteVerification ? {
          bing: settings.seoSettings.bingSiteVerification,
        } : undefined,
      },

      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
    return {
      title: {
        default: DEFAULT_SITE_NAME,
        template: `%s | ${DEFAULT_SITE_NAME}`,
      },
      description: DEFAULT_DESCRIPTION,
      metadataBase: new URL(DEFAULT_SITE_URL),
      alternates: {
        canonical: DEFAULT_SITE_URL,
      },
      openGraph: {
        type: "website",
        siteName: DEFAULT_SITE_NAME,
        title: DEFAULT_SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        url: DEFAULT_SITE_URL,
        locale: "ne_NP",
        images: [{ url: `${DEFAULT_SITE_URL}/images/og-image.jpg`, width: 1200, height: 630, alt: DEFAULT_SITE_NAME, type: "image/jpeg" }],
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        images: [`${DEFAULT_SITE_URL}/images/og-image.jpg`],
      },
      robots: {
        index: true,
        follow: true,
      },
      icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/favicon.ico",
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings on the server
  let settings;
  let themeSettings;
  let seoSettings;
  try {
    settings = await SettingsModel.get();
    themeSettings = settings.themeSettings;
    seoSettings = settings.seoSettings;
  } catch (error) {
    console.error("Failed to fetch settings for layout:", error);
  }

  const siteUrl = getSiteUrlFromSettings(settings);
  const mediaBaseUrl = getStoragePublicUrl();
  let mediaOrigin = mediaBaseUrl;
  try {
    mediaOrigin = new URL(mediaBaseUrl).origin;
  } catch {
    // Keep the configured value if it is not an absolute URL.
  }

  const initialThemeMode = themeSettings?.theme === "dark" ? "dark" : "light";

  return (
    <html lang="ne" className={initialThemeMode} style={{ colorScheme: initialThemeMode }}>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href={mediaOrigin} />
        <link rel="dns-prefetch" href={mediaOrigin} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} ${khand.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              "@id": `${siteUrl}/#organization`,
              "name": settings?.siteName || "MeroNepalTv",
              "alternateName": ["MeroNepalTv", "MeroNepalTv News", "MeroNepalTv Nepal"],
              "legalName": settings?.siteName || "MeroNepalTv",
              "url": siteUrl,
              "logo": {
                "@type": "ImageObject",
                "@id": `${siteUrl}/#logo`,
                "url": settings?.logoUrl
                  ? (settings.logoUrl.startsWith("http") ? settings.logoUrl : `${siteUrl}${settings.logoUrl}`)
                  : `${siteUrl}/images/og-image.jpg`,
                "contentUrl": settings?.logoUrl
                  ? (settings.logoUrl.startsWith("http") ? settings.logoUrl : `${siteUrl}${settings.logoUrl}`)
                  : `${siteUrl}/images/og-image.jpg`,
                "width": 512,
                "height": 512,
                "caption": settings?.siteName || "MeroNepalTv",
              },
              "image": settings?.seoSettings?.ogImage
                ? (settings.seoSettings.ogImage.startsWith("http") ? settings.seoSettings.ogImage : `${siteUrl}${settings.seoSettings.ogImage}`)
                : `${siteUrl}/images/og-image.jpg`,
              "description": settings?.seoSettings?.siteDescription || settings?.siteTagline || "MeroNepalTv - नेपालको विश्वसनीय समाचार पोर्टल। ताजा समाचार, मनोरञ्जन, खेलकुद, राशिफल र थप।",
              "inLanguage": ["ne", "ne-NP"],
              "areaServed": {
                "@type": "Country",
                "name": "Nepal",
                "sameAs": "https://www.wikidata.org/wiki/Q837",
              },
              "knowsAbout": [
                "Nepali News",
                "Nepal Politics",
                "Nepal Entertainment",
                "Nepal Sports",
                "Nepali Cinema",
                "Nepal Current Affairs",
                "Rashifal",
                "Nepali Celebrity",
              ],
              "publishingPrinciples": `${siteUrl}/about`,
              "masthead": `${siteUrl}/about`,
              "contactPoint": settings?.footerSettings?.contactEmail ? {
                "@type": "ContactPoint",
                "contactType": "editorial",
                "email": settings.footerSettings.contactEmail,
                "availableLanguage": ["Nepali", "English"],
              } : {
                "@type": "ContactPoint",
                "contactType": "editorial",
                "availableLanguage": ["Nepali", "English"],
              },
              "sameAs": (settings?.footerSettings?.socialLinks || [])
                .filter((l: { enabled: boolean }) => l.enabled)
                .map((l: { url: string }) => l.url),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${siteUrl}/#website`,
              "name": settings?.siteName || "MeroNepalTv",
              "alternateName": ["MeroNepalTv", "MeroNepalTv News Portal"],
              "url": siteUrl,
              "inLanguage": "ne-NP",
              "description": settings?.seoSettings?.siteDescription || settings?.siteTagline || "MeroNepalTv News Portal",
              "publisher": {
                "@id": `${siteUrl}/#organization`,
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${siteUrl}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg"
        >
          मुख्य सामग्रीमा जानुहोस्
        </a>

        <ThemeProvider themeSettings={themeSettings}>
          {children}
          <MobileBottomNav mediaBaseUrl={mediaBaseUrl} />
        </ThemeProvider>

        {/* Google Analytics (from site settings or NEXT_PUBLIC_GOOGLE_ANALYTICS) */}
        {(() => {
          const gaId = seoSettings?.googleAnalyticsId
            || process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS
            || "G-RHWREMTQ8L";
          if (!gaId) return null;

          return (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              />
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);} 
                    gtag('js', new Date());
                    gtag('config', '${gaId}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          );
        })()}
      </body>
    </html>
  );
}

// Forced rebuild
