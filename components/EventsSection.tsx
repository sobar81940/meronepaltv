import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";

interface HomeEvent {
    _id: string;
    title: string;
    slug: string;
    imageUrl: string;
    location: {
        city: string;
        address: string;
    };
    startDate: string; // ISO string
    status: string;
    category: string;
}

interface EventsSectionProps {
    events: HomeEvent[];
    title?: string;
}

// Helper to format date to Nepali
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const nepDate = new NepaliDate(date);
        const months = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत"];
        return `${months[nepDate.getMonth()]} ${nepDate.getDate()}, ${nepDate.getYear()}`;
    } catch {
        return dateString;
    }
};

export default function EventsSection({ events, title = "कार्यक्रमहरु" }: EventsSectionProps) {
    if (events.length === 0) return null;

    return (
        <section className="mb-10">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-3">
                    {title}
                </h2>
                <Link
                    href="/events"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                    सबै हेर्नुहोस् <ArrowRight size={16} />
                </Link>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                    <Link
                        key={event._id}
                        href={`/event/${event.slug}`}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col h-full"
                    >
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden bg-gray-100">
                            {event.imageUrl ? (
                                <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Calendar size={32} />
                                </div>
                            )}

                            {/* Date Badge */}
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm text-xs font-bold text-red-600 border border-red-100">
                                {formatDate(event.startDate)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
                                    {event.category}
                                </span>
                                {event.status === 'upcoming' && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-green-50 text-green-600 rounded-full uppercase tracking-wider">
                                        आउँदैछ
                                    </span>
                                )}
                            </div>

                            <h3 className="text-gray-900 font-bold leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                                {event.title}
                            </h3>

                            <div className="mt-auto pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="truncate">
                                    {event.location?.city || event.location?.address}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
