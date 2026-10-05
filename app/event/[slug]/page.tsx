import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock, User, Mail, Tag, ArrowLeft, Share2, ExternalLink } from "lucide-react";
import EventModel from "@/models/Event";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import NepaliDate from "nepali-date-converter";
import { Metadata } from "next";

// Use ISR with 60 second revalidation for better performance
export const revalidate = 60;

interface EventDetailPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate Metadata
export async function generateMetadata(props: EventDetailPageProps): Promise<Metadata> {
    const params = await props.params;
    const slug = decodeURIComponent(params.slug);
    const event = await EventModel.findBySlug(slug);
    if (!event) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rangamanch.com";
    const eventUrl = `${siteUrl}/event/${slug}`;

    const description = event.shortDescription || event.description.substring(0, 160);
    const ogImage = event.imageUrl || `${siteUrl}/images/og-image.png`;

    return {
        title: event.title,
        description,
        alternates: {
            canonical: eventUrl,
        },
        openGraph: {
            title: event.title,
            description,
            url: eventUrl,
            type: "article",
            locale: "ne_NP",
            images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: event.title,
            description,
            images: [ogImage],
        },
    };
}

// Helper to format date to Nepali
const formatDate = (date: Date) => {
    try {
        const nepDate = new NepaliDate(date);
        const months = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत"];
        const days = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
        return `${months[nepDate.getMonth()]} ${nepDate.getDate()}, ${nepDate.getYear()} (${days[nepDate.getDay()]})`;
    } catch {
        return date.toLocaleDateString();
    }
};

export default async function EventDetailPage(props: EventDetailPageProps) {
    const params = await props.params;
    const slug = decodeURIComponent(params.slug);
    const event = await EventModel.findBySlug(slug);

    if (!event) {
        notFound();
    }

    // Increment view count
    await EventModel.incrementViewCount(event._id.toString());
    const settings = await SettingsModel.get();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "name": event.title,
                            "description": event.shortDescription || event.description.substring(0, 200),
                            "image": event.imageUrl,
                            "startDate": new Date(event.startDate).toISOString(),
                            "endDate": event.endDate ? new Date(event.endDate).toISOString() : undefined,
                            "location": {
                                "@type": "Place",
                                "name": event.location.address,
                                "address": {
                                    "@type": "PostalAddress",
                                    "streetAddress": event.location.address,
                                    "addressLocality": event.location.city,
                                    "addressRegion": event.location.province || undefined,
                                    "addressCountry": event.location.country,
                                },
                            },
                            "organizer": {
                                "@type": "Person",
                                "name": event.organizer,
                            },
                            "eventStatus": event.status === "cancelled" ? "https://schema.org/EventCancelled"
                                : event.status === "completed" ? "https://schema.org/EventPostponed"
                                : "https://schema.org/EventScheduled",
                        }),
                    }}
                />

                {/* Breadcrumb / Back Link */}
                <div className="mb-6">
                    <Link href="/event" className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 transition">
                        <ArrowLeft size={16} className="mr-1" />
                        सबै कार्यक्रमहरु
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Col */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Hero */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="relative aspect-video w-full bg-gray-100">
                                {event.imageUrl ? (
                                    <Image
                                        src={event.imageUrl}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Calendar size={64} />
                                    </div>
                                )}

                                <div className="absolute top-4 left-4">
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                        {event.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                    {event.title}
                                </h1>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={18} className="text-red-600" />
                                        <span className="font-medium text-gray-900">{formatDate(event.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={18} className="text-red-600" />
                                        <span>{event.startTime || "समय तोकिएको छैन"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={18} className="text-red-600" />
                                        <span>{event.location.city}</span>
                                    </div>
                                </div>

                                <div className="prose prose-lg max-w-none text-gray-700">
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">कार्यक्रमको बारेमा</h2>
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {event.description}
                                    </div>
                                </div>

                                {event.tags && event.tags.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-2">
                                            {event.tags.map(tag => (
                                                <Link
                                                    key={tag}
                                                    href={`/event?q=${encodeURIComponent(tag)}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-full transition"
                                                >
                                                    <Tag size={12} />
                                                    {tag}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map Section */}
                        {event.location.lat && event.location.lng && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="text-red-600" />
                                    स्थान नक्सा
                                </h2>
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 relative">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${event.location.lat},${event.location.lng}&z=15&output=embed`}
                                        allowFullScreen
                                        aria-hidden="false"
                                        tabIndex={0}
                                    />
                                    <div className="absolute bottom-4 right-4">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition"
                                        >
                                            <ExternalLink size={16} /> Google Maps मा हेर्नुहोस्
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-4 text-gray-600">
                                    <strong>ठेगाना:</strong> {event.location.address}, {event.location.city}, {event.location.country}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Right Col */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Event Details Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                विवरण
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">मिति र समय</div>
                                    <div className="font-medium text-gray-900">
                                        {formatDate(event.startDate)}
                                        <br />
                                        {event.startTime} देखि {event.endTime || "..."} सम्म
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">स्थान</div>
                                    <div className="font-medium text-gray-900">
                                        {event.location.city}
                                        <div className="text-sm text-gray-500 font-normal">{event.location.address}</div>
                                    </div>
                                </div>

                                {event.ticketUrl && (
                                    <div className="pt-2">
                                        <a
                                            href={event.ticketUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-3 bg-red-600 text-white text-center font-bold rounded-lg hover:bg-red-700 transition shadow-sm hover:shadow-md"
                                        >
                                            टिकट बुकिङ गर्नुहोस्
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Organizer Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                आयोजक
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <User size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{event.organizer}</div>
                                        <div className="text-sm text-gray-500">आयोजक संस्था</div>
                                    </div>
                                </div>

                                {event.organizerEmail && (
                                    <a href={`mailto:${event.organizerEmail}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline pl-1">
                                        <Mail size={16} />
                                        {event.organizerEmail}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Share Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                सेयर गर्नुहोस्
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    Facebook
                                </button>
                                <button className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition">
                                    Twitter
                                </button>
                                <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
