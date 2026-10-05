"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import FooterClient from "@/components/FooterClient";
import Link from "next/link";
import { RefreshCw, Star, Calendar, Heart, Briefcase, Activity, Sparkles, ArrowLeft } from "lucide-react";

interface RashifalData {
    rashi: string;
    rashiEnglish: string;
    icon: string;
    dateRange: string;
    prediction: string;
    lucky: {
        number: string;
        color: string;
        day: string;
    };
    compatibility: string;
    mood: string;
    health: string;
    career: string;
    love: string;
}

// Gradient colors for each rashi card
const rashiGradients: Record<string, string> = {
    "मेष": "from-red-500 to-orange-500",
    "वृष": "from-green-500 to-emerald-600",
    "मिथुन": "from-yellow-400 to-amber-500",
    "कर्कट": "from-blue-400 to-cyan-500",
    "सिंह": "from-orange-500 to-yellow-500",
    "कन्या": "from-emerald-500 to-teal-600",
    "तुला": "from-pink-400 to-rose-500",
    "वृश्चिक": "from-purple-600 to-indigo-700",
    "धनु": "from-violet-500 to-purple-600",
    "मकर": "from-gray-600 to-slate-700",
    "कुम्भ": "from-sky-400 to-blue-500",
    "मीन": "from-teal-400 to-cyan-600",
};

export default function RashifalPage() {
    const [rashifalData, setRashifalData] = useState<RashifalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nepaliDate, setNepaliDate] = useState<string>("");
    const [selectedRashi, setSelectedRashi] = useState<RashifalData | null>(null);

    const fetchRashifal = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/rashifal");
            const data = await res.json();

            if (data.success) {
                setRashifalData(data.data);
                setNepaliDate(data.nepaliDate);
            } else {
                setError(data.error || "Failed to fetch rashifal");
            }
        } catch (err) {
            setError("राशिफल लोड गर्न असफल");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRashifal();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
                    {/* Decorative Stars */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-4 left-10 text-white/20 text-4xl">✦</div>
                        <div className="absolute top-12 right-20 text-white/15 text-2xl">★</div>
                        <div className="absolute bottom-8 left-1/4 text-white/20 text-3xl">✧</div>
                        <div className="absolute bottom-4 right-10 text-white/15 text-xl">✦</div>
                        <div className="absolute top-1/2 right-1/4 text-white/10 text-5xl">☆</div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Sparkles size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">आजको राशिफल</h1>
                                <p className="text-white/80 mt-1">दैनिक ज्योतिषीय भविष्यवाणी</p>
                            </div>
                        </div>

                        {nepaliDate && (
                            <div className="flex items-center gap-2 text-white/90 mt-4">
                                <Calendar size={18} />
                                <span>{nepaliDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={fetchRashifal}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        ताजा गर्नुहोस्
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && rashifalData.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <RefreshCw size={48} className="animate-spin mx-auto text-purple-600 mb-4" />
                        <p className="text-gray-500">राशिफल लोड हुँदैछ...</p>
                    </div>
                )}

                {/* Rashi Grid */}
                {!loading && rashifalData.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {rashifalData.map((rashi) => (
                            <button
                                key={rashi.rashi}
                                onClick={() => setSelectedRashi(rashi)}
                                className={`bg-gradient-to-br ${rashiGradients[rashi.rashi]} p-6 rounded-2xl text-white text-center hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                            >
                                <span className="text-5xl block mb-3">{rashi.icon}</span>
                                <h3 className="text-xl font-bold">{rashi.rashi}</h3>
                                <p className="text-white/80 text-sm">{rashi.rashiEnglish}</p>
                                <p className="text-white/70 text-xs mt-1">{rashi.dateRange}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Selected Rashi Detail Modal */}
                {selectedRashi && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedRashi(null)}
                    >
                        <div
                            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={`bg-gradient-to-br ${rashiGradients[selectedRashi.rashi]} p-6 rounded-t-3xl text-white text-center`}>
                                <span className="text-6xl block mb-2">{selectedRashi.icon}</span>
                                <h2 className="text-2xl font-bold">{selectedRashi.rashi}</h2>
                                <p className="text-white/80">{selectedRashi.rashiEnglish}</p>
                                <p className="text-white/70 text-sm mt-1">{selectedRashi.dateRange}</p>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Main Prediction */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6">
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Star className="text-purple-600" size={18} />
                                        आजको भविष्यवाणी
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">{selectedRashi.prediction}</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-pink-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Heart className="text-pink-500" size={16} />
                                            <span className="text-xs text-gray-500">प्रेम</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{selectedRashi.love}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Briefcase className="text-blue-500" size={16} />
                                            <span className="text-xs text-gray-500">करियर</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{selectedRashi.career}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="text-green-500" size={16} />
                                            <span className="text-xs text-gray-500">स्वास्थ्य</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{selectedRashi.health}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="text-amber-500" size={16} />
                                            <span className="text-xs text-gray-500">मुड</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{selectedRashi.mood}</p>
                                    </div>
                                </div>

                                {/* Lucky Info */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                                    <h3 className="font-bold text-gray-900 mb-3">भाग्यशाली</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                            🔢 अंक: <strong>{selectedRashi.lucky.number}</strong>
                                        </span>
                                        <span className="bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                            🎨 रंग: <strong>{selectedRashi.lucky.color}</strong>
                                        </span>
                                        <span className="bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                            📅 दिन: <strong>{selectedRashi.lucky.day}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Compatibility */}
                                <div className="bg-pink-50 rounded-xl p-4 text-center">
                                    <p className="text-sm text-gray-500 mb-1">मेल खाने राशि</p>
                                    <p className="font-bold text-lg text-pink-600">{selectedRashi.compatibility}</p>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedRashi(null)}
                                    className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition"
                                >
                                    बन्द गर्नुहोस्
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Rashifal Quick View */}
                {!loading && rashifalData.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="text-purple-600" />
                            सबै राशिफल
                        </h2>
                        <div className="grid gap-4">
                            {rashifalData.map((rashi) => (
                                <div
                                    key={rashi.rashi}
                                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`bg-gradient-to-br ${rashiGradients[rashi.rashi]} w-16 h-16 rounded-xl flex items-center justify-center text-3xl text-white shrink-0`}>
                                            {rashi.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{rashi.rashi}</h3>
                                                <span className="text-gray-400 text-sm">({rashi.rashiEnglish})</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">{rashi.prediction}</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">प्रेम: {rashi.love}</span>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">करियर: {rashi.career}</span>
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">स्वास्थ्य: {rashi.health}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedRashi(rashi)}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        >
                                            थप हेर्नुहोस्
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-purple-50 border border-purple-100 rounded-xl p-6">
                    <h3 className="font-bold text-purple-900 mb-2">जानकारी</h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                        <li>• यो राशिफल सामान्य ज्योतिषीय व्याख्यामा आधारित छ।</li>
                        <li>• राशिफलहरू प्रत्येक दिन अद्यावधिक हुन्छन्।</li>
                        <li>• व्यक्तिगत जन्म कुण्डली अनुसार भिन्न हुन सक्छ।</li>
                        <li>• मनोरञ्जनको लागि मात्र प्रयोग गर्नुहोस्।</li>
                    </ul>
                </div>
            </main>

            {/* Footer */}
            <FooterClient />
        </div>
    );
}
