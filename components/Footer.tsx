"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { FooterSettings, SocialLink, FooterColumn, FooterLink } from "@/models/Settings";
import {
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    Phone,
    Mail,
    MapPin,
    FileText,
    Heart,
    UserCog,
    PenLine,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ArrowRight
} from "lucide-react";

// TikTok, WhatsApp, Telegram icons (custom since lucide doesn't have them)
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

interface FooterProps {
    settings: FooterSettings;
    siteName: string;
    logoUrl?: string;
    logoText?: string;
}

const SocialIcon = ({ platform, className }: { platform: SocialLink['platform']; className?: string }) => {
    const icons = {
        facebook: Facebook,
        twitter: Twitter,
        instagram: Instagram,
        youtube: Youtube,
        linkedin: Linkedin,
        tiktok: TikTokIcon,
        whatsapp: WhatsAppIcon,
        telegram: TelegramIcon,
    };

    const Icon = icons[platform];
    return <Icon className={className} />;
};

// Inline newsletter form matching the reference (input + red button on one row)
const InlineNewsletterForm = ({ accentColor, placeholder, buttonText }: { accentColor: string; textColor: string; placeholder: string; buttonText: string }) => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "footer" }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage("सफलतापूर्वक सदस्यता लिइयो!");
                setEmail("");
                setTimeout(() => {
                    setStatus("idle");
                    setMessage("");
                }, 5000);
            } else {
                setStatus("error");
                setMessage(data.error || "सदस्यता लिन सकिएन");
            }
        } catch {
            setStatus("error");
            setMessage("सदस्यता लिन सकिएन। पछि पुन: प्रयास गर्नुहोस्।");
        }
    };

    return (
        <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                <label htmlFor="footer-newsletter-email" className="sr-only">{placeholder}</label>
                <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    disabled={status === "loading"}
                    required
                    aria-required="true"
                    aria-invalid={status === "error"}
                    className="flex-1 min-w-0 h-[52px] px-4 text-[16px] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg sm:rounded-r-none outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[rgba(0,145,255,0.6)] disabled:opacity-50"
                    suppressHydrationWarning
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="shrink-0 h-[52px] px-5 rounded-lg sm:rounded-l-none font-bold text-white text-[16px] flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[rgba(0,145,255,0.6)] disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                >
                    {buttonText}
                    {status === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    )}
                </button>
            </div>
            {status === "success" && (
                <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    {message}
                </p>
            )}
            {status === "error" && (
                <p role="alert" aria-live="polite" className="flex items-center gap-1.5 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {message}
                </p>
            )}
        </form>
    );
};

const defaultColumns: FooterColumn[] = [
    {
        title: "द्रुत लिंकहरू",
        order: 0,
        links: [
            { name: "होमपेज", href: "/", order: 0 },
            { name: "समाचार", href: "/news", order: 1 },
            { name: "राशिफल", href: "/rashifal", order: 2 },
            { name: "विदेशी मुद्रा", href: "/forex", order: 3 },
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
            { name: "गोपनीयता नीति", href: "/privacy-policy", order: 0 },
            { name: "सेवाका शर्तहरू", href: "/terms-of-service", order: 1 },
            { name: "कुकी नीति", href: "/cookies", order: 2 },
        ]
    },
];

const defaultBottomBarLinks: FooterLink[] = [
    { name: "Site Map", href: "/sitemap", order: 0 },
    { name: "Privacy Policy", href: "/privacy-policy", order: 1 },
    { name: "Terms of Use", href: "/terms-of-service", order: 2 },
];

export default function Footer({ settings, siteName, logoUrl, logoText }: FooterProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const currentYear = isMounted ? new Date().getFullYear().toString() : "2025";

    const copyrightText = settings.copyrightText
        .replace('{year}', currentYear)
        .replace('{siteName}', siteName);

    const enabledSocialLinks = settings.socialLinks.filter(link => link.enabled && link.url);
    const columns = settings.columns && settings.columns.length > 0 ? settings.columns : defaultColumns;

    if (settings.layout === 'minimal') {
        return (
            <footer
                className="relative overflow-hidden"
                style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 py-8 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo & Copyright */}
                        <div className="flex items-center gap-4">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt={siteName}
                                    width={120}
                                    height={40}
                                    className="h-10 w-auto"
                                    style={{ width: 'auto' }}
                                />
                            ) : logoText ? (
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: settings.accentColor }}
                                >
                                    {logoText}
                                </span>
                            ) : null}
                            {settings.showCopyright && (
                                <p className="text-sm">{copyrightText}</p>
                            )}
                        </div>

                        {/* Social Links */}
                        {settings.showSocial && enabledSocialLinks.length > 0 && (
                            <div className="flex items-center gap-3">
                                {enabledSocialLinks.map((link) => (
                                    <a
                                        key={link.platform}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${link.platform} मा भेट्नुहोस्`}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                        style={{
                                            backgroundColor: `${settings.accentColor}20`,
                                            color: settings.textColor
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = settings.accentColor;
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = `${settings.accentColor}20`;
                                            e.currentTarget.style.color = settings.textColor;
                                        }}
                                    >
                                        <SocialIcon platform={link.platform} className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        );
    }

    // Modern/Standard (default) — redesigned to match the reference (dark navy, 6 columns)
    // The new design is the default return so the live site shows it regardless of
    // whether settings.layout is 'standard' or 'modern'. Only 'minimal' keeps its own layout.
    // Render all enabled link columns, up to the 3 slots the 6-fr grid reserves.
    const linkColumns = columns.slice().sort((a, b) => a.order - b.order).slice(0, 3);
    const linkCount = linkColumns.length;

    // Desktop (xl) grid template: brand 1.2fr, company 1.4fr, one 0.8fr per link column,
    // newsletter 1.5fr. Driven by a CSS variable so fewer/more than 3 link columns never
    // leave a visibly empty slot. Consumed only at xl via the arbitrary class below.
    const desktopGridTemplate = `1.2fr 1.4fr ${"0.8fr ".repeat(linkCount)}1.5fr`;

    const bottomBarLinks = (settings.bottomBarLinks && settings.bottomBarLinks.length > 0
        ? settings.bottomBarLinks
        : defaultBottomBarLinks
    ).slice().sort((a, b) => a.order - b.order);

    const designedWithText = settings.designedWithText ?? "Designed with {heart} for a better Nepal";
    const [designedBefore, designedAfter] = designedWithText.split('{heart}');

    const heartIcon = (
        <Heart className="w-4 h-4 fill-current" style={{ color: settings.accentColor }} aria-hidden="true" />
    );

    // Shared tokens (see design doc §3). settings.* colors stay the configurable base.
    const secondaryTxt = "rgba(255,255,255,0.78)";
    const linkTxt = "rgba(255,255,255,0.75)";
    // Static literal so Tailwind JIT detects the arbitrary classes at build time.
    const sepClass = "xl:border-l xl:border-[rgba(0,145,255,0.28)] xl:pl-10";

    const horizontalPadding = "px-4 sm:px-6 lg:px-10 xl:px-14";

    return (
        <footer
            className="relative overflow-hidden bg-gradient-to-b from-[#003f80] via-[#00356f] to-[#002750]"
            style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
        >
            {/* Optional admin-uploaded background image (sits over the gradient, behind content) */}
            {settings.backgroundImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
                    style={{ backgroundImage: `url('${settings.backgroundImage}')` }}
                    aria-hidden="true"
                />
            )}

            {/* Decorative mountain graphic — full-width lower strip (desktop only) */}
            {(settings.showMountain ?? true) && (
                <img
                    src="/Red%20and%20White%20Low-Poly%20Mountain%20Range.png"
                    alt=""
                    aria-hidden="true"
                    className="hidden lg:block absolute bottom-0 left-0 w-full max-h-[150px] object-cover object-bottom pointer-events-none select-none opacity-90 z-0"
                />
            )}

            {/* Dark overlay above the artwork, below the content, keeps text readable */}
            <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{ background: "linear-gradient(to bottom, rgba(0,40,90,0.15), rgba(0,30,70,0.35))" }}
                aria-hidden="true"
            />

            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 z-10" style={{ background: `linear-gradient(90deg, ${settings.accentColor}, ${settings.accentColor}88, ${settings.accentColor}44, transparent)` }} />

            {/* Main Footer Content */}
            <div className={`max-w-[1500px] w-full mx-auto ${horizontalPadding} pt-14 lg:pt-[60px] pb-12 lg:pb-14 relative z-10`}>
                <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 lg:gap-x-10 xl:[grid-template-columns:var(--footer-xl-cols)]"
                    style={{ ['--footer-xl-cols' as string]: desktopGridTemplate }}
                >
                    {/* COLUMN 1 — Brand */}
                    <div>
                        <div className="mb-6">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt={siteName}
                                    width={210}
                                    height={70}
                                    className="h-auto w-[180px] xl:w-[210px]"
                                    style={{ height: 'auto' }}
                                />
                            ) : logoText ? (
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                                    style={{
                                        backgroundColor: settings.accentColor,
                                        boxShadow: `0 10px 40px ${settings.accentColor}40`
                                    }}
                                >
                                    {logoText}
                                </div>
                            ) : null}
                        </div>

                        {/* Social Links — translucent blue rounded squares (44px) */}
                        {settings.showSocial && enabledSocialLinks.length > 0 && (
                            <div className="flex flex-wrap gap-2.5">
                                {enabledSocialLinks.map((link) => (
                                    <a
                                        key={link.platform}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${link.platform} मा भेट्नुहोस्`}
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white bg-[rgba(0,145,255,0.14)] transition-all duration-300 hover:scale-110 hover:bg-[rgba(0,145,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,145,255,0.6)]"
                                        suppressHydrationWarning
                                    >
                                        <SocialIcon platform={link.platform} className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUMN 2 — Company info */}
                    <div className={sepClass}>
                        <h3 className="text-[24px] xl:text-[26px] font-bold text-white mb-5 leading-snug">
                            {settings.companyName || siteName}
                        </h3>
                        {settings.showContact && (
                            <ul className="space-y-3.5">
                                {settings.contactAddress && (
                                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.7] break-words" style={{ color: secondaryTxt }}>
                                        <MapPin className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                        <span>{settings.contactAddress}</span>
                                    </li>
                                )}
                                {settings.contactPhone && (
                                    <li>
                                        <a
                                            href={`tel:${settings.contactPhone}`}
                                            className="flex items-start gap-2.5 text-[16px] leading-[1.7] hover:text-white transition-colors"
                                            style={{ color: secondaryTxt }}
                                        >
                                            <Phone className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                            <span>{settings.contactPhone}</span>
                                        </a>
                                    </li>
                                )}
                                {settings.registrationNumber && (
                                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.7] break-words" style={{ color: secondaryTxt }}>
                                        <FileText className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                        <span>सूचना विभाग दर्ता नं: {settings.registrationNumber}</span>
                                    </li>
                                )}
                                {settings.pressCouncilNumber && (
                                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.7] break-words" style={{ color: secondaryTxt }}>
                                        <FileText className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                        <span>प्रेस काउन्सिल दर्ता नं: {settings.pressCouncilNumber}</span>
                                    </li>
                                )}
                                {settings.operatorName && (
                                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.7] break-words" style={{ color: secondaryTxt }}>
                                        <UserCog className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                        <span>सञ्चालक: {settings.operatorName}</span>
                                    </li>
                                )}
                                {settings.editorName && (
                                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.7] break-words" style={{ color: secondaryTxt }}>
                                        <PenLine className="w-4 h-4 mt-1 shrink-0" style={{ color: settings.accentColor }} aria-hidden="true" />
                                        <span>सम्पादक: {settings.editorName}</span>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* COLUMNS 3,4,5 — Link columns (all enabled, up to 3 slots) */}
                    {linkColumns.map((column, columnIndex) => (
                        <nav
                            key={`modern-column-${columnIndex}-${column.title}`}
                            aria-label={column.title}
                            className={columnIndex === 0 ? sepClass : undefined}
                        >
                            <h3 className="flex items-center gap-2.5 text-[21px] xl:text-[22px] font-bold text-white leading-tight mb-4">
                                <span
                                    className="inline-block w-1 h-[30px] rounded-[4px] shrink-0"
                                    style={{ backgroundColor: settings.accentColor }}
                                    aria-hidden="true"
                                />
                                {column.title}
                            </h3>
                            <ul className="leading-[1.9]">
                                {column.links.slice().sort((a, b) => a.order - b.order).map((link, linkIndex) => (
                                    <li key={`modern-link-${columnIndex}-${linkIndex}-${link.href}`}>
                                        <Link
                                            href={link.href}
                                            className="group inline-flex items-center gap-1 text-[16px] xl:text-[17px] transition-all duration-200 hover:text-white hover:translate-x-1 focus-visible:text-white focus-visible:outline-none"
                                            style={{ color: linkTxt }}
                                        >
                                            <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" style={{ color: settings.accentColor }} aria-hidden="true" />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    {/* COLUMN 6 — Newsletter */}
                    {settings.showNewsletter && (
                        <div className={`md:col-span-2 xl:col-span-1 ${sepClass}`}>
                            <div
                                className="w-full max-w-[380px] rounded-[15px] p-6 xl:p-7"
                                style={{ backgroundColor: "rgba(0,61,124,0.45)", border: "1px solid rgba(0,145,255,0.45)" }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                                        style={{ backgroundColor: settings.accentColor }}
                                    >
                                        <Mail className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <h3 className="text-[21px] xl:text-[22px] font-bold text-white leading-tight">{settings.newsletterTitle}</h3>
                                </div>
                                {settings.newsletterDescription && (
                                    <p className="text-[16px] leading-[1.7] mb-5 line-clamp-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                                        {settings.newsletterDescription}
                                    </p>
                                )}
                                <InlineNewsletterForm
                                    accentColor={settings.accentColor}
                                    textColor={settings.textColor}
                                    placeholder={settings.newsletterPlaceholder ?? "तपाईंको इमेल ठेगाना"}
                                    buttonText={settings.newsletterButtonText ?? "सदस्यता लिनुहोस्"}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div
                className="border-t relative z-10"
                style={{ borderColor: "rgba(0,145,255,0.2)", backgroundColor: "#00234a" }}
            >
                <div className={`max-w-[1500px] mx-auto ${horizontalPadding} min-h-[72px] flex items-center py-4`}>
                    <div className="w-full flex flex-col items-center text-center gap-2 md:grid md:[grid-template-columns:1fr_auto_1fr] md:items-center md:gap-3 md:text-left">
                        {settings.showCopyright ? (
                            <p className="text-[15px] text-center md:text-left" style={{ color: linkTxt }}>{copyrightText}</p>
                        ) : (
                            <span className="hidden md:block" aria-hidden="true" />
                        )}

                        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1" aria-label="उपयोगी लिंकहरू">
                            {bottomBarLinks.map((link, index) => (
                                <span key={`bottombar-${index}-${link.href}`} className="flex items-center gap-x-3 text-[15px]">
                                    {index > 0 && (
                                        <span className="text-[15px]" style={{ color: linkTxt }} aria-hidden="true">|</span>
                                    )}
                                    <Link href={link.href} className="hover:text-white focus-visible:text-white transition-colors" style={{ color: linkTxt }}>{link.name}</Link>
                                </span>
                            ))}
                        </nav>

                        <p className="flex items-center justify-center md:justify-self-end gap-1.5 text-[15px]" style={{ color: linkTxt }}>
                            {designedAfter === undefined ? (
                                <>
                                    {designedBefore}
                                    {heartIcon}
                                </>
                            ) : (
                                <>
                                    {designedBefore}
                                    {heartIcon}
                                    {designedAfter}
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
