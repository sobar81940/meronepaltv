"use client";

import { useState, useEffect } from "react";
import {
    Save, Plus, Trash2, GripVertical, Settings as SettingsIcon,
    LayoutTemplate, Type, Image as ImageIcon, TrendingUp, Megaphone,
    List, X, Monitor, Smartphone, Tablet, ChevronLeft, Layers,
    Palette, Box, Move, Eye, Undo, Redo, MousePointer2, Map, Grid3X3, Play, Radio, Newspaper
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings, HomeLayoutSection } from "@/models/Settings";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    useDraggable,
    DragStartEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryData {
    _id: string;
    name: string;
    slug: string;
    [key: string]: unknown;
}

interface AdData {
    _id: string;
    title: string;
    position: string;
    [key: string]: unknown;
}

// --- Draggable Sidebar Item ---
function SidebarItem({ type, icon, label, onClick }: { type: string, icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700 transition group cursor-pointer text-left"
        >
            <div className="text-slate-400 group-hover:text-blue-400 transition-colors">
                {icon}
            </div>
            <div className="flex-1">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white block">{label}</span>
                <span className="text-xs text-slate-500 capitalize">{type} Component</span>
            </div>
            <Plus size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

// --- Sortable Canvas Section ---
function SortableSection({
    section,
    index,
    onUpdate,
    onRemove,
    isActive = false,
    ads,
    categories
}: {
    section: HomeLayoutSection;
    index: number;
    onUpdate: (index: number, field: keyof HomeLayoutSection, value: string | number | boolean | undefined) => void;
    onRemove: (index: number) => void;
    isActive?: boolean;
    ads?: AdData[];
    categories?: CategoryData[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as const,
    };

    const sectionIcons: Record<string, React.ReactNode> = {
        hero: <ImageIcon className="text-purple-400" size={18} />,
        trending: <TrendingUp className="text-orange-400" size={18} />,
        latest: <List className="text-blue-400" size={18} />,
        category: <LayoutTemplate className="text-green-400" size={18} />,
        ad: <Megaphone className="text-yellow-400" size={18} />,
        headline: <Type className="text-red-400" size={18} />,
        gallery: <ImageIcon className="text-pink-400" size={18} />,
        province: <Map className="text-indigo-400" size={18} />,
        webstories: <Play className="text-fuchsia-400" size={18} />,
        livebroadcast: <Radio className="text-rose-400" size={18} />,
        frontpage: <Newspaper className="text-rose-500" size={18} />,
    };

    const sectionNames: Record<string, string> = {
        hero: "Hero Section (Slider)",
        trending: "Trending Topics Bar",
        latest: "Latest News List",
        category: "Category Block",
        ad: "Advertisement Banner",
        headline: "Headline Stories",
        gallery: "Media Gallery",
        province: "Province News",
        webstories: "Web Stories",
        livebroadcast: "Live Broadcast",
        frontpage: "राजनीति",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                relative bg-slate-800 rounded-lg border shadow-sm transition-all group
                ${isActive ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700 hover:border-slate-600'}
            `}
        >
            {/* Handle & Header */}
            <div className="flex items-center gap-3 p-3 border-b border-slate-700/50 bg-slate-800/50 rounded-t-lg">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-700 transition"
                >
                    <GripVertical size={16} />
                </button>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    {sectionIcons[section.type]}
                    <span>{sectionNames[section.type]}</span>
                    {section.type === 'category' && section.categoryId && (
                        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                            {categories?.find(c => c.slug === section.categoryId)?.name || section.categoryId}
                        </span>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={() => onRemove(index)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                        title="Remove Section"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Properties / Content Preview area */}
            <div className="p-4 bg-slate-900/30 rounded-b-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* Common: Title */}
                    {(section.type === 'category' || section.type === 'latest') && (
                        <div className="lg:col-span-6">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Title</label>
                            <input
                                type="text"
                                value={section.title || ''}
                                onChange={(e) => onUpdate(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600"
                                placeholder="Display Title..."
                            />
                        </div>
                    )}

                    {/* Category Selector */}
                    {section.type === 'category' && (
                        <div className="lg:col-span-3">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Select Category</label>
                            <select
                                value={section.categoryId || ''}
                                onChange={(e) => onUpdate(index, 'categoryId', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="">-- Select Category --</option>
                                {categories?.map((cat) => (
                                    <option key={cat._id} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Layout Selector */}
                    {(section.type === 'category' || section.type === 'latest') && (
                        <div className="lg:col-span-3">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Content Layout</label>
                            <select
                                value={section.layout || 'grid'}
                                onChange={(e) => onUpdate(index, 'layout', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="grid">Grid</option>
                                <option value="list">List</option>
                                <option value="featured">Featured</option>
                                <option value="magazine">Magazine</option>
                            </select>
                        </div>
                    )}

                    {/* Container Layout Selector (Global for all sections) */}
                    <div className="lg:col-span-3">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Container Display</label>
                        <select
                            value={section.containerLayout || 'block'}
                            onChange={(e) => onUpdate(index, 'containerLayout', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                        >
                            <option value="block">Block (Full Width)</option>
                            <option value="grid">Grid (Compact)</option>
                            <option value="flex">Flex (Row)</option>
                        </select>
                    </div>

                    {/* Ad Options */}
                    {section.type === 'ad' && (
                        <div className="lg:col-span-12">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Select Advertisement</label>
                            {ads && ads.length > 0 ? (
                                <select
                                    value={section.adPosition || ''}
                                    onChange={(e) => onUpdate(index, 'adPosition', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                                >
                                    <option value="">-- Select an Existing Ad --</option>
                                    {ads.map((ad) => (
                                        <option key={ad._id} value={ad.position}>
                                            {ad.title} ({ad.position})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-red-400 text-xs italic">No active advertisements found. Create one in the Ads manager first.</p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-1">Selects ads based on their assigned position.</p>
                        </div>
                    )}

                    {/* Placeholder for others */}
                    {(section.type === 'hero' || section.type === 'trending' || section.type === 'headline' || section.type === 'gallery' || section.type === 'province' || section.type === 'webstories' || section.type === 'livebroadcast' || section.type === 'frontpage') && (
                        <div className="lg:col-span-12">
                            <p className="text-xs text-slate-500 italic">
                                {section.type === 'livebroadcast'
                                    ? 'Configure live broadcast settings in Settings → Live Broadcast'
                                    : section.type === 'frontpage'
                                        ? 'Displays posts from the "राजनीति" category in a featured layout.'
                                        : 'This section has no additional configuration options.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HomeBuilderPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [ads, setAds] = useState<AdData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                const fetchedSettings = data.data;
                if (fetchedSettings && !fetchedSettings.homeLayout) {
                    fetchedSettings.homeLayout = [];
                }
                setSettings(fetchedSettings);
            })
            .catch(() => setMessage({ type: 'error', text: 'Failed to fetch settings' }))
            .finally(() => setLoading(false));

        // Fetch Ads
        fetch("/api/advertisements")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setAds(data.data);
            })
            .catch(console.error);

        // Fetch Categories
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setCategories(data.data);
            })
            .catch(console.error);
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
            if ((await res.json()).success) setMessage({ type: "success", text: "Home layout saved!" });
            else setMessage({ type: "error", text: "Failed to save" });
        } catch { setMessage({ type: "error", text: "Error saving settings" }); }
        finally { setSaving(false); }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        if (!settings?.homeLayout) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = settings.homeLayout.findIndex((item) => item.id === active.id);
        const newIndex = settings.homeLayout.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(settings.homeLayout, oldIndex, newIndex);
        setSettings({ ...settings, homeLayout: reordered.map((item, i) => ({ ...item, order: i })) });
    };

    const addSection = (type: HomeLayoutSection['type'], extraProps: Partial<HomeLayoutSection> = {}) => {
        if (!settings) return;
        const newSection: HomeLayoutSection = {
            id: `section-${Date.now()}`,
            type,
            order: settings.homeLayout.length,
            layout: 'grid',
            title: type === 'category' ? 'New Category' : type === 'latest' ? 'Latest News' : '',
            containerLayout: 'block', // default
            ...extraProps
        };
        setSettings({ ...settings, homeLayout: [...settings.homeLayout, newSection] });

        // Scroll to bottom after add (simple hack)
        setTimeout(() => {
            const element = document.getElementById('canvas-content');
            if (element) element.scrollTop = element.scrollHeight;
        }, 100);
    };

    const updateSection = (index: number, field: keyof HomeLayoutSection, value: string | number | boolean | undefined) => {
        if (!settings) return;
        const updated = [...settings.homeLayout];
        updated[index] = { ...updated[index], [field]: value };
        setSettings({ ...settings, homeLayout: updated });
    };

    const removeSection = (index: number) => {
        if (!settings) return;
        const updated = settings.homeLayout.filter((_, i) => i !== index);
        setSettings({ ...settings, homeLayout: updated.map((item, i) => ({ ...item, order: i })) });
    };

    if (loading) return (
        <div className="flex justify-center h-screen items-center bg-slate-950 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-slate-500 animate-pulse">Loading Builder...</p>
            </div>
        </div>
    );

    if (!settings) return <div className="text-red-400 p-8">Failed to load settings</div>;

    const availableBlocks = [
        { type: 'hero', label: 'Hero Slider', icon: <ImageIcon size={20} /> },
        { type: 'headline', label: 'Headline Stories', icon: <Type size={20} /> },
        { type: 'trending', label: 'Trending Bar', icon: <TrendingUp size={20} /> },
        { type: 'livebroadcast', label: 'Live Broadcast', icon: <Radio size={20} /> },
        { type: 'webstories', label: 'Web Stories', icon: <Play size={20} /> },
        { type: 'latest', label: 'Latest News List', icon: <List size={20} /> },
        { type: 'category', label: 'Category Block', icon: <LayoutTemplate size={20} /> },
        { id: 'latest_grid', type: 'category', label: 'Latest News Grid', icon: <Grid3X3 size={20} />, extra: { title: 'Latest News Grid', layout: 'grid' as const } },
        { type: 'gallery', label: 'Media Gallery', icon: <ImageIcon size={20} /> },
        { type: 'province', label: 'Province News', icon: <Map size={20} /> },
        { type: 'frontpage', label: 'राजनीति', icon: <Newspaper size={20} /> },
        { type: 'ad', label: 'Advert Banner', icon: <Megaphone size={20} /> },
    ];

    return (
        <div className="flex h-[calc(100vh-65px)] bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* LEFT SIDEBAR: BLOCKS */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                        <Box size={18} className="text-blue-500" />
                        Blocks
                    </h2>
                    <span className="text-xs text-slate-500">{availableBlocks.length} items</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Content Sections</p>
                    {availableBlocks.map((block) => (
                        <SidebarItem
                            key={block.id || block.type}
                            type={block.label}
                            label={block.label}
                            icon={block.icon}
                            onClick={() => addSection(block.type as HomeLayoutSection['type'], block.extra || {})}
                        />
                    ))}

                    <div className="mt-8 p-4 bg-slate-800/50 rounded border border-slate-700/50">
                        <p className="text-xs text-slate-400 leading-relaxed text-center">
                            Click a block above to append it to the bottom of your page layout.
                        </p>
                    </div>
                </div>
            </aside>

            {/* MAIN CANVAS AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                {/* TOOLBAR */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setViewport('desktop')}
                            className={`p-2 rounded transition ${viewport === 'desktop' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Monitor size={18} />
                        </button>
                        <button
                            onClick={() => setViewport('tablet')}
                            className={`p-2 rounded transition ${viewport === 'tablet' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Tablet size={18} />
                        </button>
                        <button
                            onClick={() => setViewport('mobile')}
                            className={`p-2 rounded transition ${viewport === 'mobile' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Smartphone size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500 mr-2 flex items-center gap-2">
                            {saving ? <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div> : <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            {saving ? 'Saving changes...' : 'Changes logged'}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-500/20 font-medium"
                        >
                            <Save size={18} />
                            <span>Publish</span>
                        </button>
                    </div>
                </header>

                {/* CANVAS */}
                <div
                    id="canvas-content"
                    className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-dots-slate-900/50"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                >
                    <div
                        className={`
                            mx-auto transition-all duration-300 ease-in-out min-h-[800px] 
                            ${viewport === 'desktop' ? 'max-w-4xl' : viewport === 'tablet' ? 'max-w-md' : 'max-w-sm'}
                        `}
                    >
                        {/* Preview Header Shim */}
                        <div className="h-16 bg-white rounded-t-xl mb-1 border-b flex items-center px-4 justify-between opacity-80 pointer-events-none select-none">
                            <div className="w-24 h-4 bg-slate-200 rounded"></div>
                            <div className="flex gap-2">
                                <div className="w-12 h-3 bg-slate-200 rounded"></div>
                                <div className="w-12 h-3 bg-slate-200 rounded"></div>
                            </div>
                        </div>

                        {/* Droppable Area */}
                        <div className="bg-white min-h-[600px] border-x border-b border-slate-200 shadow-2xl relative">
                            {/* Overlay for builder feel (bg-white is for canvas preview look) */}
                            <div className="absolute inset-0 bg-slate-50/50 pointer-events-none"></div>

                            <div className="relative z-10 p-4 space-y-3 pb-24">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    onDragStart={handleDragStart}
                                >
                                    <SortableContext items={settings.homeLayout.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                        {settings.homeLayout.map((section, index) => (
                                            <SortableSection
                                                key={section.id}
                                                section={section}
                                                index={index}
                                                onUpdate={updateSection}
                                                onRemove={removeSection}
                                                isActive={activeId === section.id}
                                                ads={ads}
                                                categories={categories}
                                            />
                                        ))}

                                        {settings.homeLayout.length === 0 && (
                                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
                                                <Layers size={48} className="mb-4 text-slate-300" />
                                                <p className="font-medium text-slate-500">Canvas is empty</p>
                                                <p className="text-sm">Click blocks in the sidebar to add sections</p>
                                            </div>
                                        )}
                                    </SortableContext>

                                    <DragOverlay dropAnimation={{
                                        sideEffects: defaultDropAnimationSideEffects({
                                            styles: { active: { opacity: '0.5' } },
                                        }),
                                    }}>
                                        {/* Simple overlay if needed, usually SortableContext handles this well */}
                                    </DragOverlay>
                                </DndContext>
                            </div>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="absolute bottom-6 right-6 z-50">
                        <div className={`
                            px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300
                            ${message.type === "success" ? "bg-slate-800 border-green-500 text-green-400" : "bg-slate-800 border-red-500 text-red-400"}
                        `}>
                            {message.type === 'success' ? <div className="w-2 h-2 bg-green-500 rounded-full"></div> : <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                            {message.text}
                            <button onClick={() => setMessage(null)} className="ml-2 hover:text-white"><X size={14} /></button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
