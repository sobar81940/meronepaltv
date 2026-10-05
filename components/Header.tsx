"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Moon, Sun, Menu, TrendingUp, Calendar, BarChart3, X, Globe, Briefcase, TrendingUp as ChartIcon, Heart, Leaf, Film, Gamepad2, MessageCircle, Sparkles, Home, Newspaper, Users, Award, MapPin, Zap, BookOpen, Mic2, Camera, Music, Plane, Facebook, Youtube, Twitter, Instagram, User, ChevronDown, Radio } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import NepaliDate from "nepali-date-converter";
import LiveBroadcast from "@/components/LiveBroadcast";
import type { LiveBroadcastSettings } from "@/models/Settings";

// Convert English numbers to Nepali numerals
function toNepaliNumerals(num: number | string): string {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit)]);
}

interface NavItem {
    name: string;
    href: string;
    order: number;
}

interface TrendingTopic {
    tag: string;
    order: number;
    imageUrl?: string;
    iconName?: string;
}

interface SubCategory {
    name: string;
    href: string;
}

interface MegaMenuCategory {
    name: string;
    subcategories: SubCategory[];
}

interface CategoryItem {
    _id: string;
    name: string;
    slug: string;
    color?: string;
    isNew?: boolean;
}

interface SocialLinkItem {
    platform: string;
    url: string;
    enabled: boolean;
}

interface HeadlinePost {
    _id: string;
    title: string;
    slug: string;
}

// Icon mapping for categories
const categoryIcons: { [key: string]: React.ComponentType<{ size?: number; className?: string }> } = {
    'home': Home,
    'news': Newspaper,
    'business': Briefcase,
    'market': ChartIcon,
    'health': Heart,
    'lifestyle': Leaf,
    'entertainment': Film,
    'calendar': Calendar,
    'sports': Gamepad2,
    'opinion': MessageCircle,
    'horoscope': Sparkles,
    'world': Globe,
    'politics': Users,
    'technology': Zap,
    'education': BookOpen,
    'interview': Mic2,
    'photo': Camera,
    'music': Music,
    'travel': Plane,
    'award': Award,
    'local': MapPin,
    'default': Newspaper
};

// Get icon for category based on name/slug
function getCategoryIcon(name: string, slug: string) {
    const lowerName = name.toLowerCase();
    const lowerSlug = slug.toLowerCase();

    // Check common keywords
    if (lowerName.includes('समाचार') || lowerSlug.includes('news') || lowerSlug.includes('samachar')) return categoryIcons['news'];
    if (lowerName.includes('बिजनेस') || lowerSlug.includes('business')) return categoryIcons['business'];
    if (lowerName.includes('सेयर') || lowerName.includes('मार्केट') || lowerSlug.includes('market') || lowerSlug.includes('share')) return categoryIcons['market'];
    if (lowerName.includes('स्वास्थ्य') || lowerSlug.includes('health')) return categoryIcons['health'];
    if (lowerName.includes('जीवनशैली') || lowerSlug.includes('lifestyle')) return categoryIcons['lifestyle'];
    if (lowerName.includes('मनोरन्जन') || lowerSlug.includes('entertainment')) return categoryIcons['entertainment'];
    if (lowerName.includes('पात्रो') || lowerSlug.includes('patro') || lowerSlug.includes('calendar')) return categoryIcons['calendar'];
    if (lowerName.includes('खेलकुद') || lowerSlug.includes('sports') || lowerSlug.includes('khelkud')) return categoryIcons['sports'];
    if (lowerName.includes('विचार') || lowerSlug.includes('opinion') || lowerSlug.includes('bichar')) return categoryIcons['opinion'];
    if (lowerName.includes('राशिफल') || lowerSlug.includes('rashifal') || lowerSlug.includes('horoscope')) return categoryIcons['horoscope'];
    if (lowerName.includes('विश्व') || lowerSlug.includes('world') || lowerSlug.includes('international')) return categoryIcons['world'];
    if (lowerName.includes('राजनीति') || lowerSlug.includes('politics')) return categoryIcons['politics'];
    if (lowerName.includes('प्रविधि') || lowerSlug.includes('technology') || lowerSlug.includes('tech')) return categoryIcons['technology'];
    if (lowerName.includes('शिक्षा') || lowerSlug.includes('education')) return categoryIcons['education'];
    if (lowerName.includes('अन्तर्वार्ता') || lowerSlug.includes('interview')) return categoryIcons['interview'];
    if (lowerName.includes('फोटो') || lowerSlug.includes('photo') || lowerSlug.includes('gallery')) return categoryIcons['photo'];
    if (lowerName.includes('प्रदेश') || lowerSlug.includes('province') || lowerSlug.includes('local')) return categoryIcons['local'];

    return categoryIcons['default'];
}

// Get icon background color based on category
function getCategoryIconBg(name: string, slug: string, color?: string): string {
    if (color) return color;

    const lowerName = name.toLowerCase();
    const lowerSlug = slug.toLowerCase();

    if (lowerName.includes('समाचार') || lowerSlug.includes('news')) return '#4CAF50';
    if (lowerName.includes('बिजनेस') || lowerSlug.includes('business')) return '#2196F3';
    if (lowerName.includes('सेयर') || lowerSlug.includes('market')) return '#FF5722';
    if (lowerName.includes('स्वास्थ्य') || lowerSlug.includes('health')) return '#E91E63';
    if (lowerName.includes('जीवनशैली') || lowerSlug.includes('lifestyle')) return '#8BC34A';
    if (lowerName.includes('मनोरन्जन') || lowerSlug.includes('entertainment')) return '#9C27B0';
    if (lowerName.includes('पात्रो') || lowerSlug.includes('patro')) return '#FFC107';
    if (lowerName.includes('खेलकुद') || lowerSlug.includes('sports')) return '#CDDC39';
    if (lowerName.includes('विचार') || lowerSlug.includes('opinion')) return '#00BCD4';
    if (lowerName.includes('राशिफल') || lowerSlug.includes('rashifal')) return '#FFA726';

    return '#607D8B';
}

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [nepaliDateStr, setNepaliDateStr] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [englishDateStr, setEnglishDateStr] = useState("");
    const [categories, setCategories] = useState<NavItem[]>([]);
    const [trending, setTrending] = useState<TrendingTopic[]>([]);
    const [megaMenu, setMegaMenu] = useState<MegaMenuCategory[]>([]);
    const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
    const [siteName, setSiteName] = useState("");
    const [siteTagline, setSiteTagline] = useState("");
    const [logoText, setLogoText] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    // Display settings
    const [showSiteName, setShowSiteName] = useState(false);
    const [showSiteTagline, setShowSiteTagline] = useState(false);
    const [showLogoText, setShowLogoText] = useState(false);
    const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
    // Social links from footer settings
    const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
    // Breaking-news headline posts for the ticker row
    const [headlinePosts, setHeadlinePosts] = useState<HeadlinePost[]>([]);
    const [liveBroadcast, setLiveBroadcast] = useState<LiveBroadcastSettings | null>(null);
    const megaMenuRef = useRef<HTMLDivElement>(null);
    // Client-side only flag to prevent hydration mismatch
    const [isClient, setIsClient] = useState(false);
    const pathname = usePathname();

    // Logo size classes based on setting
    const logoSizeClasses = {
        small: 'w-24 md:w-32',
        medium: 'w-32 md:w-40',
        large: 'w-40 md:w-48'
    };

    useEffect(() => {
        // Mark as client-side to prevent hydration mismatch
        const clientTimer = setTimeout(() => setIsClient(true), 0);

        // Fetch settings from API
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setCategories(data.data.navigations || []);
                    const savedTrending: TrendingTopic[] = data.data.trending || [];
                    setMegaMenu(data.data.megaMenu || []);
                    setSiteName(data.data.siteName || "rangamanch");
                    setSiteTagline(data.data.siteTagline || "rangamanch news");
                    setLogoText(data.data.logoText || "");
                    setLogoUrl(data.data.logoUrl || "");
                    // Display settings
                    setShowSiteName(data.data.showSiteName ?? false);
                    setShowSiteTagline(data.data.showSiteTagline ?? false);
                    setShowLogoText(data.data.showLogoText ?? false);
                    setLogoSize(data.data.logoSize || 'medium');
                    setLiveBroadcast(data.data.liveBroadcast || null);
                    // Social links from footer settings (for the top utility bar)
                    setSocialLinks(data.data.footerSettings?.socialLinks || []);

                    if (savedTrending.length > 0) {
                        setTrending(savedTrending);
                    } else {
                        // No trending set by admin — auto-fetch top 8 most-viewed post tags this week
                        fetch("/api/tags?sort=views&limit=8&period=week")
                            .then((r) => r.json())
                            .then((tagData) => {
                                if (tagData.success && tagData.data?.length) {
                                    const autoTrending: TrendingTopic[] = tagData.data.map(
                                        (t: { tag: string }, i: number) => ({
                                            tag: t.tag.startsWith('#') ? t.tag : `#${t.tag}`,
                                            order: i,
                                        })
                                    );
                                    setTrending(autoTrending);
                                }
                            })
                            .catch(console.error);
                    }
                }
            })
            .catch(console.error);

        // Fetch categories from database
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    // Mark some categories as new (e.g., recently created within 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const categoriesWithNew = data.data.map((cat: CategoryItem & { createdAt?: string }) => ({
                        ...cat,
                        isNew: cat.createdAt ? new Date(cat.createdAt) > thirtyDaysAgo : false
                    }));
                    setDbCategories(categoriesWithNew);
                }
            })
            .catch(console.error);

        // Fetch breaking-news headline posts for the ticker row
        fetch("/api/posts?published=true&limit=8")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) {
                    setHeadlinePosts(
                        data.data
                            .filter((p: HeadlinePost) => p && p.title && p.slug)
                            .map((p: HeadlinePost) => ({ _id: p._id, title: p.title, slug: p.slug }))
                    );
                }
            })
            .catch(console.error);

        // Close mega menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setMegaMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Get real Nepali date from English date
        const nepDate = new NepaliDate(new Date());
        const weekdays = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहिवार", "शुक्रवार", "शनिवार"];
        const months = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत"];

        const dayOfWeek = weekdays[nepDate.getDay()];
        const day = toNepaliNumerals(nepDate.getDate());
        const month = months[nepDate.getMonth()];
        const year = toNepaliNumerals(nepDate.getYear());

        // Current English date, e.g. "15 January 2025"
        const engDate = new Date();
        const engStr = engDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const dateTimer = setTimeout(() => {
            setNepaliDateStr(`${day} ${month} ${year}, ${dayOfWeek}`);
            setEnglishDateStr(engStr);
        }, 0);

        // Update time every second with Nepali numerals
        const updateTime = () => {
            const now = new Date();
            const hours = toNepaliNumerals(now.getHours().toString().padStart(2, '0'));
            const minutes = toNepaliNumerals(now.getMinutes().toString().padStart(2, '0'));
            const seconds = toNepaliNumerals(now.getSeconds().toString().padStart(2, '0'));
            setCurrentTime(`${hours}:${minutes}:${seconds}`);
        };
        const initialTimeTimer = setTimeout(() => updateTime(), 0);
        const timer = setInterval(updateTime, 1000);
        return () => {
            clearTimeout(clientTimer);
            clearTimeout(dateTimer);
            clearTimeout(initialTimeTimer);
            clearInterval(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Resolve a social link URL by platform from footer settings.
    // Falls back to '#' when the platform is missing, disabled, or has no url.
    const socialHref = (platform: string): string => {
        const match = socialLinks.find(
            (s) => s.platform === platform && s.enabled && s.url
        );
        return match ? match.url : "#";
    };

    return (
        <header className="w-full bg-white sticky top-0 z-50 shadow-sm" ref={megaMenuRef}>
            {/* Mobile Top Date/Time Bar */}
            <div className="md:hidden bg-[#2260BF] text-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between py-1.5 text-xs">
                        <div className="flex items-center gap-2" suppressHydrationWarning>
                            <Calendar size={12} className="text-white/70" />
                            <span suppressHydrationWarning>
                                {isClient ? nepaliDateStr : ""}
                            </span>
                            <span className="text-white/70" suppressHydrationWarning>
                                ⏰ {isClient ? (currentTime || "००:००:००") : "००:००:००"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-1 text-white/70 hover:text-white transition"
                                aria-label={darkMode ? "लाइट मोड" : "डार्क मोड"}
                            >
                                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                            </button>
                            <Link href="/login" className="text-white/70 hover:text-white transition">
                                👤
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Mobile compact header (logo + search toggle + hamburger) ===== */}
            <div className="md:hidden border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2" suppressHydrationWarning>
                            {!isClient ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-xl">&nbsp;</span>
                                </div>
                            ) : logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt={siteName || "Logo"}
                                    width={120}
                                    height={40}
                                    priority
                                    className="w-28 h-auto block"
                                    style={{ color: 'transparent', height: 'auto' }}
                                />
                            ) : showLogoText && logoText ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-xl">{logoText}</span>
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-xl">&nbsp;</span>
                                </div>
                            )}
                        </Link>

                        <div className="flex items-center gap-2">
                            {liveBroadcast ? (
                                <LiveBroadcast settings={liveBroadcast} position="trigger" />
                            ) : (
                                <Link
                                    href="/live"
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#e61e2b] text-white text-xs font-bold rounded-md hover:bg-red-700 transition"
                                    aria-label="लाइभ"
                                >
                                    <Radio size={14} aria-hidden="true" />
                                    LIVE
                                </Link>
                            )}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-red-600 transition"
                                aria-label="मेनु खोल्नुहोस्"
                                {...(isClient ? { 'aria-expanded': mobileMenuOpen ? 'true' : 'false' } : {})}
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Desktop 4-row layout ===== */}
            <div className="hidden md:block">
                {/* Rows 1+2 share one full-width mountain/sky backdrop panorama */}
                <div
                    className="relative bg-gradient-to-r from-sky-100 via-blue-50 to-sky-100 bg-no-repeat bg-center bg-cover"
                    style={{ backgroundImage: "url('/a45b0fd7-ecab-498d-9bbb-b7a1ec7e9a68.png')" }}
                >
                {/* Row 1: Top utility bar */}
                <div className="relative z-10 border-b border-gray-200/70">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between py-1.5 text-[13px] text-gray-700">
                            {/* Left: date + weather chip */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5" suppressHydrationWarning>
                                    <Calendar size={14} className="text-[#2260BF]" aria-hidden="true" />
                                    <span suppressHydrationWarning>{isClient ? nepaliDateStr : ""}</span>
                                    <span className="text-gray-500" suppressHydrationWarning>
                                        {isClient && englishDateStr ? `(${englishDateStr})` : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-full border border-white/80">
                                    <Sun size={14} className="text-amber-500" aria-hidden="true" />
                                    <span className="font-medium">काठमाडौं 24°C</span>
                                </div>
                            </div>

                            {/* Right: utility links + social + sign in */}
                            <div className="flex items-center gap-3">
                                <div className="hidden lg:flex items-center gap-3">
                                    <Link href="/about" className="hover:text-[#e61e2b] transition">हाम्रो बारेमा</Link>
                                    <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
                                    <Link href="/advertise" className="hover:text-[#e61e2b] transition">विज्ञापन</Link>
                                    <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
                                    <Link href="/contact" className="hover:text-[#e61e2b] transition">सम्पर्क</Link>
                                    <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={socialHref('facebook')} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1877F2] transition" aria-label="Facebook">
                                        <Facebook size={16} aria-hidden="true" />
                                    </a>
                                    <a href={socialHref('youtube')} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#FF0000] transition" aria-label="YouTube">
                                        <Youtube size={16} aria-hidden="true" />
                                    </a>
                                    <a href={socialHref('twitter')} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition" aria-label="X / Twitter">
                                        <Twitter size={16} aria-hidden="true" />
                                    </a>
                                    <a href={socialHref('instagram')} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#E4405F] transition" aria-label="Instagram">
                                        <Instagram size={16} aria-hidden="true" />
                                    </a>
                                </div>
                                <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
                                <Link href="/login" className="flex items-center gap-1 hover:text-[#e61e2b] transition">
                                    <User size={15} aria-hidden="true" />
                                    <span>साइन इन</span>
                                    <ChevronDown size={13} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Logo row (transparent over the shared mountain backdrop), large search, LIVE + hamburger */}
                <div className="relative z-10 border-b border-gray-200/70">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo (reuse existing logoUrl / isClient / logoSizeClasses logic) */}
                            <Link href="/" className="flex-shrink-0 flex items-center gap-2" suppressHydrationWarning>
                                {!isClient ? (
                                    // Placeholder during SSR to prevent hydration mismatch
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-2xl">&nbsp;</span>
                                    </div>
                                ) : (
                                    <>
                                        {logoUrl ? (
                                            <Image
                                                src={logoUrl}
                                                alt={siteName || "Logo"}
                                                width={160}
                                                height={48}
                                                priority
                                                className={`${logoSizeClasses[logoSize]} h-auto pt-2 block`}
                                                style={{ color: 'transparent', height: 'auto' }}
                                            />
                                        ) : showLogoText && logoText ? (
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-white font-bold text-2xl">{logoText}</span>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-white font-bold text-2xl">&nbsp;</span>
                                            </div>
                                        )}
                                        {(showSiteName || showSiteTagline) && (
                                            <div className="hidden sm:block">
                                                {showSiteName && siteName && (
                                                    <span className="text-xl font-bold">
                                                        <span className="text-red-600">{siteName}</span>
                                                    </span>
                                                )}
                                                {showSiteTagline && siteTagline && (
                                                    <p className="text-xs text-gray-600 -mt-1">{siteTagline}</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Link>

                            {/* Center: large rounded search bar */}
                            <div className="flex-1 max-w-2xl mx-2">
                                <form
                                    className="relative w-full"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.querySelector('input') as HTMLInputElement;
                                        if (input.value.trim()) {
                                            window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
                                        }
                                    }}
                                >
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="समाचार, विषय वा किबर्ड खोज्नुहोस्..."
                                        className="w-full pl-11 pr-14 py-2.5 bg-white border border-gray-200 rounded-full text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2260BF]/40 focus:border-[#2260BF] transition shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[#2260BF] text-white rounded-lg hover:bg-[#1b4f9c] transition"
                                        aria-label="खोज्नुहोस्"
                                    >
                                        <Search size={16} aria-hidden="true" />
                                    </button>
                                </form>
                            </div>

                            {/* Right: LIVE pill + समाचार hamburger */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {liveBroadcast ? (
                                    <LiveBroadcast settings={liveBroadcast} position="trigger" />
                                ) : (
                                    <Link
                                        href="/live"
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#e61e2b] text-white text-sm font-bold rounded-full hover:bg-red-700 transition"
                                        aria-label="लाइभ"
                                    >
                                        <Radio size={16} aria-hidden="true" />
                                        LIVE
                                    </Link>
                                )}
                                <button
                                    onClick={() => setDesktopSidebarOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-[#e61e2b] hover:bg-white/60 rounded-md transition text-sm font-medium"
                                    aria-label="मेनु खोल्नुहोस्"
                                >
                                    <Menu size={18} aria-hidden="true" />
                                    समाचार
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                {/* /mountain backdrop wrapper (Rows 1+2) */}

                {/* Row 3: Red primary navigation bar */}
                <div className="bg-[#e61e2b] relative">
                    <div className="max-w-7xl mx-auto px-4 overflow-x-clip">
                        <div className="flex items-stretch gap-0">
                            {/* Home tab (darker-red active) with icon + label */}
                            <Link
                                href="/"
                                className={`flex items-center gap-1.5 px-3.5 py-2 text-white transition font-[family-name:var(--font-khand)] text-[17px] font-semibold ${pathname === '/' ? 'bg-[#c4111d]' : 'hover:bg-[#c4111d]'}`}
                                aria-label="गृहपृष्ठ"
                            >
                                <Home size={17} aria-hidden="true" />
                                <span>गृहपृष्ठ</span>
                            </Link>

                            {/* Navigation links (with hover dropdowns where a mega-menu group matches).
                                The homepage link is omitted here because the home-icon tab already covers it. */}
                            <nav className="flex items-stretch gap-0 overflow-visible">
                                {categories
                                    .filter((cat) => cat.href !== "/" && cat.name !== "होमपेज")
                                    .map((cat) => {
                                    // Match a mega-menu group to this nav item (by exact name).
                                    const menu = megaMenu.find((m) => m.name === cat.name);
                                    const hasDropdown = !!menu && menu.subcategories.length > 0;
                                    return (
                                        <div key={cat.href} className="relative group flex items-stretch">
                                            <Link
                                                href={cat.href}
                                                className="flex items-center gap-1 px-3 py-2 text-white hover:bg-[#c4111d] transition-all duration-300 text-[17px] font-semibold whitespace-nowrap no-underline font-[family-name:var(--font-khand)]"
                                            >
                                                {cat.name}
                                                {hasDropdown && <ChevronDown size={14} aria-hidden="true" />}
                                            </Link>
                                            {hasDropdown && (
                                                <div className="absolute left-0 top-full z-50 hidden group-hover:block min-w-[200px] bg-white shadow-xl border border-gray-100 rounded-b-md py-2">
                                                    {menu!.subcategories.map((sub, si) => (
                                                        <Link
                                                            key={si}
                                                            href={sub.href}
                                                            className="block px-4 py-2 text-[15px] text-gray-700 hover:text-[#e61e2b] hover:bg-gray-50 transition no-underline"
                                                        >
                                                            {sub.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>

                            {/* Mountain graphic on the far right */}
                            <div className="ml-auto hidden lg:flex items-end self-stretch pl-6" aria-hidden="true">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/Red%20and%20White%20Low-Poly%20Mountain%20Range.png"
                                    alt=""
                                    className="h-full max-h-[44px] w-auto max-w-[200px] object-contain object-bottom select-none pointer-events-none"
                                    draggable={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 4: Breaking-news ticker */}
                {headlinePosts.length > 0 && (
                    <div className="bg-[#f8f9fa] border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex items-center gap-0 py-2">
                                {/* ताजा खबर label */}
                                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#e61e2b] text-white text-[12px] font-medium relative">
                                    <TrendingUp size={14} aria-hidden="true" />
                                    ताजा खबर
                                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#e61e2b] transform skew-x-[-12deg] translate-x-1.5" aria-hidden="true"></div>
                                </div>

                                {/* Auto-scrolling headlines (marquee). Two identical copies
                                    make the loop seamless; the track is translated by -50%. */}
                                <div className="ticker-viewport overflow-hidden ml-4 flex-1">
                                    <div className="ticker-track">
                                        {[0, 1].map((copy) => (
                                            <div
                                                key={copy}
                                                className="flex items-center shrink-0"
                                                aria-hidden={copy === 1 ? true : undefined}
                                            >
                                                {headlinePosts.map((post) => (
                                                    <span key={`${copy}-${post._id}`} className="flex items-center">
                                                        <span className="mx-3 w-1.5 h-1.5 rounded-full bg-[#e61e2b] shrink-0" aria-hidden="true" />
                                                        <Link
                                                            href={`/post/${post.slug}`}
                                                            className="text-[14px] text-black/80 font-medium no-underline whitespace-nowrap hover:text-[#e61e2b] transition"
                                                            tabIndex={copy === 1 ? -1 : undefined}
                                                        >
                                                            {post.title}
                                                        </Link>
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mega Menu Dropdown - Outside header rows for proper positioning */}
            {megaMenuOpen && (
                <div className="absolute left-0 right-0 bg-white shadow-xl border-t border-gray-200 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="w-auto overflow-auto md:overflow-visible max-h-[300px] md:max-h-none">
                            <div className="flex md:grid md:grid-cols-6 gap-6 text-gray-800">
                                {megaMenu.map((category, index) => (
                                    <div key={index} className="shrink-0">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                                            {category.name}
                                        </h3>
                                        <ul className="space-y-2">
                                            {category.subcategories.map((sub, subIndex) => (
                                                <li key={subIndex}>
                                                    <Link
                                                        href={sub.href}
                                                        className="text-gray-600 hover:text-[#e61e2b] transition text-sm block py-1"
                                                        onClick={() => setMegaMenuOpen(false)}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Trending Bar - OnlineKhabar style (desktop uses the 4-row layout above) */}
            <div className="md:hidden bg-[#f8f9fa] border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-0 py-2">
                        {/* Trending Label with slanted edge */}
                        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#e61e2b] text-white text-[12px] font-medium relative">
                            <TrendingUp size={14} />
                            ट्रेन्डिङ
                            {/* Slanted right edge */}
                            <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#e61e2b] transform skew-x-[-12deg] translate-x-1.5"></div>
                        </div>

                        {/* Trending Hashtags - Updated styling */}
                        <div className="flex items-center gap-0 overflow-x-auto ml-3">
                            {trending.map((topic, index) => {
                                // If tag starts with #, it's a hashtag → link to /tag/
                                // Otherwise it's a search phrase → link to /search?q=
                                const isHashtag = topic.tag.startsWith('#');
                                const tagName = isHashtag ? topic.tag.substring(1) : topic.tag;
                                const href = isHashtag
                                    ? `/tag/${encodeURIComponent(tagName)}`
                                    : `/search?q=${encodeURIComponent(tagName)}`;
                                // Display: show without # if image present, else show original tag text
                                const displayTag = topic.imageUrl ? tagName : topic.tag;
                                const hasPadding = topic.imageUrl;
                                return (
                                    <Link
                                        key={index}
                                        href={href}
                                        className={`flex items-center gap-1 bg-transparent text-black/80 text-[14px] font-bold no-underline relative mx-[5px] py-[6px] transition-all duration-300 whitespace-nowrap hover:text-[#e61e2b] ${hasPadding ? 'px-[15px] pl-[42px]' : 'px-[15px]'}`}
                                    >
                                        {topic.imageUrl && (
                                            <Image
                                                src={topic.imageUrl}
                                                alt={tagName}
                                                width={20}
                                                height={20}
                                                className="w-5 h-5 rounded-full object-cover border border-gray-200 absolute left-[15px] top-1/2 -translate-y-1/2"
                                            />
                                        )}
                                        <span>{displayTag}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Search Bar */}
                        <div className="flex max-w-xs ml-auto items-center">
                            <form
                                className="relative w-full"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const input = form.querySelector('input') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
                                    }
                                }}
                            >
                                <input
                                    type="text"
                                    name="search"
                                    placeholder="खोज्नुहोस्..."
                                    className="w-full px-4 py-1.5 bg-white border border-gray-200 rounded-full text-gray-800 text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-600 transition"
                                    aria-label="खोज्नुहोस्"
                                >
                                    <Search size={14} aria-hidden="true" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg max-h-[70vh] overflow-y-auto">
                    {/* Mobile Search */}
                    <div className="p-4 border-b border-gray-100">
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.querySelector('input') as HTMLInputElement;
                                if (input.value.trim()) {
                                    window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
                                }
                            }}
                        >
                            <input
                                type="text"
                                name="mobileSearch"
                                placeholder="नेपालीमा खोज्नुहोस्..."
                                className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500" aria-label="खोज्नुहोस्">
                                <Search size={20} aria-hidden="true" />
                            </button>
                        </form>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex gap-2 p-4 border-b border-gray-100">
                        <Link
                            href="/patro"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#e61e2b] text-white text-sm font-medium rounded-md"
                        >
                            <Calendar size={16} />
                            पात्रो
                        </Link>
                        <Link
                            href="/share-market"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#005677] text-white text-sm font-medium rounded-md"
                        >
                            <BarChart3 size={16} />
                            शेयर मार्केट
                        </Link>
                    </div>

                    {/* Mobile Categories - OnlineKhabar Style */}
                    <ul className="py-4 px-4 space-y-2">
                        {/* Homepage Link with Logo */}
                        <li>
                            <Link
                                href="/"
                                className="flex items-center gap-4 py-3 text-gray-800 hover:text-[#e61e2b] transition font-semibold text-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 overflow-hidden">
                                    {logoUrl ? (
                                        <Image
                                            src={logoUrl}
                                            alt={siteName || "Logo"}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 object-contain"
                                        />
                                    ) : (
                                        <Menu size={22} className="text-[#e61e2b]" />
                                    )}
                                </div>
                                <span>होमपेज</span>
                            </Link>
                        </li>

                        {/* Database Categories */}
                        {dbCategories.map((cat) => {
                            const IconComponent = getCategoryIcon(cat.name, cat.slug);
                            const iconBg = getCategoryIconBg(cat.name, cat.slug, cat.color);

                            return (
                                <li key={cat._id}>
                                    <Link
                                        href={`/category/${cat.slug}`}
                                        className="flex items-center gap-4 py-3 text-gray-800 hover:text-[#e61e2b] transition font-semibold text-lg"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
                                            style={{ backgroundColor: iconBg }}
                                        >
                                            <IconComponent size={22} />
                                        </div>
                                        <span className="flex-1">{cat.name}</span>
                                        {cat.isNew && (
                                            <span className="px-2.5 py-1 bg-[#FF5722] text-white text-xs font-bold rounded-full">
                                                NEW
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}

                        {/* Special Pages */}
                        <li>
                            <Link
                                href="/patro"
                                className="flex items-center gap-4 py-3 text-gray-800 hover:text-[#e61e2b] transition font-semibold text-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: '#FFC107' }}>
                                    <Calendar size={22} />
                                </div>
                                <span>पात्रो</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/rashifal"
                                className="flex items-center gap-4 py-3 text-gray-800 hover:text-[#e61e2b] transition font-semibold text-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: '#FFA726' }}>
                                    <Sparkles size={22} />
                                </div>
                                <span>राशिफल</span>
                            </Link>
                        </li>
                    </ul>

                    {/* Mobile Login */}
                    <div className="p-4 border-t border-gray-100 flex gap-4">
                        <Link href="/typing" className="text-gray-600 hover:text-red-600 transition text-sm">
                            नेपाली टाइपिङ
                        </Link>
                        <Link href="/login" className="text-gray-600 hover:text-red-600 transition text-sm">
                            लगइन
                        </Link>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar - Slide from Right */}
            {desktopSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] hidden md:block"
                        onClick={() => setDesktopSidebarOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[70] hidden md:block overflow-y-auto animate-slide-in-right">
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-3">
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt={siteName || "Logo"}
                                        width={40}
                                        height={40}
                                        className="w-10 h-10 object-contain"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-[#e61e2b] rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">र</span>
                                    </div>
                                )}
                                <span className="font-semibold text-gray-800">{siteName || "मेनु"}</span>
                            </div>
                            <button
                                onClick={() => setDesktopSidebarOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                                aria-label="बन्द गर्नुहोस्"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Sidebar Categories */}
                        <ul className="py-4 px-4 space-y-1">
                            {/* Homepage Link */}
                            <li>
                                <Link
                                    href="/"
                                    className="flex items-center gap-4 py-3 px-3 text-gray-800 hover:text-[#e61e2b] hover:bg-red-50 transition font-semibold text-lg rounded-lg"
                                    onClick={() => setDesktopSidebarOpen(false)}
                                >
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 overflow-hidden">
                                        {logoUrl ? (
                                            <Image
                                                src={logoUrl}
                                                alt=""
                                                width={36}
                                                height={36}
                                                className="w-9 h-9 object-contain"
                                            />
                                        ) : (
                                            <Menu size={20} className="text-[#e61e2b]" />
                                        )}
                                    </div>
                                    <span>होमपेज</span>
                                </Link>
                            </li>

                            {/* Database Categories */}
                            {dbCategories.map((cat) => {
                                const IconComponent = getCategoryIcon(cat.name, cat.slug);
                                const iconBg = getCategoryIconBg(cat.name, cat.slug, cat.color);

                                return (
                                    <li key={cat._id}>
                                        <Link
                                            href={`/category/${cat.slug}`}
                                            className="flex items-center gap-4 py-3 px-3 text-gray-800 hover:text-[#e61e2b] hover:bg-red-50 transition font-semibold text-lg rounded-lg"
                                            onClick={() => setDesktopSidebarOpen(false)}
                                        >
                                            <div
                                                className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm"
                                                style={{ backgroundColor: iconBg }}
                                            >
                                                <IconComponent size={20} />
                                            </div>
                                            <span className="flex-1">{cat.name}</span>
                                            {cat.isNew && (
                                                <span className="px-2 py-0.5 bg-[#FF5722] text-white text-xs font-bold rounded-full">
                                                    NEW
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}

                            {/* Special Pages */}
                            <li>
                                <Link
                                    href="/patro"
                                    className="flex items-center gap-4 py-3 px-3 text-gray-800 hover:text-[#e61e2b] hover:bg-red-50 transition font-semibold text-lg rounded-lg"
                                    onClick={() => setDesktopSidebarOpen(false)}
                                >
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: '#FFC107' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <span>पात्रो</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/rashifal"
                                    className="flex items-center gap-4 py-3 px-3 text-gray-800 hover:text-[#e61e2b] hover:bg-red-50 transition font-semibold text-lg rounded-lg"
                                    onClick={() => setDesktopSidebarOpen(false)}
                                >
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: '#FFA726' }}>
                                        <Sparkles size={20} />
                                    </div>
                                    <span>राशिफल</span>
                                </Link>
                            </li>
                        </ul>

                        {/* Sidebar Footer */}
                        <div className="p-4 border-t border-gray-100 mt-auto">
                            <div className="flex gap-4 text-sm">
                                <Link href="/typing" className="text-gray-600 hover:text-red-600 transition" onClick={() => setDesktopSidebarOpen(false)}>
                                    नेपाली टाइपिङ
                                </Link>
                                <Link href="/login" className="text-gray-600 hover:text-red-600 transition" onClick={() => setDesktopSidebarOpen(false)}>
                                    लगइन
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}