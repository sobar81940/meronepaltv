"use client";

import { useState, useEffect } from "react";
import { Save, Globe, Search, ShieldAlert, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings } from "@/models/Settings";

export default function SeoSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // Check user access
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();

                if (!data.user) {
                    router.push("/login");
                    return;
                }

                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;

                if (isAdmin || canManageSettings) setHasAccess(true);
                else setHasAccess(false);
            } catch (error) {
                console.error("Failed to check access:", error);
                setHasAccess(false);
            }
        };
        checkAccess();
    }, [router]);

    // Fetch settings
    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setSettings(data.data);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "SEO settings saved successfully!" });
            } else {
                setMessage({ type: "error", text: "Failed to save settings" });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to save settings" });
        } finally {
            setSaving(false);
        }
    };

    if (hasAccess === null || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    if (hasAccess === false) return <div className="text-red-400">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Globe className="text-blue-400" />
                        SEO & Google Integration
                    </h1>
                    <p className="text-slate-400 mt-1">Manage search engine optimization and meta tags</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="space-y-6">
                    {/* General SEO */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                            <Search size={18} className="text-green-400" />
                            General SEO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">Meta Title (Default)</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.siteTitle || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, siteTitle: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Default page title"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">Meta Description (Default)</label>
                                <textarea
                                    value={settings.seoSettings?.siteDescription || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, siteDescription: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Default site description for search engines"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1">Keywords (Comma separated)</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.siteKeywords?.join(', ') || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, siteKeywords: e.target.value.split(',').map(k => k.trim()) }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="news, portal, nepal, breaking"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">OG Image URL</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.ogImage || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, ogImage: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="/images/og-image.png"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Canonical URL</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.canonicalUrl || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, canonicalUrl: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Twitter Handle (@username)</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.twitterHandle || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, twitterHandle: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="@mywebsite"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Google & Bing */}
                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-medium text-white mb-3">Google & Webmaster Tools</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Google Analytics ID</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.googleAnalyticsId || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, googleAnalyticsId: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="G-XXXXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Google Site Verification</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.googleSiteVerification || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, googleSiteVerification: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Verification code"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Bing Site Verification</label>
                                <input
                                    type="text"
                                    value={settings.seoSettings?.bingSiteVerification || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        seoSettings: { ...settings.seoSettings, bingSiteVerification: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Verification code"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced */}
                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-medium text-white mb-3">Advanced Robots.txt</h3>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Custom robots.txt content</label>
                            <textarea
                                value={settings.seoSettings?.robotsTxt || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    seoSettings: { ...settings.seoSettings, robotsTxt: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                rows={4}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="enableSitemap"
                                checked={settings.seoSettings?.enableSitemap ?? true}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    seoSettings: { ...settings.seoSettings, enableSitemap: e.target.checked }
                                })}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="enableSitemap" className="text-white text-sm">Enable XML Sitemap Generation</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
