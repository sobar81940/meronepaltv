import { Collection, ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "meronepaltv";

export interface NavItem {
    name: string;
    nameNe?: string;
    nameEn?: string;
    href: string;
    order: number;
}

export interface TrendingTopic {
    tag: string;
    order: number;
    imageUrl?: string;
}

export interface SubCategory {
    name: string;
    href: string;
}

export interface MegaMenuCategory {
    name: string;
    subcategories: SubCategory[];
}

export interface ThemeSettings {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
}

export interface SocialMediaSettings {
    twitter: {
        enabled: boolean;
        apiKey: string;
        apiSecret: string;
        accessToken: string;
        accessTokenSecret: string;
    };
    facebook: {
        enabled: boolean;
        pageAccessToken: string;
        pageId: string;
    };
    instagram: {
        enabled: boolean;
        accessToken: string;
        accountId: string;
    };
    youtube: {
        enabled: boolean;
        clientId: string;
        clientSecret: string;
        refreshToken: string;
    };
}

export interface SeoSettings {
    siteTitle: string;
    siteDescription: string;
    siteKeywords: string[];
    ogImage: string;
    twitterHandle: string;
    googleAnalyticsId: string;
    googleSiteVerification: string;
    bingSiteVerification: string;
    robotsTxt: string;
    enableSitemap: boolean;
    canonicalUrl: string;
}

export interface FooterLink {
    name: string;
    href: string;
    order: number;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
    order: number;
}

export interface SocialLink {
    platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'whatsapp' | 'telegram';
    url: string;
    enabled: boolean;
}

export interface FooterSettings {
    // About section
    aboutText: string;
    showAbout: boolean;

    // Quick links columns
    columns: FooterColumn[];

    // Contact info
    companyName?: string; // Optional footer company/legal name (falls back to siteName)
    registrationNumber?: string; // Optional "सूचना विभाग दर्ता नं" value
    pressCouncilNumber?: string; // Optional "प्रेस काउन्सिल दर्ता नं" value
    operatorName?: string; // Optional "संचालक" (operator/director) name
    editorName?: string; // Optional "सम्पादक" (editor) name
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    showContact: boolean;

    // Social links
    socialLinks: SocialLink[];
    showSocial: boolean;

    // Newsletter
    showNewsletter: boolean;
    newsletterTitle: string;
    newsletterDescription: string;
    newsletterPlaceholder?: string; // email input placeholder
    newsletterButtonText?: string; // subscribe button label

    // Bottom bar
    bottomBarLinks?: FooterLink[]; // utility links (Site Map / Privacy / Terms); order = array index
    designedWithText?: string; // text shown around the red heart in the bottom bar

    // Decoration
    showMountain?: boolean; // toggle the decorative mountain image (default true)

    // App download
    showAppDownload: boolean;
    appStoreUrl: string;
    playStoreUrl: string;

    // Copyright
    copyrightText: string;
    showCopyright: boolean;

    // Design
    backgroundColor: string;
    backgroundImage?: string; // Optional footer background image URL (overlays the gradient when set)
    textColor: string;
    accentColor: string;
    layout: 'standard' | 'minimal' | 'modern';
}

export interface LiveBroadcastSettings {
    enabled: boolean;
    title: string;
    description: string;
    // Platform links
    facebookLiveUrl: string;
    youtubeLiveUrl: string;
    customEmbedUrl: string;
    // Active platform for display
    activePlatform: 'facebook' | 'youtube' | 'custom' | 'none';
    // Scheduling
    isScheduled: boolean;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    // Display settings
    autoplay: boolean;
    showChat: boolean;
    position: 'top' | 'sidebar' | 'section';
}

export interface HomeLayoutSection {
    id: string;
    type: 'hero' | 'trending' | 'latest' | 'category' | 'ad' | 'headline' | 'gallery' | 'province' | 'webstories' | 'livebroadcast' | 'frontpage' | 'events' | 'celebrity' | 'rashifal' | 'business';
    title?: string;
    categoryId?: string;
    layout?: 'grid' | 'list' | 'featured' | 'magazine';
    adPosition?: string;
    showTitle?: boolean;
    order: number;
    containerLayout?: 'grid' | 'block' | 'flex';
}

export interface SiteSettings {
    _id?: ObjectId;
    navigations: NavItem[];
    trending: TrendingTopic[];
    megaMenu: MegaMenuCategory[];
    siteName: string;
    siteTagline: string;
    logoText: string;
    logoUrl: string;
    faviconUrl: string;
    // Display settings
    showSiteName: boolean;
    showSiteTagline: boolean;
    showLogoText: boolean;
    logoSize: 'small' | 'medium' | 'large';
    // Theme settings
    themeSettings: ThemeSettings;
    // SEO settings
    seoSettings: SeoSettings;
    // Social Media settings
    socialMedia: SocialMediaSettings;
    // Home Layout
    homeLayout: HomeLayoutSection[];
    // Footer Settings
    footerSettings: FooterSettings;
    // Live Broadcast Settings
    liveBroadcast: LiveBroadcastSettings;
    updatedAt: Date;
}

// Default settings
const defaultSettings: Omit<SiteSettings, "_id"> = {
    navigations: [
        { name: "होमपेज", nameNe: "होमपेज", nameEn: "Home", href: "/", order: 0 },
        { name: "विदेशी मुद्रा", nameNe: "विदेशी मुद्रा", nameEn: "Forex", href: "/forex", order: 1 },
        { name: "ज्योतिष", nameNe: "ज्योतिष", nameEn: "Astrology", href: "/jyotish", order: 2 },
        { name: "राशिफल", nameNe: "राशिफल", nameEn: "Horoscope", href: "/rashifal", order: 3 },
        { name: "कार्यक्रम", nameNe: "कार्यक्रम", nameEn: "Events", href: "/event", order: 4 },
        { name: "वेबस्टोरिज", nameNe: "वेबस्टोरिज", nameEn: "Web stories", href: "/web-stories", order: 5 },
        { name: "विकि", nameNe: "विकि", nameEn: "Wiki", href: "/wiki", order: 6 },
        { name: "ग्याजेट", nameNe: "ग्याजेट", nameEn: "Gadgets", href: "/gadgets", order: 7 },
        { name: "समाचार", nameNe: "समाचार", nameEn: "News", href: "/news", order: 8 },
    ],
    trending: [],
    // Default Home Layout
    homeLayout: [
        { id: 'section-1', type: 'trending', order: 0 },
        { id: 'section-headline', type: 'headline', order: 1 },
        { id: 'section-2', type: 'hero', order: 2 },
        { id: 'section-3', type: 'latest', title: 'प्रमुख समाचार', order: 3, layout: 'grid' },
        { id: 'section-4', type: 'category', title: 'राजनीति', categoryId: 'politics', order: 4, layout: 'magazine' },
        { id: 'section-5', type: 'category', title: 'मनोरंजन', categoryId: 'entertainment', order: 5, layout: 'grid' },
        { id: 'section-business', type: 'category', title: 'विजनेस', categoryId: 'business', order: 5.5, layout: 'grid' },
        { id: 'section-technology', type: 'category', title: 'सूचना-प्रविधि', categoryId: 'technology', order: 5.8, layout: 'grid' },
        { id: 'section-lifestyle', type: 'category', title: 'जीवनशैली', categoryId: 'lifestyle', order: 5.9, layout: 'grid' },
        { id: 'section-province', type: 'province', order: 6 },
        { id: 'section-events', type: 'events', order: 7 },
        { id: 'section-gallery', type: 'gallery', order: 8 },
    ],
    megaMenu: [
        {
            name: "गहिराईमा",
            subcategories: [
                { name: "विश्लेषण", href: "/analysis" },
                { name: "कभरेज", href: "/coverage" },
                { name: "अर्थव्यवस्था", href: "/economy" },
                { name: "बीमा", href: "/insurance" },
                { name: "साझिल", href: "/sajil" },
            ]
        },
        {
            name: "अन्तर्वार्ता",
            subcategories: [
                { name: "माइग्रेशन", href: "/migration" },
                { name: "पर्यटन", href: "/tourism" },
                { name: "विविध", href: "/bibidha" },
                { name: "विचार", href: "/view" },
                { name: "राजनीति-सामाजिक", href: "/politics" },
            ]
        },
        {
            name: "विकी श्रेणी",
            subcategories: [
                { name: "क्रिप्टोकरेंसी", href: "/crypto" },
                { name: "चलचित्र", href: "/movies" },
                { name: "स्वास", href: "/health" },
                { name: "प्रविधि", href: "/tech" },
                { name: "सम्पन्नजनु", href: "/wealthy" },
            ]
        },
        {
            name: "ग्याजेटहरू",
            subcategories: [
                { name: "मोबाइल", href: "/mobile" },
                { name: "ल्यापटप", href: "/laptop" },
                { name: "न्यायप्रण", href: "/judiciary" },
                { name: "लोकप्रिय ब्राउज़र", href: "/browsers" },
            ]
        },
        {
            name: "थप",
            subcategories: [
                { name: "वेबस्टोरिज", href: "/web-stories" },
                { name: "विशेष कार्यक्रम", href: "/special-events" },
                { name: "पोल संग्रह", href: "/polls" },
                { name: "विकि", href: "/wiki" },
                { name: "समाचार", href: "/news" },
            ]
        },
        {
            name: "कम्पनी",
            subcategories: [
                { name: "सम्पर्क", href: "/contact" },
                { name: "हाम्रो टिम", href: "/team" },
            ]
        },
    ],
    siteName: "MeroNepalTv",
    siteTagline: "",
    logoText: "MeroNepalTv",
    logoUrl: "",
    faviconUrl: "",
    // Display settings defaults
    showSiteName: true,
    showSiteTagline: true,
    showLogoText: true,
    logoSize: 'medium',
    // Theme settings defaults
    themeSettings: {
        theme: 'light',
        primaryColor: '#e61e2b',
        secondaryColor: '#005677',
        accentColor: '#f59e0b',
    },
    // SEO Settings Defaults
    seoSettings: {
        siteTitle: '',
        siteDescription: '',
        siteKeywords: [],
        ogImage: '',
        twitterHandle: '',
        googleAnalyticsId: '',
        googleSiteVerification: '',
        bingSiteVerification: '',
        robotsTxt: 'User-agent: *\nAllow: /',
        enableSitemap: true,
        canonicalUrl: '',
    },
    // Social Media Defaults
    socialMedia: {
        twitter: {
            enabled: false,
            apiKey: "",
            apiSecret: "",
            accessToken: "",
            accessTokenSecret: ""
        },
        facebook: {
            enabled: false,
            pageAccessToken: "",
            pageId: ""
        },
        instagram: {
            enabled: false,
            accessToken: "",
            accountId: ""
        },
        youtube: {
            enabled: false,
            clientId: "",
            clientSecret: "",
            refreshToken: ""
        }
    },
    // Footer Settings Defaults
    footerSettings: {
        aboutText: "नेपालको विश्वसनीय समाचार स्रोत। हामी तपाईंलाई ताजा र सही समाचार प्रदान गर्न प्रतिबद्ध छौं।",
        showAbout: true,
        columns: [
            {
                title: "द्रुत लिंकहरू",
                order: 0,
                links: [
                    { name: "होमपेज", href: "/", order: 0 },
                    { name: "समाचार", href: "/news", order: 1 },
                    { name: "मनोरञ्जन", href: "/entertainment", order: 2 },
                    { name: "खेलकुद", href: "/sports", order: 3 },
                ]
            },
            {
                title: "कम्पनी",
                order: 1,
                links: [
                    { name: "हाम्रो बारेमा", href: "/about", order: 0 },
                    { name: "सम्पर्क", href: "/contact", order: 1 },
                    { name: "विज्ञापन", href: "/advertise", order: 2 },
                    { name: "करियर", href: "/careers", order: 3 },
                ]
            },
            {
                title: "कानुनी",
                order: 2,
                links: [
                    { name: "गोपनीयता नीति", href: "/privacy", order: 0 },
                    { name: "सेवाका शर्तहरू", href: "/terms", order: 1 },
                    { name: "कुकी नीति", href: "/cookies", order: 2 },
                ]
            }
        ],
        companyName: "",
        registrationNumber: "",
        pressCouncilNumber: "",
        operatorName: "",
        editorName: "",
        contactEmail: "info@example.com",
        contactPhone: "+977-1-4000000",
        contactAddress: "काठमाडौं, नेपाल",
        showContact: true,
        socialLinks: [
            { platform: "facebook", url: "https://www.facebook.com/profile.php?id=100090291885611", enabled: true },
            { platform: "twitter", url: "https://twitter.com", enabled: true },
            { platform: "instagram", url: "https://instagram.com", enabled: true },
            { platform: "youtube", url: "https://www.youtube.com/@MeroNepalTvtv", enabled: true },
            { platform: "tiktok", url: "", enabled: false },
            { platform: "linkedin", url: "", enabled: false },
            { platform: "whatsapp", url: "", enabled: false },
            { platform: "telegram", url: "", enabled: false },
        ],
        showSocial: true,
        showNewsletter: true,
        newsletterTitle: "न्यूजलेटर सदस्यता लिनुहोस्",
        newsletterDescription: "ताजा समाचार सिधा तपाईंको इमेलमा प्राप्त गर्नुहोस्",
        newsletterPlaceholder: "तपाईंको इमेल ठेगाना",
        newsletterButtonText: "सदस्यता लिनुहोस्",
        bottomBarLinks: [
            { name: "Site Map", href: "/sitemap.xml", order: 0 },
            { name: "Privacy Policy", href: "/privacy-policy", order: 1 },
            { name: "Terms of Use", href: "/terms-of-service", order: 2 },
        ],
        designedWithText: "Designed with {heart} for a better Nepal",
        showMountain: true,
        showAppDownload: false,
        appStoreUrl: "",
        playStoreUrl: "",
        copyrightText: "© {year} {siteName}। सर्वाधिकार सुरक्षित।",
        showCopyright: true,
        backgroundColor: "#0f172a",
        backgroundImage: "",
        textColor: "#94a3b8",
        accentColor: "#e61e2b",
        layout: "modern",
    },
    // Live Broadcast Defaults
    liveBroadcast: {
        enabled: false,
        title: "लाइभ प्रसारण",
        description: "हाम्रो लाइभ स्ट्रिम हेर्नुहोस्",
        facebookLiveUrl: "",
        youtubeLiveUrl: "",
        customEmbedUrl: "",
        activePlatform: "none",
        isScheduled: false,
        scheduledStartTime: undefined,
        scheduledEndTime: undefined,
        autoplay: false,
        showChat: false,
        position: "section",
    },
    updatedAt: new Date(),
};

async function getCollection(): Promise<Collection<SiteSettings>> {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    return db.collection<SiteSettings>("settings");
}

const SettingsModel = {
    // Get settings (creates default if none exist)
    async get(): Promise<SiteSettings> {
        const collection = await getCollection();

        // Use findOneAndUpdate with upsert to ensure only one document exists
        const result = await collection.findOneAndUpdate(
            {}, // Match any document (should only be one)
            {
                $setOnInsert: {
                    ...defaultSettings,
                    updatedAt: new Date(),
                }
            },
            {
                upsert: true,
                returnDocument: "after"
            }
        );

        if (!result) {
            throw new Error('Failed to get settings');
        }

        // Merge with defaults so missing fields (e.g. footerSettings added later)
        // are filled in from defaults instead of being overridden with undefined
        const merged = { ...defaultSettings } as Record<string, unknown>;
        for (const [key, value] of Object.entries(result)) {
            if (value !== undefined) {
                merged[key] = value;
            }
        }
        merged.updatedAt = result.updatedAt;
        return merged as unknown as SiteSettings;
    },

    // Update settings
    async update(data: Partial<Omit<SiteSettings, "_id" | "updatedAt">>): Promise<SiteSettings | null> {
        const collection = await getCollection();
        const settings = await this.get();

        const result = await collection.findOneAndUpdate(
            { _id: settings._id },
            {
                $set: {
                    ...data,
                    updatedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        return result;
    },

    // Update navigation items
    async updateNavigation(navigations: NavItem[]): Promise<SiteSettings | null> {
        return this.update({ navigations });
    },

    // Update trending topics
    async updateTrending(trending: TrendingTopic[]): Promise<SiteSettings | null> {
        return this.update({ trending });
    },
};

export default SettingsModel;
