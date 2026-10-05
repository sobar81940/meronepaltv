"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Settings, Upload, Image as ImageIcon, Globe, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiteSettings } from "@/models/Settings";

export default function GeneralSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (!data.user) { router.push("/login"); return; }
                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;
                if (isAdmin || canManageSettings) { setHasAccess(true); fetchSettings(); }
                else setHasAccess(false);
            } catch (error) { setHasAccess(false); }
        };
        checkAccess();
    }, [router]);

    const fetchSettings = () => {
        fetch("/api/settings").then((res) => res.json()).then((data) => {
            if (data.success && data.data) setSettings(data.data);
        }).finally(() => setLoading(false));
    }

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings)
            });
            if ((await res.json()).success) setMessage({ type: "success", text: "Settings saved successfully!" });
            else setMessage({ type: "error", text: "Failed to save settings" });
        } catch { setMessage({ type: "error", text: "Failed to save settings" }); }
        finally { setSaving(false); }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings) return;
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success && data.data?.url) {
                setSettings({ ...settings, logoUrl: data.data.url });
                setMessage({ type: "success", text: "Logo uploaded! Click Save Changes to apply." });
            } else setMessage({ type: "error", text: "Upload failed" });
        } catch { setMessage({ type: "error", text: "Upload failed" }); }
        finally { setUploadingLogo(false); }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings) return;
        setUploadingFavicon(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success && data.data?.url) {
                setSettings({ ...settings, faviconUrl: data.data.url });
                setMessage({ type: "success", text: "Favicon uploaded! Click Save Changes to apply." });
            } else setMessage({ type: "error", text: "Favicon upload failed" });
        } catch { setMessage({ type: "error", text: "Favicon upload failed" }); }
        finally { setUploadingFavicon(false); }
    };

    const removeLogo = () => {
        if (!settings) return;
        setSettings({ ...settings, logoUrl: "" });
    };

    const removeFavicon = () => {
        if (!settings) return;
        setSettings({ ...settings, faviconUrl: "" });
    };

    if (hasAccess === null || loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (hasAccess === false) return <div className="text-center p-8 text-white">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Settings className="text-blue-400" />
                        General Information
                    </h1>
                    <p className="text-slate-400 mt-1">Manage basic site details and branding</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (<div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{message.text}</div>)}

            {/* Site Info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-blue-400" />
                    Site Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Site Name / App Name</label>
                        <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Your Site Name" />
                        <p className="text-xs text-slate-500 mt-1">This appears in browser tab and as the main site title</p>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Tagline</label>
                        <input type="text" value={settings.siteTagline} onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Short tagline" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Logo Text (Short)</label>
                        <input type="text" value={settings.logoText} onChange={(e) => setSettings({ ...settings, logoText: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" maxLength={2} />
                        <p className="text-xs text-slate-500 mt-1">Used when logo image is not available. Max 2 chars.</p>
                    </div>
                </div>
            </div>

            {/* Logo Settings */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-400" />
                    Logo Setup
                </h2>
                <div className="flex items-start gap-8">
                    <div className="flex-shrink-0">
                        <label className="block text-sm text-slate-400 mb-2">Current Logo</label>
                        <div className="w-32 h-32 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden relative group">
                            {settings.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo" width={128} height={128} className="object-contain w-full h-full p-2" />
                            ) : (
                                <div className="text-slate-500 flex flex-col items-center">
                                    <ImageIcon size={32} />
                                    <span className="text-xs mt-1">No Logo</span>
                                </div>
                            )}
                            {settings.logoUrl && (
                                <button onClick={removeLogo} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition" title="Remove Logo">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-slate-400 mb-2">Upload New Logo</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition">
                                <Upload size={18} />
                                Choose Image
                            </button>
                            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            {uploadingLogo && <span className="text-slate-400 text-sm">Uploading...</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Recommended: PNG or SVG, max 2MB. Transparent background preferred.</p>
                        <div className="mt-6">
                            <label className="block text-sm text-slate-400 mb-2">Logo Size Preference</label>
                            <div className="flex gap-4">
                                {(['small', 'medium', 'large'] as const).map((size) => (
                                    <label key={size} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={settings.logoSize === size} onChange={() => setSettings({ ...settings, logoSize: size })} className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-600 ring-offset-slate-800" />
                                        <span className="text-slate-300 capitalize">{size}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Favicon Settings */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-green-400" />
                    Favicon (Browser Tab Icon)
                </h2>
                <div className="flex items-start gap-8">
                    <div className="flex-shrink-0">
                        <label className="block text-sm text-slate-400 mb-2">Current Favicon</label>
                        <div className="w-20 h-20 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden relative group">
                            {settings.faviconUrl ? (
                                <Image src={settings.faviconUrl} alt="Favicon" width={64} height={64} className="object-contain w-full h-full p-2" />
                            ) : (
                                <div className="text-slate-500 flex flex-col items-center">
                                    <Globe size={24} />
                                    <span className="text-xs mt-1">Default</span>
                                </div>
                            )}
                            {settings.faviconUrl && (
                                <button onClick={removeFavicon} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition" title="Remove Favicon">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-slate-400 mb-2">Upload New Favicon</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => faviconInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition">
                                <Upload size={18} />
                                Choose Icon
                            </button>
                            <input ref={faviconInputRef} type="file" accept="image/x-icon,image/vnd.microsoft.icon,image/ico,image/icon,.ico,image/png,image/svg+xml" onChange={handleFaviconUpload} className="hidden" />
                            {uploadingFavicon && <span className="text-slate-400 text-sm">Uploading...</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Recommended: 32x32 or 64x64 pixels. PNG, ICO, or SVG format.</p>
                        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <p className="text-xs text-slate-400">
                                <strong className="text-slate-300">Tip:</strong> The favicon appears in browser tabs, bookmarks, and history. Use a simple, recognizable icon that represents your site.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Display Options */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Display Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                        <input type="checkbox" checked={settings.showSiteName} onChange={(e) => setSettings({ ...settings, showSiteName: e.target.checked })} className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800" />
                        <div><span className="block text-white font-medium">Show Site Name</span><span className="text-xs text-slate-400">Display text next to logo</span></div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition">
                        <input type="checkbox" checked={settings.showSiteTagline} onChange={(e) => setSettings({ ...settings, showSiteTagline: e.target.checked })} className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800" />
                        <div><span className="block text-white font-medium">Show Tagline</span><span className="text-xs text-slate-400">Display tagline in header</span></div>
                    </label>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Browser Tab Preview</h2>
                <div className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 bg-slate-700 rounded-t-lg px-3 py-2 w-fit max-w-xs">
                        {settings.faviconUrl ? (
                            <Image src={settings.faviconUrl} alt="Favicon" width={16} height={16} className="w-4 h-4 object-contain" />
                        ) : (
                            <Globe size={16} className="text-slate-400" />
                        )}
                        <span className="text-sm text-slate-200 truncate">
                            {settings.siteName || "Your Site Name"}
                        </span>
                        <X size={14} className="text-slate-500 ml-2" />
                    </div>
                    <div className="border-t border-slate-600 mt-0 pt-3">
                        <p className="text-xs text-slate-500">This is how your site will appear in browser tabs</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

