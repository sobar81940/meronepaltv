"use client";

import { useState, useEffect } from "react";
import { Save, Palette, Sun, Moon, Monitor, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings } from "@/models/Settings";

export default function ThemeSettingsPage() {
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

                if (isAdmin || canManageSettings) {
                    setHasAccess(true);
                } else {
                    setHasAccess(false);
                }
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
                setMessage({ type: "success", text: "Theme settings saved successfully!" });
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

    if (hasAccess === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <ShieldAlert className="text-red-400" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-white">Access Denied</h2>
            </div>
        );
    }

    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Palette className="text-pink-400" />
                        Theme Settings
                    </h1>
                    <p className="text-slate-400 mt-1">Manage color schemes and appearance</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Theme Mode */}
                    <div className="col-span-full mb-4">
                        <label className="block text-sm text-slate-400 mb-2">Theme Mode</label>
                        <div className="flex gap-2 max-w-md">
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, theme: 'light' }
                                })}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${settings.themeSettings?.theme === 'light'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                <Sun size={16} />
                                Light
                            </button>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, theme: 'dark' }
                                })}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${settings.themeSettings?.theme === 'dark'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                <Moon size={16} />
                                Dark
                            </button>
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, theme: 'system' }
                                })}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${settings.themeSettings?.theme === 'system'
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                <Monitor size={16} />
                                System
                            </button>
                        </div>
                    </div>

                    {/* Primary Color */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Primary Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.themeSettings?.primaryColor || '#e61e2b'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, primaryColor: e.target.value }
                                })}
                                className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={settings.themeSettings?.primaryColor || '#e61e2b'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, primaryColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Secondary Color */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Secondary Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.themeSettings?.secondaryColor || '#005677'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, secondaryColor: e.target.value }
                                })}
                                className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={settings.themeSettings?.secondaryColor || '#005677'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, secondaryColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Accent Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.themeSettings?.accentColor || '#f59e0b'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, accentColor: e.target.value }
                                })}
                                className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={settings.themeSettings?.accentColor || '#f59e0b'}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    themeSettings: { ...settings.themeSettings, accentColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Color Preview */}
                <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-600/50">
                    <label className="block text-sm text-slate-400 mb-2">Preview Palette</label>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-600" style={{ backgroundColor: settings.themeSettings?.primaryColor || '#e61e2b' }} />
                            <span className="text-xs text-slate-400">Primary</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-600" style={{ backgroundColor: settings.themeSettings?.secondaryColor || '#005677' }} />
                            <span className="text-xs text-slate-400">Secondary</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-600" style={{ backgroundColor: settings.themeSettings?.accentColor || '#f59e0b' }} />
                            <span className="text-xs text-slate-400">Accent</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
