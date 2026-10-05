"use client";

import { useState, useEffect } from "react";
import {
    Radio,
    Save,
    Youtube,
    Facebook,
    Globe,
    Power,
    Calendar,
    Play,
    Eye,
    Settings,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Clock,
    Link as LinkIcon,
} from "lucide-react";

interface LiveBroadcastSettings {
    enabled: boolean;
    title: string;
    description: string;
    facebookLiveUrl: string;
    youtubeLiveUrl: string;
    customEmbedUrl: string;
    activePlatform: 'facebook' | 'youtube' | 'custom' | 'none';
    isScheduled: boolean;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    autoplay: boolean;
    showChat: boolean;
    position: 'top' | 'sidebar' | 'section';
}

const defaultSettings: LiveBroadcastSettings = {
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
};

export default function LiveBroadcastPage() {
    const [settings, setSettings] = useState<LiveBroadcastSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'links' | 'display' | 'schedule'>('links');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                if (data.liveBroadcast) {
                    setSettings({ ...defaultSettings, ...data.liveBroadcast });
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ liveBroadcast: settings }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'सेटिङहरू सफलतापूर्वक सेभ भयो!' });
            } else {
                throw new Error("Failed to save");
            }
        } catch {
            setMessage({ type: 'error', text: 'सेभ गर्न असफल भयो। पुनः प्रयास गर्नुहोस्।' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleChange = <K extends keyof LiveBroadcastSettings>(key: K, value: LiveBroadcastSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Extract YouTube ID for preview
    const getYoutubeId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-white" />
                        </div>
                        लाइभ प्रसारण सेटिङ
                    </h1>
                    <p className="text-slate-400 mt-1">Facebook र YouTube लाइभ स्ट्रिम लिंकहरू व्यवस्थापन गर्नुहोस्</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    सेभ गर्नुहोस्
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Main Toggle */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                            <Power className={`w-6 h-6 ${settings.enabled ? 'text-green-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">लाइभ प्रसारण सक्षम गर्नुहोस्</h3>
                            <p className="text-slate-400 text-sm">वेबसाइटमा लाइभ स्ट्रिम प्रदर्शन गर्नुहोस्</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => handleChange('enabled', e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-14 h-7 rounded-full transition-colors ${settings.enabled ? 'bg-green-500' : 'bg-slate-700'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${settings.enabled ? 'translate-x-8' : 'translate-x-1'} mt-1`} />
                        </div>
                    </label>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
                {[
                    { id: 'links', label: 'प्लेटफर्म लिंकहरू', icon: LinkIcon },
                    { id: 'display', label: 'प्रदर्शन सेटिङ', icon: Eye },
                    { id: 'schedule', label: 'तालिका', icon: Calendar },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'links' | 'display' | 'schedule')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                {/* Links Tab */}
                {activeTab === 'links' && (
                    <div className="space-y-6">
                        {/* Active Platform Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">सक्रिय प्लेटफर्म</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
                                    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'blue' },
                                    { id: 'custom', label: 'Custom Embed', icon: Globe, color: 'purple' },
                                    { id: 'none', label: 'None', icon: Power, color: 'slate' },
                                ].map(platform => (
                                    <button
                                        key={platform.id}
                                        onClick={() => handleChange('activePlatform', platform.id as 'facebook' | 'youtube' | 'custom' | 'none')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.activePlatform === platform.id
                                            ? `border-${platform.color}-500 bg-${platform.color}-500/10`
                                            : 'border-slate-700 hover:border-slate-600'
                                            }`}
                                    >
                                        <platform.icon className={`w-6 h-6 ${settings.activePlatform === platform.id
                                            ? platform.color === 'red' ? 'text-red-500' : platform.color === 'blue' ? 'text-blue-500' : platform.color === 'purple' ? 'text-purple-500' : 'text-slate-400'
                                            : 'text-slate-500'
                                            }`} />
                                        <span className={`text-sm font-medium ${settings.activePlatform === platform.id ? 'text-white' : 'text-slate-400'}`}>
                                            {platform.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* YouTube Link */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <Youtube className="w-4 h-4 text-red-500" />
                                YouTube लाइभ URL
                            </label>
                            <input
                                type="url"
                                value={settings.youtubeLiveUrl}
                                onChange={(e) => handleChange('youtubeLiveUrl', e.target.value)}
                                placeholder="https://youtube.com/live/..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                            />
                            {settings.youtubeLiveUrl && getYoutubeId(settings.youtubeLiveUrl) && (
                                <div className="mt-3 rounded-xl overflow-hidden bg-slate-800 aspect-video max-w-md">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYoutubeId(settings.youtubeLiveUrl)}`}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>

                        {/* Facebook Link */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <Facebook className="w-4 h-4 text-blue-500" />
                                Facebook लाइभ URL
                            </label>
                            <input
                                type="url"
                                value={settings.facebookLiveUrl}
                                onChange={(e) => handleChange('facebookLiveUrl', e.target.value)}
                                placeholder="https://facebook.com/..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                            <p className="text-slate-500 text-xs mt-1">Facebook लाइभ भिडियोको पूर्ण URL राख्नुहोस्</p>
                        </div>

                        {/* Custom Embed */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <Globe className="w-4 h-4 text-purple-500" />
                                Custom Embed URL
                            </label>
                            <input
                                type="url"
                                value={settings.customEmbedUrl}
                                onChange={(e) => handleChange('customEmbedUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                            />
                            <p className="text-slate-500 text-xs mt-1">अन्य प्लेटफर्महरूको लागि embed URL</p>
                        </div>

                        {/* Title & Description */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">शीर्षक</label>
                                <input
                                    type="text"
                                    value={settings.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="लाइभ प्रसारण"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">विवरण</label>
                                <input
                                    type="text"
                                    value={settings.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="हाम्रो लाइभ स्ट्रिम हेर्नुहोस्"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Display Tab */}
                {activeTab === 'display' && (
                    <div className="space-y-6">
                        {/* Position Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">प्रदर्शन स्थान</label>
                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { id: 'top', label: 'Top Banner', desc: 'हेडर तलको ब्यानर' },
                                    { id: 'section', label: 'Section', desc: 'होमपेजमा पूर्ण सेक्सन' },
                                    { id: 'sidebar', label: 'Sidebar', desc: 'साइडबारमा कम्प्याक्ट' },
                                ].map(pos => (
                                    <button
                                        key={pos.id}
                                        onClick={() => handleChange('position', pos.id as 'top' | 'sidebar' | 'section')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${settings.position === pos.id
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-slate-700 hover:border-slate-600'
                                            }`}
                                    >
                                        <h4 className={`font-medium ${settings.position === pos.id ? 'text-white' : 'text-slate-300'}`}>
                                            {pos.label}
                                        </h4>
                                        <p className="text-slate-500 text-sm mt-1">{pos.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div className="space-y-4">
                            {/* Autoplay */}
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Play className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-white font-medium">Autoplay</p>
                                        <p className="text-slate-500 text-sm">स्वचालित रूपमा भिडियो प्ले गर्नुहोस्</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoplay}
                                        onChange={(e) => handleChange('autoplay', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${settings.autoplay ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${settings.autoplay ? 'translate-x-6' : 'translate-x-1'} mt-1`} />
                                    </div>
                                </label>
                            </div>

                            {/* Show Chat */}
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-white font-medium">च्याट देखाउनुहोस्</p>
                                        <p className="text-slate-500 text-sm">लाइभ च्याट सेक्सन प्रदर्शन गर्नुहोस्</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.showChat}
                                        onChange={(e) => handleChange('showChat', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${settings.showChat ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${settings.showChat ? 'translate-x-6' : 'translate-x-1'} mt-1`} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        {/* Enable Schedule */}
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-white font-medium">तालिका सक्षम गर्नुहोस्</p>
                                    <p className="text-slate-500 text-sm">निश्चित समयमा मात्र लाइभ देखाउनुहोस्</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.isScheduled}
                                    onChange={(e) => handleChange('isScheduled', e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full transition-colors ${settings.isScheduled ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${settings.isScheduled ? 'translate-x-6' : 'translate-x-1'} mt-1`} />
                                </div>
                            </label>
                        </div>

                        {settings.isScheduled && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">सुरु समय</label>
                                    <input
                                        type="datetime-local"
                                        value={settings.scheduledStartTime || ''}
                                        onChange={(e) => handleChange('scheduledStartTime', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">अन्त्य समय</label>
                                    <input
                                        type="datetime-local"
                                        value={settings.scheduledEndTime || ''}
                                        onChange={(e) => handleChange('scheduledEndTime', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-blue-300 font-medium">नोट</p>
                                    <p className="text-blue-400/80 text-sm mt-1">
                                        तालिका सक्षम भएमा, लाइभ स्ट्रिम सुरु र अन्त्य समय बीचमा मात्र प्रदर्शन हुनेछ।
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-slate-400" />
                    पूर्वावलोकन
                </h3>
                <div className="bg-slate-800 rounded-xl p-4">
                    {settings.enabled && settings.activePlatform !== 'none' ? (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-xl">
                            <div className="relative">
                                <Radio className="w-8 h-8 text-red-400" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">{settings.title}</p>
                                <p className="text-slate-400 text-sm">{settings.description}</p>
                                <p className="text-slate-500 text-xs mt-1">
                                    Platform: {settings.activePlatform.charAt(0).toUpperCase() + settings.activePlatform.slice(1)} •
                                    Position: {settings.position}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>लाइभ प्रसारण सक्षम छैन</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
