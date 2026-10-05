"use client";

import { useState, useEffect } from "react";
import { Save, Hash, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings } from "@/models/Settings";

export default function SocialSettingsPage() {
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
                if (!data.user) { router.push("/login"); return; }
                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;
                if (isAdmin || canManageSettings) setHasAccess(true);
                else setHasAccess(false);
            } catch (error) { setHasAccess(false); }
        };
        checkAccess();
    }, [router]);

    // Fetch settings
    useEffect(() => {
        fetch("/api/settings").then((res) => res.json()).then((data) => {
            if (data.success && data.data) setSettings(data.data);
        }).finally(() => setLoading(false));
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
            if (data.success) setMessage({ type: "success", text: "Social settings saved!" });
            else setMessage({ type: "error", text: "Failed to save settings" });
        } catch { setMessage({ type: "error", text: "Failed to save settings" }); }
        finally { setSaving(false); }
    };

    if (hasAccess === null || loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (hasAccess === false) return <div className="text-center p-8 text-white">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Hash className="text-blue-400" />
                        Social Media Settings
                    </h1>
                    <p className="text-slate-400 mt-1">Configure auto-posting to social networks</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Twitter / X */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                            <h3 className="font-medium text-white">Twitter (X)</h3>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    socialMedia: {
                                        ...settings.socialMedia,
                                        twitter: {
                                            ...settings.socialMedia?.twitter,
                                            enabled: !settings.socialMedia?.twitter?.enabled
                                        }
                                    }
                                })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.socialMedia?.twitter?.enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.socialMedia?.twitter?.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className={`space-y-4 ${!settings.socialMedia?.twitter?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">API Key</label>
                                <input type="password" value={settings.socialMedia?.twitter?.apiKey || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, twitter: { ...settings.socialMedia.twitter, apiKey: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Consumer Key" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">API Secret</label>
                                <input type="password" value={settings.socialMedia?.twitter?.apiSecret || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, twitter: { ...settings.socialMedia.twitter, apiSecret: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Consumer Secret" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Access Token</label>
                                <input type="password" value={settings.socialMedia?.twitter?.accessToken || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, twitter: { ...settings.socialMedia.twitter, accessToken: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Access Token" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Access Token Secret</label>
                                <input type="password" value={settings.socialMedia?.twitter?.accessTokenSecret || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, twitter: { ...settings.socialMedia.twitter, accessTokenSecret: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Access Token Secret" />
                            </div>
                        </div>
                    </div>

                    {/* Facebook */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                            <h3 className="font-medium text-white">Facebook</h3>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    socialMedia: {
                                        ...settings.socialMedia,
                                        facebook: {
                                            ...settings.socialMedia?.facebook,
                                            enabled: !settings.socialMedia?.facebook?.enabled
                                        }
                                    }
                                })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.socialMedia?.facebook?.enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.socialMedia?.facebook?.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className={`space-y-4 ${!settings.socialMedia?.facebook?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Page ID</label>
                                <input type="text" value={settings.socialMedia?.facebook?.pageId || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, facebook: { ...settings.socialMedia.facebook, pageId: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Facebook Page ID" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Page Access Token</label>
                                <input type="password" value={settings.socialMedia?.facebook?.pageAccessToken || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, facebook: { ...settings.socialMedia.facebook, pageAccessToken: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Page Access Token" />
                            </div>
                        </div>
                    </div>

                    {/* YouTube */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                            <h3 className="font-medium text-white">YouTube</h3>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    socialMedia: {
                                        ...settings.socialMedia,
                                        youtube: {
                                            ...settings.socialMedia?.youtube,
                                            enabled: !settings.socialMedia?.youtube?.enabled
                                        }
                                    }
                                })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.socialMedia?.youtube?.enabled ? 'bg-red-600' : 'bg-slate-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.socialMedia?.youtube?.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className={`space-y-4 ${!settings.socialMedia?.youtube?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">OAuth Client ID</label>
                                <input type="password" value={settings.socialMedia?.youtube?.clientId || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, youtube: { ...settings.socialMedia.youtube, clientId: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Google OAuth Client ID" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">OAuth Client Secret</label>
                                <input type="password" value={settings.socialMedia?.youtube?.clientSecret || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, youtube: { ...settings.socialMedia.youtube, clientSecret: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Google OAuth Client Secret" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Refresh Token</label>
                                <input type="password" value={settings.socialMedia?.youtube?.refreshToken || ''} onChange={(e) => setSettings({ ...settings, socialMedia: { ...settings.socialMedia, youtube: { ...settings.socialMedia.youtube, refreshToken: e.target.value } } })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="OAuth Refresh Token" />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Generate tokens via Google Cloud Console &gt; APIs & Services &gt; Credentials. Enable YouTube Data API v3.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
