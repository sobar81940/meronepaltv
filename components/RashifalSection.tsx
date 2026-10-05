"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface RashifalData {
    rashi: string;
    rashiEnglish: string;
    icon: string;
    letters: string;
    dateRange: string;
    prediction: string;
}

export default function RashifalSection() {
    const [rashifalData, setRashifalData] = useState<RashifalData[]>([]);
    const [nepaliDate, setNepaliDate] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRashifal = async () => {
            try {
                const res = await fetch("/api/rashifal");
                const data = await res.json();
                if (data.success) {
                    setRashifalData(data.data);
                    setNepaliDate(data.nepaliDate);
                }
            } catch (error) {
                console.error("Failed to fetch rashifal", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRashifal();
    }, []);

    if (loading && rashifalData.length === 0) return null;

    return (
        <section className="mb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-red-600">राशिफल</h2>
                    {nepaliDate && (
                        <>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <span className="text-sm font-medium text-gray-600">{nepaliDate}</span>
                        </>
                    )}
                </div>
                <Link
                    href="/rashifal"
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
                    विस्तृत
                    <ArrowUpRight size={16} />
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {rashifalData.map((rashi) => (
                    <Link
                        key={rashi.rashi}
                        href="/rashifal"
                        className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md hover:border-red-100 transition-all group h-full"
                    >
                        <div className="text-4xl text-red-600 mb-1 group-hover:scale-110 transition-transform">
                            {rashi.icon}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors">
                            {rashi.rashi} <span className="text-xs font-normal text-gray-500">राशि</span>
                        </h3>
                        <p className="text-xs text-gray-500 leading-tight">
                            {rashi.letters}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
