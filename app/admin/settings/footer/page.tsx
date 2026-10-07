"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    Mail,
    Phone,
    MapPin,
    Palette,
    Layout,
    Newspaper,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from "lucide-react";
import type { FooterSettings, FooterColumn, FooterLink, SocialLink } from "@/models/Settings";
import dynamic from "next/dynamic";
import ImageUpload from "@/components/ImageUpload";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const socialPlatforms: Array<{ platform: SocialLink['platform']; label: string; icon: React.ReactNode }> = [
    { platform: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
    { platform: 'twitter', label: 'Twitter/X', icon: <Twitter className="w-4 h-4" /> },
    { platform: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
    { platform: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
    { platform: 'tiktok', label: 'TikTok', icon: <span className="text-xs font-bold">TT</span> },
    { platform: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
    { platform: 'whatsapp', label: 'WhatsApp', icon: <span className="text-xs font-bold">WA</span> },
    { platform: 'telegram', label: 'Telegram', icon: <span className="text-xs font-bold">TG</span> },
];

const defaultFooterSettings: FooterSettings = {
    aboutText: "",
    showAbout: true,
    columns: [],
    companyName: "",
    registrationNumber: "",
    pressCouncilNumber: "",
    operatorName: "",
    editorName: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    showContact: true,
    socialLinks: socialPlatforms.map(p => ({ platform: p.platform, url: "", enabled: false })),
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
};

export default function FooterSettingsPage() {
    const [settings, setSettings] = useState<FooterSettings>(defaultFooterSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['about', 'design']));

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const result = await res.json();
            const footerSettings = result.data?.footerSettings;
            if (footerSettings) {
                const mergedSocialLinks = socialPlatforms.map(p => {
                    const existing = footerSettings.socialLinks?.find((s: SocialLink) => s.platform === p.platform);
                    return existing || { platform: p.platform, url: "", enabled: false };
                });
                setSettings({ ...defaultFooterSettings, ...footerSettings, socialLinks: mergedSocialLinks });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ footerSettings: settings }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'फुटर सेटिङहरू सफलतापूर्वक सुरक्षित गरियो!' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'सुरक्षित गर्न असफल भयो' });
        } finally {
            setSaving(false);
        }
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    // Column management
    const addColumn = () => {
        setSettings(prev => ({
            ...prev,
            columns: [...prev.columns, {
                title: "नयाँ स्तम्भ",
                order: prev.columns.length,
                links: []
            }],
        }));
    };

    const updateColumn = (index: number, updates: Partial<FooterColumn>) => {
        setSettings(prev => ({
            ...prev,
            columns: prev.columns.map((col, i) => i === index ? { ...col, ...updates } : col),
        }));
    };

    const removeColumn = (index: number) => {
        setSettings(prev => ({
            ...prev,
            columns: prev.columns.filter((_, i) => i !== index).map((col, i) => ({ ...col, order: i })),
        }));
    };

    // Link management within columns
    const addLink = (columnIndex: number) => {
        setSettings(prev => ({
            ...prev,
            columns: prev.columns.map((col, i) => {
                if (i === columnIndex) {
                    return {
                        ...col,
                        links: [...col.links, { name: "नयाँ लिंक", href: "/", order: col.links.length }],
                    };
                }
                return col;
            }),
        }));
    };

    const updateLink = (columnIndex: number, linkIndex: number, updates: Partial<FooterLink>) => {
        setSettings(prev => ({
            ...prev,
            columns: prev.columns.map((col, i) => {
                if (i === columnIndex) {
                    return {
                        ...col,
                        links: col.links.map((link, j) => j === linkIndex ? { ...link, ...updates } : link),
                    };
                }
                return col;
            }),
        }));
    };

    const removeLink = (columnIndex: number, linkIndex: number) => {
        setSettings(prev => ({
            ...prev,
            columns: prev.columns.map((col, i) => {
                if (i === columnIndex) {
                    return {
                        ...col,
                        links: col.links.filter((_, j) => j !== linkIndex).map((link, j) => ({ ...link, order: j })),
                    };
                }
                return col;
            }),
        }));
    };

    // Bottom bar utility link management (order = array index, mirrors column links)
    const addBottomBarLink = () => {
        setSettings(prev => {
            const list = prev.bottomBarLinks ?? [];
            return {
                ...prev,
                bottomBarLinks: [...list, { name: "नयाँ लिंक", href: "/", order: list.length }],
            };
        });
    };

    const updateBottomBarLink = (index: number, updates: Partial<FooterLink>) => {
        setSettings(prev => {
            const list = prev.bottomBarLinks ?? [];
            return {
                ...prev,
                bottomBarLinks: list.map((link, i) => i === index ? { ...link, ...updates } : link),
            };
        });
    };

    const removeBottomBarLink = (index: number) => {
        setSettings(prev => {
            const list = prev.bottomBarLinks ?? [];
            return {
                ...prev,
                bottomBarLinks: list.filter((_, i) => i !== index).map((link, i) => ({ ...link, order: i })),
            };
        });
    };

    // Social link management
    const updateSocialLink = (platform: SocialLink['platform'], updates: Partial<SocialLink>) => {
        setSettings(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map(link =>
                link.platform === platform ? { ...link, ...updates } : link
            ),
        }));
    };

    const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon: React.ReactNode }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
            <div className="flex items-center gap-3">
                <span className="text-primary">{icon}</span>
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            {expandedSections.has(section) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
        </button>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/settings"
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">फुटर सेटिङहरू</h1>
                            <p className="text-sm text-gray-500">फुटर डिजाइन र सामग्री व्यवस्थापन गर्नुहोस्</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'सुरक्षित गर्दै...' : 'सुरक्षित गर्नुहोस्'}
                    </button>
                </div>
            </header>

            {/* Message */}
            {message && (
                <div className={`max-w-6xl mx-auto px-4 mt-4`}>
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                {/* Design Settings */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="डिजाइन सेटिङहरू" section="design" icon={<Palette className="w-5 h-5" />} />
                    {expandedSections.has('design') && (
                        <div className="p-6 border-t space-y-6">
                            {/* Layout Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">लेआउट शैली</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['minimal', 'standard', 'modern'] as const).map((layout) => (
                                        <button
                                            key={layout}
                                            onClick={() => setSettings(prev => ({ ...prev, layout }))}
                                            className={`p-4 rounded-xl border-2 transition-all ${settings.layout === layout
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="h-20 mb-3 rounded-lg bg-gray-100 flex items-end justify-center p-2">
                                                {layout === 'minimal' && (
                                                    <div className="w-full h-4 bg-gray-300 rounded" />
                                                )}
                                                {layout === 'standard' && (
                                                    <div className="w-full space-y-1">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 h-6 bg-gray-300 rounded" />
                                                            <div className="flex-1 h-6 bg-gray-300 rounded" />
                                                            <div className="flex-1 h-6 bg-gray-300 rounded" />
                                                        </div>
                                                        <div className="h-3 bg-gray-300 rounded" />
                                                    </div>
                                                )}
                                                {layout === 'modern' && (
                                                    <div className="w-full space-y-1">
                                                        <div className="flex gap-2">
                                                            <div className="w-1/3 h-8 bg-gray-300 rounded" />
                                                            <div className="flex-1 h-8 bg-gray-300 rounded" />
                                                            <div className="w-1/4 h-8 bg-gray-300 rounded" />
                                                        </div>
                                                        <div className="h-3 bg-gray-300 rounded" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-medium capitalize">{layout}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">पृष्ठभूमि रंग</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.backgroundColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.backgroundColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">टेक्स्ट रंग</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.textColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.textColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">एक्सेंट रंग</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.accentColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.accentColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Decoration toggle */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.showMountain ?? true}
                                        onChange={(e) => setSettings(prev => ({ ...prev, showMountain: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">फुटर पहाड ग्राफिक देखाउनुहोस् / Show footer mountain artwork</span>
                                </label>
                            </div>

                            {/* Background Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">पृष्ठभूमि तस्बिर (वैकल्पिक)</label>
                                <p className="text-xs text-gray-500 mb-3">अपलोड गरिएमा फुटरको पृष्ठभूमिमा यो तस्बिर देखिन्छ (रङको माथि)। चौडा footer design वा screenshot प्रयोग गर्नुहोस्। खाली राखे ग्रेडियन्ट मात्र देखिन्छ।</p>
                                <ImageUpload
                                    value={settings.backgroundImage || ""}
                                    onChange={(url) => setSettings(prev => ({ ...prev, backgroundImage: url }))}
                                    onRemove={() => setSettings(prev => ({ ...prev, backgroundImage: "" }))}
                                />
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">पूर्वावलोकन</label>
                                <div
                                    className="relative min-h-[220px] overflow-hidden rounded-xl p-5 text-white"
                                    style={{
                                        backgroundColor: settings.backgroundColor,
                                        backgroundImage: settings.backgroundImage
                                            ? `linear-gradient(rgba(0, 35, 80, .42), rgba(0, 35, 80, .68)), url("${settings.backgroundImage}")`
                                            : undefined,
                                        backgroundPosition: "center",
                                        backgroundSize: "cover",
                                        color: settings.textColor,
                                    }}
                                >
                                    <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-[1.1fr_1fr_1fr_1.4fr]">
                                        <div>
                                            <div className="mb-3 flex items-center gap-2">
                                                {settings.backgroundImage ? (
                                                    <span className="text-xl font-bold">MeroNepalTv</span>
                                                ) : (
                                                    <div
                                                        className="flex h-10 w-10 items-center justify-center rounded-lg font-bold"
                                                        style={{ backgroundColor: settings.accentColor }}
                                                    >
                                                        Logo
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {["f", "▶", "𝕏", "◎"].map((icon) => (
                                                    <span
                                                        key={icon}
                                                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                                                        style={{ backgroundColor: `${settings.accentColor}cc` }}
                                                    >
                                                        {icon}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {["द्रुत लिंकहरू", "विषय", "हाम्रो बारेमा"].map((title) => (
                                            <div key={title}>
                                                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
                                                    <span className="h-4 w-1 rounded" style={{ backgroundColor: settings.accentColor }} />
                                                    {title}
                                                </h4>
                                                <p className="text-xs opacity-80">गृहपृष्ठ</p>
                                                <p className="text-xs opacity-80">समाचार</p>
                                                <p className="text-xs opacity-80">सम्पर्क</p>
                                            </div>
                                        ))}
                                        <div
                                            className="rounded-lg border p-3"
                                            style={{ backgroundColor: "rgba(0, 61, 124, .45)", borderColor: `${settings.accentColor}99` }}
                                        >
                                            <p className="mb-2 text-sm font-bold">{settings.newsletterTitle || "न्यूजलेटर"}</p>
                                            <div className="flex h-7 overflow-hidden rounded bg-white">
                                                <span className="flex-1 px-2 text-[10px] leading-7 text-gray-400">इमेल ठेगाना</span>
                                                <span className="px-2 text-[10px] leading-7 text-white" style={{ backgroundColor: settings.accentColor }}>सदस्यता</span>
                                            </div>
                                        </div>
                                    </div>
                                    {(settings.showMountain ?? true) && (
                                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-blue-500/40 to-transparent" aria-hidden="true" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* About Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="हाम्रो बारेमा" section="about" icon={<Newspaper className="w-5 h-5" />} />
                    {expandedSections.has('about') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showAbout}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showAbout: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">हाम्रो बारेमा सेक्सन देखाउनुहोस्</span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">विवरण</label>
                                <RichTextEditor
                                    content={settings.aboutText}
                                    onChange={(content) => setSettings(prev => ({ ...prev, aboutText: content }))}
                                    placeholder="तपाईंको साइटको बारेमा विवरण लिखनुहोस्..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="सम्पर्क जानकारी" section="contact" icon={<Phone className="w-5 h-5" />} />
                    {expandedSections.has('contact') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showContact}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showContact: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">सम्पर्क जानकारी देखाउनुहोस्</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        कम्पनीको नाम (वैकल्पिक)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.companyName || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="जस्तै: तपस्या क्रियेशन प्रा. लि. (खाली भए साइटको नाम देखिन्छ)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        सूचना विभाग दर्ता नं (वैकल्पिक)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.registrationNumber || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, registrationNumber: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="जस्तै: ४४८०-२०८१/२०८२"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        प्रेस काउन्सिल दर्ता नं (वैकल्पिक)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.pressCouncilNumber || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, pressCouncilNumber: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="जस्तै: ४९०७-२०८१/२०८२"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        संचालक (वैकल्पिक)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.operatorName || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, operatorName: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="जस्तै: बिशाल पोख्रेल"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        सम्पादक (वैकल्पिक)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.editorName || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, editorName: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="जस्तै: आत्मा गुरागाँइ"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" /> इमेल
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.contactEmail}
                                        onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="info@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1" /> फोन
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.contactPhone}
                                        onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="+977-1-4000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" /> ठेगाना
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.contactAddress}
                                        onChange={(e) => setSettings(prev => ({ ...prev, contactAddress: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="काठमाडौं, नेपाल"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Links */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="सामाजिक सञ्जाल लिंकहरू" section="social" icon={<Facebook className="w-5 h-5" />} />
                    {expandedSections.has('social') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showSocial}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showSocial: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">सामाजिक लिंकहरू देखाउनुहोस्</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {socialPlatforms.map((platform) => {
                                    const link = settings.socialLinks.find(s => s.platform === platform.platform);
                                    return (
                                        <div key={platform.platform} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={link?.enabled || false}
                                                    onChange={(e) => updateSocialLink(platform.platform, { enabled: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <span className="flex items-center gap-2 text-sm font-medium min-w-[100px]">
                                                    {platform.icon}
                                                    {platform.label}
                                                </span>
                                            </label>
                                            <input
                                                type="url"
                                                value={link?.url || ''}
                                                onChange={(e) => updateSocialLink(platform.platform, { url: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Links Columns */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="द्रुत लिंक स्तम्भहरू" section="columns" icon={<Layout className="w-5 h-5" />} />
                    {expandedSections.has('columns') && (
                        <div className="p-6 border-t space-y-4">
                            {settings.columns.map((column, columnIndex) => (
                                <div key={columnIndex} className="border rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <GripVertical className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={column.title}
                                            onChange={(e) => updateColumn(columnIndex, { title: e.target.value })}
                                            className="flex-1 px-3 py-2 border rounded-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="स्तम्भ शीर्षक"
                                        />
                                        <button
                                            onClick={() => removeColumn(columnIndex)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2 pl-8">
                                        {column.links.map((link, linkIndex) => (
                                            <div key={linkIndex} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={link.name}
                                                    onChange={(e) => updateLink(columnIndex, linkIndex, { name: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="लिंक नाम"
                                                />
                                                <input
                                                    type="text"
                                                    value={link.href}
                                                    onChange={(e) => updateLink(columnIndex, linkIndex, { href: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    placeholder="/path"
                                                />
                                                <button
                                                    onClick={() => removeLink(columnIndex, linkIndex)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addLink(columnIndex)}
                                            className="flex items-center gap-2 text-sm text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                            लिंक थप्नुहोस्
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addColumn}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary hover:text-primary transition"
                            >
                                <Plus className="w-5 h-5" />
                                नयाँ स्तम्भ थप्नुहोस्
                            </button>
                        </div>
                    )}
                </div>

                {/* Newsletter */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="न्यूजलेटर" section="newsletter" icon={<Mail className="w-5 h-5" />} />
                    {expandedSections.has('newsletter') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showNewsletter}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showNewsletter: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">न्यूजलेटर सेक्सन देखाउनुहोस्</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">शीर्षक</label>
                                    <input
                                        type="text"
                                        value={settings.newsletterTitle}
                                        onChange={(e) => setSettings(prev => ({ ...prev, newsletterTitle: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">विवरण</label>
                                    <input
                                        type="text"
                                        value={settings.newsletterDescription}
                                        onChange={(e) => setSettings(prev => ({ ...prev, newsletterDescription: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">इनपुट प्लेसहोल्डर</label>
                                    <input
                                        type="text"
                                        value={settings.newsletterPlaceholder ?? ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, newsletterPlaceholder: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="तपाईंको इमेल ठेगाना"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">बटन टेक्स्ट</label>
                                    <input
                                        type="text"
                                        value={settings.newsletterButtonText ?? ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, newsletterButtonText: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="सदस्यता लिनुहोस्"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* App Download */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="एप डाउनलोड" section="app" icon={<ExternalLink className="w-5 h-5" />} />
                    {expandedSections.has('app') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showAppDownload}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showAppDownload: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">एप डाउनलोड सेक्सन देखाउनुहोस्</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Play Store URL</label>
                                    <input
                                        type="url"
                                        value={settings.playStoreUrl}
                                        onChange={(e) => setSettings(prev => ({ ...prev, playStoreUrl: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="https://play.google.com/store/apps/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">App Store URL</label>
                                    <input
                                        type="url"
                                        value={settings.appStoreUrl}
                                        onChange={(e) => setSettings(prev => ({ ...prev, appStoreUrl: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="https://apps.apple.com/..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="तल्लो बार / Bottom Bar" section="bottombar" icon={<Layout className="w-5 h-5" />} />
                    {expandedSections.has('bottombar') && (
                        <div className="p-6 border-t space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">&quot;Designed with&quot; टेक्स्ट</label>
                                <input
                                    type="text"
                                    value={settings.designedWithText ?? ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, designedWithText: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Designed with {heart} for a better Nepal"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {'{heart}'} ले रातो मुटु देखिने ठाउँ जनाउँछ।
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">युटिलिटी लिंकहरू</label>
                                <div className="space-y-2">
                                    {(settings.bottomBarLinks ?? []).map((link, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={link.name}
                                                onChange={(e) => updateBottomBarLink(index, { name: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="लिंक नाम"
                                            />
                                            <input
                                                type="text"
                                                value={link.href}
                                                onChange={(e) => updateBottomBarLink(index, { href: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="/path"
                                            />
                                            <button
                                                onClick={() => removeBottomBarLink(index)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addBottomBarLink}
                                        className="flex items-center gap-2 text-sm text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        लिंक थप्नुहोस्
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Copyright */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <SectionHeader title="कपिराइट" section="copyright" icon={<span className="text-lg">©</span>} />
                    {expandedSections.has('copyright') && (
                        <div className="p-6 border-t space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.showCopyright}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showCopyright: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">कपिराइट देखाउनुहोस्</span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">कपिराइट टेक्स्ट</label>
                                <input
                                    type="text"
                                    value={settings.copyrightText}
                                    onChange={(e) => setSettings(prev => ({ ...prev, copyrightText: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    उपलब्ध चर: {'{year}'} = हालको वर्ष, {'{siteName}'} = साइट नाम
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
