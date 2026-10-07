import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Search, Filter } from "lucide-react";
import EventModel, { EventCategory } from "@/models/Event";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import NepaliDate from "nepali-date-converter";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";

export const metadata: Metadata = {
    title: "नेपालका कार्यक्रम तथा इभेन्टहरू",
    description: "MeroNepalTv मा नेपालका आगामी सम्मेलन, महोत्सव, सांस्कृतिक, खेलकुद र मनोरञ्जन कार्यक्रमहरूको जानकारी हेर्नुहोस्।",
    alternates: { canonical: `${SITE_URL}/event` },
    openGraph: {
        title: "नेपालका कार्यक्रम तथा इभेन्टहरू | MeroNepalTv",
        description: "नेपालका आगामी सम्मेलन, महोत्सव, सांस्कृतिक, खेलकुद र मनोरञ्जन कार्यक्रमहरूको जानकारी।",
        url: `${SITE_URL}/event`,
        type: "website",
        locale: "ne_NP",
        siteName: "MeroNepalTv",
    },
};

// Use ISR with 300 second revalidation for better performance
export const revalidate = 300;

interface EventsPageProps {
    searchParams: Promise<{
        q?: string;
        category?: string;
        status?: string;
    }>;
}

// Helper to format date to Nepali
const formatDate = (date: Date) => {
    try {
        const nepDate = new NepaliDate(date);
        const months = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत"];
        return `${months[nepDate.getMonth()]} ${nepDate.getDate()}, ${nepDate.getYear()}`;
    } catch {
        return date.toISOString().split('T')[0];
    }
};

const CATEGORIES: { label: string; value: EventCategory }[] = [
    { label: "सम्मेलन", value: "conference" },
    { label: "सेमिनार", value: "seminar" },
    { label: "वर्कसप", value: "workshop" },
    { label: "महोत्सव", value: "festival" },
    { label: "खेलकुद", value: "sports" },
    { label: "सांस्कृतिक", value: "cultural" },
    { label: "राजनीतिक", value: "political" },
    { label: "धार्मिक", value: "religious" },
    { label: "अन्य", value: "other" },
];

export default async function EventsPage(props: EventsPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams.q;
    const category = searchParams.category as EventCategory | undefined;

    // Fetch events
    let events;
    if (query) {
        events = await EventModel.search(query);
    } else {
        events = await EventModel.findAll({
            category: category,
            published: true,
            status: 'upcoming' // Default to upcoming unless specified otherwise (TODO add status filter UI)
        });
    }

    const settings = await SettingsModel.get();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">कार्यक्रमहरु</h1>
                        <p className="text-gray-600">आगामी कार्यक्रम र गतिविधिहरु</p>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <form className="relative">
                            <input
                                type="text"
                                name="q"
                                defaultValue={query}
                                placeholder="कार्यक्रम खोज्नुहोस्..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </form>

                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                            <Link
                                href="/event"
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${!category
                                    ? "bg-red-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                    }`}
                            >
                                सबै
                            </Link>
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.value}
                                    href={`/event?category=${cat.value}`}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${category === cat.value
                                        ? "bg-red-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                        }`}
                                >
                                    {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <Link
                                key={event._id.toString()}
                                href={`/event/${event.slug}`}
                                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative aspect-video overflow-hidden bg-gray-100">
                                    {event.imageUrl ? (
                                        <Image
                                            src={event.imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Calendar size={48} opacity={0.5} />
                                        </div>
                                    )}

                                    {/* Date Badge */}
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-center min-w-[60px]">
                                        <span className="block text-xs text-gray-500 uppercase font-bold">
                                            {new Date(event.startDate).toLocaleString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="block text-xl font-bold text-red-600 leading-none">
                                            {new Date(event.startDate).getDate()}
                                        </span>
                                    </div>

                                    {/* Status Badge */}
                                    {event.status === 'upcoming' && (
                                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-medium">
                                            आउँदैछ
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-medium px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                            {event.category}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition">
                                        {event.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {event.description}
                                    </p>

                                    <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar size={16} className="text-red-500" />
                                            <span>
                                                {formatDate(event.startDate)}
                                                {event.startTime && ` • ${event.startTime}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <MapPin size={16} className="text-red-500" />
                                            <span className="truncate">
                                                {event.location.address}, {event.location.city}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">कुनै कार्यक्रम फेला परेन</h3>
                        <p className="text-gray-500">
                            {category ? "यो श्रेणीमा कुनै कार्यक्रम छैन" : "अहिले कुनै आगामी कार्यक्रम उपलब्ध छैन"}
                        </p>
                        <Link
                            href="/event"
                            className="mt-4 inline-block text-sm text-red-600 font-medium hover:underline"
                        >
                            सबै कार्यक्रम हेर्नुहोस्
                        </Link>
                    </div>
                )}
            </main>

            <Footer
                settings={settings.footerSettings}
                siteName={settings.siteName}
                logoUrl={settings.logoUrl}
                logoText={settings.logoText}
            />
        </div>
    );
}
