"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// Convert to Nepali numerals
function toNepaliNumerals(num: number | string): string {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit)]);
}

// Format number with commas (Nepali style)
function formatNumber(num: number, decimals = 2): string {
    return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

interface MarketIndex {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    turnover: number;
}

interface StockData {
    symbol: string;
    name: string;
    ltp: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
}

// Mock data for NEPSE (since live API requires authentication)
const mockMarketData: MarketIndex = {
    name: "NEPSE",
    value: 2845.67,
    change: 23.45,
    changePercent: 0.83,
    high: 2856.12,
    low: 2822.34,
    volume: 12456789,
    turnover: 4567890123
};

const mockSubIndices: { name: string; value: number; change: number }[] = [
    { name: "सेन्सेटिभ", value: 512.34, change: 2.15 },
    { name: "फ्लोट", value: 189.67, change: -0.45 },
    { name: "सेन्सेटिभ फ्लोट", value: 134.89, change: 1.23 },
    { name: "बैंकिङ", value: 1456.78, change: 12.34 },
    { name: "विकास बैंक", value: 3234.56, change: -8.90 },
    { name: "फाइनान्स", value: 1678.90, change: 5.67 },
    { name: "होटल र पर्यटन", value: 2345.67, change: -3.21 },
    { name: "जीवन बीमा", value: 8901.23, change: 45.67 },
];

const mockTopGainers: StockData[] = [
    { symbol: "NABIL", name: "नबिल बैंक", ltp: 1245.00, change: 100.00, changePercent: 8.73, high: 1250.00, low: 1140.00, volume: 45678 },
    { symbol: "NTC", name: "नेपाल टेलिकम", ltp: 890.00, change: 65.00, changePercent: 7.88, high: 895.00, low: 825.00, volume: 23456 },
    { symbol: "NICA", name: "एनआईसी एशिया", ltp: 567.00, change: 39.00, changePercent: 7.39, high: 570.00, low: 528.00, volume: 34567 },
    { symbol: "GBIME", name: "ग्लोबल आईएमई", ltp: 456.00, change: 28.00, changePercent: 6.54, high: 460.00, low: 428.00, volume: 56789 },
    { symbol: "SBL", name: "सिद्धार्थ बैंक", ltp: 345.00, change: 20.00, changePercent: 6.15, high: 348.00, low: 325.00, volume: 12345 },
];

const mockTopLosers: StockData[] = [
    { symbol: "SHIVM", name: "शिवम् सिमेन्ट", ltp: 567.00, change: -45.00, changePercent: -7.35, high: 612.00, low: 565.00, volume: 23456 },
    { symbol: "UPPER", name: "अपर तामाकोशी", ltp: 432.00, change: -32.00, changePercent: -6.90, high: 464.00, low: 430.00, volume: 34567 },
    { symbol: "HIDCL", name: "हाइड्रो इन्भेस्टमेन्ट", ltp: 234.00, change: -15.00, changePercent: -6.02, high: 249.00, low: 232.00, volume: 45678 },
    { symbol: "NHPC", name: "नेशनल हाइड्रो", ltp: 123.00, change: -7.00, changePercent: -5.38, high: 130.00, low: 122.00, volume: 56789 },
    { symbol: "CHCL", name: "छिमेक लघु", ltp: 789.00, change: -42.00, changePercent: -5.05, high: 831.00, low: 785.00, volume: 12345 },
];

const mockTopTurnover: StockData[] = [
    { symbol: "NABIL", name: "नबिल बैंक", ltp: 1245.00, change: 100.00, changePercent: 8.73, high: 1250.00, low: 1140.00, volume: 145678 },
    { symbol: "GBIME", name: "ग्लोबल आईएमई", ltp: 456.00, change: 28.00, changePercent: 6.54, high: 460.00, low: 428.00, volume: 123456 },
    { symbol: "NICA", name: "एनआईसी एशिया", ltp: 567.00, change: 39.00, changePercent: 7.39, high: 570.00, low: 528.00, volume: 98765 },
    { symbol: "NTC", name: "नेपाल टेलिकम", ltp: 890.00, change: 65.00, changePercent: 7.88, high: 895.00, low: 825.00, volume: 87654 },
    { symbol: "SBL", name: "सिद्धार्थ बैंक", ltp: 345.00, change: 20.00, changePercent: 6.15, high: 348.00, low: 325.00, volume: 76543 },
];

export default function ShareMarketDashboard() {
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
    const [marketData] = useState<MarketIndex>(mockMarketData);
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'turnover'>('gainers');

    const handleRefresh = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLastUpdated(new Date());
            setIsLoading(false);
        }, 1000);
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return "text-green-600";
        if (change < 0) return "text-red-600";
        return "text-gray-600";
    };

    const getChangeBg = (change: number) => {
        if (change > 0) return "bg-green-50";
        if (change < 0) return "bg-red-50";
        return "bg-gray-50";
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <ArrowUpRight className="w-4 h-4" />;
        if (change < 0) return <ArrowDownRight className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getActiveStocks = () => {
        switch (activeTab) {
            case 'gainers': return mockTopGainers;
            case 'losers': return mockTopLosers;
            case 'turnover': return mockTopTurnover;
            default: return mockTopGainers;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        शेयर मार्केट
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">नेप्से सूचकाङ्क र शेयर बजार अपडेट</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    रिफ्रेस गर्नुहोस्
                </button>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
                <p className="text-xs text-gray-500" suppressHydrationWarning>
                    अन्तिम अपडेट: {lastUpdated.toLocaleTimeString('ne-NP')}
                </p>
            )}

            {/* Main Index Card */}
            <div className={`rounded-2xl p-6 ${marketData.change >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white shadow-xl`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-white/80 text-sm font-medium">नेप्से सूचकाङ्क</p>
                        <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-4xl md:text-5xl font-bold">{formatNumber(marketData.value)}</span>
                            <span className="flex items-center gap-1 text-lg font-semibold">
                                {marketData.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                {marketData.change >= 0 ? '+' : ''}{formatNumber(marketData.change)}
                                <span className="text-white/80">({marketData.changePercent >= 0 ? '+' : ''}{formatNumber(marketData.changePercent)}%)</span>
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white/70">उच्च</p>
                            <p className="font-semibold text-lg">{formatNumber(marketData.high)}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white/70">न्यून</p>
                            <p className="font-semibold text-lg">{formatNumber(marketData.low)}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white/70">कारोबार संख्या</p>
                            <p className="font-semibold text-lg">{toNepaliNumerals(marketData.volume.toLocaleString('en-IN'))}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white/70">कारोबार रकम</p>
                            <p className="font-semibold text-lg">रु. {toNepaliNumerals((marketData.turnover / 10000000).toFixed(2))} करोड</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Indices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-800">उप-सूचकाङ्कहरू</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y divide-gray-100">
                    {mockSubIndices.map((index) => (
                        <div key={index.name} className="p-3 hover:bg-gray-50 transition">
                            <p className="text-xs text-gray-500 truncate">{index.name}</p>
                            <p className="font-semibold text-gray-900">{formatNumber(index.value)}</p>
                            <p className={`text-xs font-medium flex items-center gap-1 ${getChangeColor(index.change)}`}>
                                {getChangeIcon(index.change)}
                                {index.change >= 0 ? '+' : ''}{formatNumber(index.change)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stocks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('gainers')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'gainers' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <TrendingUp className="w-4 h-4 inline mr-2" />
                        उच्च बृद्धि
                    </button>
                    <button
                        onClick={() => setActiveTab('losers')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'losers' ? 'text-red-600 border-b-2 border-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <TrendingDown className="w-4 h-4 inline mr-2" />
                        उच्च गिरावट
                    </button>
                    <button
                        onClick={() => setActiveTab('turnover')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'turnover' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        उच्च कारोबार
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">कम्पनी</th>
                                <th className="px-4 py-3 text-right">अन्तिम मूल्य</th>
                                <th className="px-4 py-3 text-right">परिवर्तन</th>
                                <th className="px-4 py-3 text-right hidden sm:table-cell">उच्च</th>
                                <th className="px-4 py-3 text-right hidden sm:table-cell">न्यून</th>
                                <th className="px-4 py-3 text-right hidden md:table-cell">कारोबार</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {getActiveStocks().map((stock) => (
                                <tr key={stock.symbol} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{stock.symbol}</p>
                                        <p className="text-xs text-gray-500">{stock.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        रु. {formatNumber(stock.ltp)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeBg(stock.change)} ${getChangeColor(stock.change)}`}>
                                            {getChangeIcon(stock.change)}
                                            {stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)} ({formatNumber(stock.changePercent)}%)
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600 hidden sm:table-cell">
                                        {formatNumber(stock.high)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600 hidden sm:table-cell">
                                        {formatNumber(stock.low)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600 hidden md:table-cell">
                                        {toNepaliNumerals(stock.volume.toLocaleString('en-IN'))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    <strong>नोट:</strong> यो डेमो डाटा हो। वास्तविक शेयर मूल्यहरूको लागि कृपया नेप्से वा आधिकारिक स्रोतहरूमा जानुहोस्।
                    शेयर बजारमा लगानी जोखिमपूर्ण हुन्छ। लगानी गर्नुअघि विशेषज्ञको सल्लाह लिनुहोस्।
                </p>
            </div>
        </div>
    );
}
