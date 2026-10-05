"use client";

import { useEffect, useState } from "react";
import {
    Plus, Trash2, Edit, Eye, EyeOff, MapPin, Calendar, ExternalLink, Star
} from "lucide-react";
import ImageUploadWithBrowser from "@/components/ImageUploadWithBrowser";
import Link from "next/link";

interface EventLocation {
    address: string;
    city: string;
    province?: string;
    country: string;
    lat?: number;
    lng?: number;
    googleMapsUrl?: string;
}

interface Event {
    _id: string;
    title: string;
    description: string;
    shortDescription?: string;
    imageUrl: string;
    category: string;
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
    location: EventLocation;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    organizer: string;
    organizerContact?: string;
    ticketUrl?: string;
    isFeatured: boolean;
    isPublished: boolean;
    registrationRequired: boolean;
    maxAttendees?: number;
    currentAttendees: number;
    tags: string[];
    viewCount: number;
}

const CATEGORIES = [
    { value: "conference", label: "साझा सम्मेलन (Conference)" },
    { value: "seminar", label: "गोष्ठी (Seminar)" },
    { value: "workshop", label: "कार्यशाला (Workshop)" },
    { value: "festival", label: "महोत्सव (Festival)" },
    { value: "sports", label: "खेलकुद (Sports)" },
    { value: "cultural", label: "सांस्कृतिक (Cultural)" },
    { value: "political", label: "राजनीतिक (Political)" },
    { value: "religious", label: "धार्मिक (Religious)" },
    { value: "other", label: "अन्य (Other)" },
];

const STATUSES = [
    { value: "upcoming", label: "आउँदै गरेको (Upcoming)", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { value: "ongoing", label: "चलिरहेको (Ongoing)", color: "bg-green-500/10 text-green-400 border-green-500/20" },
    { value: "completed", label: "सम्पन्न (Completed)", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    { value: "cancelled", label: "रद्द (Cancelled)", color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Event>>({
        title: "",
        description: "",
        shortDescription: "",
        imageUrl: "",
        category: "conference",
        status: "upcoming",
        location: {
            address: "",
            city: "",
            country: "Nepal",
            lat: 27.7172,
            lng: 85.3240, // Kathmandu coordinates
        },
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        organizer: "",
        organizerContact: "",
        ticketUrl: "",
        isFeatured: false,
        isPublished: true,
        registrationRequired: false,
        tags: [],
    });

    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingId ? `/api/events/${editingId}` : "/api/events";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchEvents();
                setShowForm(false);
                resetForm();
            } else {
                alert("Failed to save event");
            }
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                setEvents(events.filter(e => e._id !== id));
            }
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const handleEdit = (event: Event) => {
        setFormData({
            ...event,
            startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : "",
            endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : "",
        });
        setEditingId(event._id);
        setShowForm(true);
    };

    const handleToggleStatus = async (id: string, action: "toggleFeatured" | "togglePublished") => {
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                const updatedEvent = await res.json();
                setEvents(events.map(e => e._id === id ? updatedEvent : e));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            shortDescription: "",
            imageUrl: "",
            category: "conference",
            status: "upcoming",
            location: {
                address: "",
                city: "",
                country: "Nepal",
                lat: 27.7172,
                lng: 85.3240,
            },
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            organizer: "",
            organizerContact: "",
            ticketUrl: "",
            isFeatured: false,
            isPublished: true,
            registrationRequired: false,
            tags: [],
        });
        setEditingId(null);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()]
            });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter(t => t !== tag)
        });
    };

    if (showForm) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">
                        {editingId ? "Edit Event" : "Create New Event"}
                    </h1>
                    <button
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Details */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Basic Details</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Enter event title"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as NonNullable<Event["status"]> })}

                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        >
                                            {STATUSES.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Short Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.shortDescription}
                                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Brief summary used in cards..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Description</label>
                                    <textarea
                                        rows={8}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Detailed event information..."
                                    />
                                </div>
                            </div>

                            {/* Location & Map */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-blue-400" />
                                    Location
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Venue / Address</label>
                                        <input
                                            type="text"
                                            value={formData.location?.address}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                location: { ...formData.location!, address: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. Nepal Academy Hall, Kamaladi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.location?.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                location: { ...formData.location!, city: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.location?.country}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                location: { ...formData.location!, country: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Placeholder for Map - In a real app, integrate Google Maps here */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-400">Map Coordinates</label>
                                    <div className="w-full h-64 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 relative overflow-hidden group">

                                        {/* Simple visualization of inputs */}
                                        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=27.7172,85.3240&zoom=13&size=600x300&maptype=roadmap&key=YOUR_API_KEY')] bg-cover bg-center opacity-50 grayscale hover:grayscale-0 transition-all" />

                                        <div className="relative z-10 bg-slate-900/90 p-4 rounded-xl border border-slate-700 text-center">
                                            <p className="text-slate-300 text-sm mb-2">Google Map Integration</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={formData.location?.lat}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        location: { ...formData.location!, lat: parseFloat(e.target.value) }
                                                    })}
                                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-24"
                                                    placeholder="Lat"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    value={formData.location?.lng}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        location: { ...formData.location!, lng: parseFloat(e.target.value) }
                                                    })}
                                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white w-24"
                                                    placeholder="Lng"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition((position) => {
                                                            setFormData(annotated => ({
                                                                ...annotated,
                                                                location: {
                                                                    ...annotated.location!,
                                                                    lat: position.coords.latitude,
                                                                    lng: position.coords.longitude
                                                                }
                                                            }));
                                                        });
                                                    }
                                                }}
                                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 w-full"
                                            >
                                                <MapPin size={10} /> Use Current Location
                                            </button>

                                            <p className="text-xs text-slate-500 mt-2">Enter coordinates manually</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${formData.location?.lat},${formData.location?.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <ExternalLink size={12} /> Test on Google Maps
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {/* Date & Time */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar size={20} className="text-blue-400" />
                                    Date & Time
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Organizer & Tickets */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Organizer</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Organizer Name</label>
                                    <input
                                        type="text"
                                        value={formData.organizer}
                                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Ticket/Registration URL</label>
                                    <input
                                        type="url"
                                        value={formData.ticketUrl}
                                        onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Event Image</h3>
                                <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative group">
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <p className="text-sm">No image selected</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <ImageUploadWithBrowser
                                        value={formData.imageUrl}
                                        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                                        onRemove={() => setFormData({ ...formData, imageUrl: "" })}
                                    />
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-400">Published</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.isPublished ? "bg-green-500" : "bg-slate-700"
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isPublished ? "translate-x-6" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-400">Featured Event</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.isFeatured ? "bg-blue-500" : "bg-slate-700"
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isFeatured ? "translate-x-6" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                            >
                                {editingId ? "Update Event" : "Create Event"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Events Management</h1>
                    <p className="text-slate-400">Manage your events, schedules, and locations</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Event
                </button>
            </div>

            {/* Events List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : events.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                    <p className="text-slate-400 mb-6">Get started by creating your first event.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Create Event
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event._id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-colors">
                            {/* Card Image */}
                            <div className="relative aspect-video bg-slate-800">
                                {event.imageUrl ? (
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <Calendar size={32} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {event.isFeatured && (
                                        <div className="px-2 py-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-lg text-yellow-400 text-xs font-semibold flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> Featured
                                        </div>
                                    )}
                                    <div className={`px-2 py-1 backdrop-blur-md border rounded-lg text-xs font-semibold ${STATUSES.find(s => s.value === event.status)?.color
                                        }`}>
                                        {STATUSES.find(s => s.value === event.status)?.label.split('(')[0]}
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1" title={event.title}>
                                    {event.title}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Calendar size={14} className="text-blue-400" />
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString()}
                                            {event.startTime && ` • ${event.startTime}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MapPin size={14} className="text-red-400" />
                                        <span className="truncate">{event.location.city}, {event.location.country}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleStatus(event._id, "togglePublished")}
                                            className={`p-2 rounded-lg transition-colors ${event.isPublished ? "text-green-400 hover:bg-green-500/10" : "text-slate-500 hover:bg-slate-800"
                                                }`}
                                            title={event.isPublished ? "Published" : "Draft"}
                                        >
                                            {event.isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(event._id, "toggleFeatured")}
                                            className={`p-2 rounded-lg transition-colors ${event.isFeatured ? "text-yellow-400 hover:bg-yellow-500/10" : "text-slate-500 hover:bg-slate-800"
                                                }`}
                                            title="Toggle Featured"
                                        >
                                            <Star size={18} fill={event.isFeatured ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event._id)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
