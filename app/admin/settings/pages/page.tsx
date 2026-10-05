"use client";

import { useState, useEffect } from "react";
import { Save, FileText, Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface PageData {
    _id?: string;
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    published: boolean;
    order: number;
}

const DEFAULT_PAGE_SLUGS = [
    "about",
    "contact",
    "privacy-policy",
    "terms-of-service",
    "advertise",
    "careers",
];

const SLUG_LABELS: Record<string, string> = {
    "about": "हाम्रो बारेमा",
    "contact": "सम्पर्क",
    "privacy-policy": "गोपनीयता नीति",
    "terms-of-service": "सेवाका शर्तहरू",
    "advertise": "विज्ञापन",
    "careers": "करियर",
};

const getDisplayName = (slug: string) =>
    SLUG_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);

// Safely extract _id string from MongoDB response (handles ObjectId, {$oid}, plain string)
function extractId(id: unknown): string | undefined {
    if (!id) return undefined;
    if (typeof id === "string") return id;
    if (typeof id === "object") {
        const obj = id as Record<string, unknown>;
        // MongoDB extended JSON format: { $oid: "..." }
        if (obj.$oid && typeof obj.$oid === "string") return obj.$oid;
        // ObjectId .toString() fallback
        if (typeof obj.toString === "function") {
            const s = obj.toString();
            if (s !== "[object Object]") return s;
        }
    }
    return undefined;
}

export default function PagesSettingsPage() {
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // slug being saved
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [expandedPage, setExpandedPage] = useState<string | null>(null);
    const [dirtyPages, setDirtyPages] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchPages();
    }, []);

    // Auto-clear message after 4 seconds
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const fetchPages = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pages");
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                // Normalize _id to string
                const normalized: PageData[] = data.data.map((p: Record<string, unknown>) => ({
                    _id: extractId(p._id),
                    title: (p.title as string) || "",
                    slug: (p.slug as string) || "",
                    content: (p.content as string) || "",
                    metaTitle: (p.metaTitle as string) || "",
                    metaDescription: (p.metaDescription as string) || "",
                    published: typeof p.published === "boolean" ? p.published : false,
                    order: typeof p.order === "number" ? p.order : 0,
                }));

                const sorted = normalized.sort((a, b) => (a.order || 0) - (b.order || 0));

                // Ensure all default slugs are present; fill missing with empty shell
                const merged: PageData[] = DEFAULT_PAGE_SLUGS.map((slug, index) => {
                    const existing = sorted.find(p => p.slug === slug);
                    if (existing) return existing;
                    return {
                        title: getDisplayName(slug),
                        slug,
                        content: "",
                        metaTitle: getDisplayName(slug),
                        metaDescription: "",
                        published: false,
                        order: index,
                    };
                });

                setPages(merged);
            } else {
                setMessage({ type: "error", text: `डाटा लोड गर्न विफल: ${(data as { error?: string }).error || "Unknown error"}` });
            }
        } catch (error) {
            console.error("Error fetching pages:", error);
            setMessage({ type: "error", text: "सर्भरसँग जडान गर्न विफल भयो" });
        } finally {
            setLoading(false);
        }
    };

    const handleContentChange = (slug: string, content: string) => {
        setPages(prev => prev.map(p => p.slug === slug ? { ...p, content } : p));
        setDirtyPages(prev => new Set(prev).add(slug));
    };

    const handleFieldChange = (slug: string, field: keyof PageData, value: string | boolean | number) => {
        setPages(prev => prev.map(p => p.slug === slug ? { ...p, [field]: value } : p));
        setDirtyPages(prev => new Set(prev).add(slug));
    };

    // Save a single page
    const savePage = async (slug: string): Promise<boolean> => {
        const page = pages.find(p => p.slug === slug);
        if (!page) return false;

        const payload = {
            title: page.title,
            slug: page.slug,
            content: page.content,
            metaTitle: page.metaTitle || page.title,
            metaDescription: page.metaDescription || "",
            published: page.published,
            order: page.order,
        };

        try {
            // Try update first (by slug)
            const putRes = await fetch(`/api/pages/${slug}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (putRes.ok) return true;

            // If 404, create new
            if (putRes.status === 404) {
                const postRes = await fetch(`/api/pages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                return postRes.ok;
            }

            return false;
        } catch (err) {
            console.error(`Save error for ${slug}:`, err);
            return false;
        }
    };

    // Save all dirty pages at once
    const handleSaveAll = async () => {
        if (dirtyPages.size === 0) return;
        setSaving("all");
        setMessage(null);
        let successCount = 0;
        let errorCount = 0;

        for (const slug of dirtyPages) {
            const ok = await savePage(slug);
            if (ok) successCount++; else errorCount++;
        }

        if (errorCount === 0) {
            setMessage({ type: "success", text: `${successCount} पृष्ठ सफलतापूर्वक सुरक्षित गरियो!` });
            setDirtyPages(new Set());
            await fetchPages();
        } else {
            setMessage({ type: "error", text: `${successCount} सफल, ${errorCount} असफल` });
        }
        setSaving(null);
    };

    // Save a single page inline
    const handleSaveOne = async (slug: string) => {
        setSaving(slug);
        setMessage(null);
        const ok = await savePage(slug);
        if (ok) {
            setMessage({ type: "success", text: `"${getDisplayName(slug)}" सुरक्षित गरियो!` });
            setDirtyPages(prev => { const s = new Set(prev); s.delete(slug); return s; });
            await fetchPages();
        } else {
            setMessage({ type: "error", text: `"${getDisplayName(slug)}" सुरक्षित गर्न विफल` });
        }
        setSaving(null);
    };

    const togglePublished = async (slug: string) => {
        const page = pages.find(p => p.slug === slug);
        if (!page) return;
        const newPublished = !page.published;
        setPages(prev => prev.map(p => p.slug === slug ? { ...p, published: newPublished } : p));

        try {
            const res = await fetch(`/api/pages/${slug}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: newPublished }),
            });
            if (!res.ok) {
                // Revert
                setPages(prev => prev.map(p => p.slug === slug ? { ...p, published: !newPublished } : p));
                // Mark dirty to save via POST if it doesn't exist yet
                setDirtyPages(prev => new Set(prev).add(slug));
            }
        } catch {
            setPages(prev => prev.map(p => p.slug === slug ? { ...p, published: !newPublished } : p));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sticky Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900">स्थिर पृष्ठहरू</h1>
                        <p className="text-sm text-gray-500">पृष्ठ सामग्री व्यवस्थापन गर्नुहोस्</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={fetchPages}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">रिलोड</span>
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving !== null || dirtyPages.size === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                        >
                            <Save className="w-4 h-4" />
                            {saving === "all"
                                ? "सुरक्षित गर्दै..."
                                : dirtyPages.size > 0
                                    ? `सबै सुरक्षित गर्नुहोस् (${dirtyPages.size})`
                                    : "सबै सुरक्षित गर्नुहोस्"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Message Banner */}
            {message && (
                <div className="max-w-6xl mx-auto px-4 mt-4">
                    <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                        {message.text}
                    </div>
                </div>
            )}

            {/* Unsaved changes notice */}
            {dirtyPages.size > 0 && (
                <div className="max-w-6xl mx-auto px-4 mt-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-yellow-800 text-sm">
                        ⚠️ {dirtyPages.size} पृष्ठमा असुरक्षित परिवर्तन छ।
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 py-6 space-y-3">
                {DEFAULT_PAGE_SLUGS.map((slug) => {
                    const page = pages.find(p => p.slug === slug);
                    const isExpanded = expandedPage === slug;
                    const isDirty = dirtyPages.has(slug);
                    const isSavingThis = saving === slug;
                    const displayName = getDisplayName(slug);
                    const isInDB = !!page?._id;

                    return (
                        <div key={slug} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${isDirty ? "border-yellow-300" : "border-gray-100"}`}>
                            {/* Row Header */}
                            <div
                                onClick={() => setExpandedPage(isExpanded ? null : slug)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setExpandedPage(isExpanded ? null : slug);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <span className="font-semibold text-gray-900 truncate">{displayName}</span>
                                    <span className="text-sm text-gray-400 flex-shrink-0">/{slug}</span>
                                    {!isInDB && (
                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full flex-shrink-0">नयाँ</span>
                                    )}
                                    {isDirty && (
                                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full flex-shrink-0">● परिवर्तन भएको</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Publish toggle */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); togglePublished(slug); }}
                                        className={`p-1.5 rounded-lg transition ${page?.published ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                        title={page?.published ? "प्रकाशित — थिचेर अप्रकाशित गर्नुहोस्" : "अप्रकाशित — थिचेर प्रकाशित गर्नुहोस्"}
                                    >
                                        {page?.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    {isExpanded
                                        ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                        : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Edit Area */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 p-6 space-y-5">
                                    {/* Title + Meta Title */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                                शीर्षक <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={page?.title ?? ""}
                                                onChange={(e) => handleFieldChange(slug, "title", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                                                placeholder={displayName}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Meta शीर्षक</label>
                                            <input
                                                type="text"
                                                value={page?.metaTitle ?? ""}
                                                onChange={(e) => handleFieldChange(slug, "metaTitle", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                                                placeholder={page?.title || displayName}
                                            />
                                        </div>
                                    </div>

                                    {/* Meta Description */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Meta विवरण</label>
                                        <textarea
                                            value={page?.metaDescription ?? ""}
                                            onChange={(e) => handleFieldChange(slug, "metaDescription", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                                            rows={2}
                                            placeholder="SEO विवरण यहाँ लेख्नुहोस्..."
                                        />
                                    </div>

                                    {/* Rich Text Content */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">सामग्री</label>
                                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                                            <RichTextEditor
                                                key={`editor-${slug}-${page?._id ?? "new"}`}
                                                content={page?.content ?? ""}
                                                onChange={(content) => handleContentChange(slug, content)}
                                                placeholder="पृष्ठ सामग्री यहाँ लेख्नुहोस्..."
                                            />
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-gray-400">
                                            {isInDB ? `ID: ${page?._id}` : "अझै डाटाबेसमा सुरक्षित भएको छैन"}
                                        </div>
                                        <button
                                            onClick={() => handleSaveOne(slug)}
                                            disabled={saving !== null || !isDirty}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 text-sm font-medium"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isSavingThis ? "सुरक्षित गर्दै..." : "यो पृष्ठ सुरक्षित गर्नुहोस्"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>
        </div>
    );
}
