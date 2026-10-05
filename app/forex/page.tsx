"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import FooterClient from "@/components/FooterClient";
import Link from "next/link";
import { RefreshCw, TrendingUp, DollarSign, Calendar, Search, ArrowUpDown, ArrowLeft } from "lucide-react";

interface ForexRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string;
    sell: string;
}

// Currency flags mapping
const currencyFlags: Record<string, string> = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'GBP': '🇬🇧',
    'CHF': '🇨🇭',
    'AUD': '🇦🇺',
    'CAD': '🇨🇦',
    'SGD': '🇸🇬',
    'JPY': '🇯🇵',
    'CNY': '🇨🇳',
    'SAR': '🇸🇦',
    'QAR': '🇶🇦',
    'THB': '🇹🇭',
    'AED': '🇦🇪',
    'MYR': '🇲🇾',
    'KRW': '🇰🇷',
    'SEK': '🇸🇪',
    'DKK': '🇩🇰',
    'HKD': '🇭🇰',
    'KWD': '🇰🇼',
    'BHD': '🇧🇭',
    'INR': '🇮🇳',
};

// Popular currencies to show first
const popularCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'INR', 'AED', 'SAR'];

export default function ForexPage() {
    const [rates, setRates] = useState<ForexRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [date, setDate] = useState<string>("");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "buy" | "sell">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const fetchRates = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/forex");
            const data = await res.json();

            if (data.success) {
                setRates(data.data);
                setDate(data.date);
            } else {
                setError(data.error || "Failed to fetch rates");
            }
        } catch (err) {
            setError("Failed to fetch exchange rates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    // Filter and sort rates
    const filteredRates = rates
        .filter(rate =>
            rate.currency.name.toLowerCase().includes(search.toLowerCase()) ||
            rate.currency.iso3.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === "name") {
                comparison = a.currency.name.localeCompare(b.currency.name);
            } else if (sortBy === "buy") {
                comparison = parseFloat(a.buy) - parseFloat(b.buy);
            } else {
                comparison = parseFloat(a.sell) - parseFloat(b.sell);
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

    // Separate popular and other currencies
    const popularRates = filteredRates.filter(r => popularCurrencies.includes(r.currency.iso3));
    const otherRates = filteredRates.filter(r => !popularCurrencies.includes(r.currency.iso3));

    const handleSort = (col: "name" | "buy" | "sell") => {
        if (sortBy === col) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortOrder("asc");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                        }} />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">विदेशी मुद्रा विनिमय दर</h1>
                                <p className="text-white/80 mt-1">नेपाल राष्ट्र बैंक द्वारा प्रकाशित</p>
                            </div>
                        </div>

                        {date && (
                            <div className="flex items-center gap-2 text-white/90 mt-4">
                                <Calendar size={18} />
                                <span>मिति: {new Date(date).toLocaleDateString('ne-NP', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="मुद्रा खोज्नुहोस्... (USD, Euro, Dollar)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchRates}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
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
                {loading && rates.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <RefreshCw size={48} className="animate-spin mx-auto text-primary mb-4" />
                        <p className="text-gray-500">विनिमय दर लोड हुँदैछ...</p>
                    </div>
                )}

                {/* Popular Currencies */}
                {!loading && popularRates.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="text-primary" size={24} />
                            लोकप्रिय मुद्राहरू
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {popularRates.map((rate) => (
                                <div
                                    key={rate.currency.iso3}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">{currencyFlags[rate.currency.iso3] || '💱'}</span>
                                        <div>
                                            <p className="font-bold text-gray-900">{rate.currency.iso3}</p>
                                            <p className="text-xs text-gray-500">{rate.currency.unit} Unit</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">खरिद</span>
                                            <span className="font-semibold text-green-600">रू {parseFloat(rate.buy).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">बिक्री</span>
                                            <span className="font-semibold text-red-600">रू {parseFloat(rate.sell).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Currencies Table */}
                {!loading && filteredRates.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">सबै मुद्राहरू</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <button
                                                onClick={() => handleSort("name")}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-primary"
                                            >
                                                मुद्रा
                                                <ArrowUpDown size={14} />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Unit
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSort("buy")}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-primary ml-auto"
                                            >
                                                खरिद दर (रू)
                                                <ArrowUpDown size={14} />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSort("sell")}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-primary ml-auto"
                                            >
                                                बिक्री दर (रू)
                                                <ArrowUpDown size={14} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRates.map((rate) => (
                                        <tr key={rate.currency.iso3} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{currencyFlags[rate.currency.iso3] || '💱'}</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{rate.currency.iso3}</p>
                                                        <p className="text-sm text-gray-500">{rate.currency.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {rate.currency.unit}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-green-600">
                                                    रू {parseFloat(rate.buy).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-red-600">
                                                    रू {parseFloat(rate.sell).toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredRates.length === 0 && !error && (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">कुनै विनिमय दर भेटिएन</p>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-2">जानकारी</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• विनिमय दर नेपाल राष्ट्र बैंक (NRB) बाट प्राप्त गरिएको हो।</li>
                        <li>• दरहरू प्रत्येक बैंकिङ दिन अद्यावधिक हुन्छन्।</li>
                        <li>• खरिद दर = बैंकले विदेशी मुद्रा खरिद गर्ने दर।</li>
                        <li>• बिक्री दर = बैंकले विदेशी मुद्रा बिक्री गर्ने दर।</li>
                    </ul>
                </div>
            </main>

            {/* Simple Footer */}
            <FooterClient />
        </div>
    );
}
