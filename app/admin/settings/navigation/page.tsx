"use client";

import { useState, useEffect } from "react";
import { Save, Menu, Plus, Trash2, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteSettings, NavItem } from "@/models/Settings";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Navigation Item Component
function SortableNavItem({
    item,
    index,
    onUpdate,
    onRemove,
}: {
    item: NavItem;
    index: number;
    onUpdate: (index: number, field: keyof NavItem, value: string) => void;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `nav-${index}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="text-slate-500 hover:text-slate-300" size={18} />
            </button>
            <input
                type="text"
                placeholder="Nepali name (e.g., होमपेज)"
                value={item.nameNe || item.name}
                onChange={(e) => onUpdate(index, "nameNe", e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="text"
                placeholder="English name (e.g., Home)"
                value={item.nameEn || ""}
                onChange={(e) => onUpdate(index, "nameEn", e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="text"
                placeholder="URL (e.g., /)"
                value={item.href}
                onChange={(e) => onUpdate(index, "href", e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={() => onRemove(index)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}

export default function NavigationSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchSettings = () => {
        fetch("/api/settings").then((res) => res.json()).then((data) => {
            if (data.success && data.data) setSettings(data.data);
        }).finally(() => setLoading(false));
    };

    // Check user access and fetch
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (!data.user) { router.push("/login"); return; }
                const isAdmin = data.user.role === "admin";
                const canManageSettings = data.user.permissions?.canManageSettings ?? false;
                if (isAdmin || canManageSettings) { setHasAccess(true); fetchSettings(); }
                else setHasAccess(false);
            } catch { setHasAccess(false); }
        };
        checkAccess();
    }, [router]);

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
            if ((await res.json()).success) setMessage({ type: "success", text: "Navigation saved!" });
            else setMessage({ type: "error", text: "Failed to save" });
        } catch { setMessage({ type: "error", text: "Failed to save" }); }
        finally { setSaving(false); }
    };

    // Navigation handlers
    const addNavItem = () => {
        if (!settings) return;
        const newItem: NavItem = {
            name: "",
            nameNe: "",
            nameEn: "",
            href: "/",
            order: settings.navigations.length,
        };
        setSettings({ ...settings, navigations: [...settings.navigations, newItem] });
    };

    const updateNavItem = (index: number, field: keyof NavItem, value: string) => {
        if (!settings) return;
        const updated = [...settings.navigations];
        updated[index] = { ...updated[index], [field]: value };
        setSettings({ ...settings, navigations: updated });
    };

    const removeNavItem = (index: number) => {
        if (!settings) return;
        const updated = settings.navigations.filter((_, i) => i !== index);
        setSettings({ ...settings, navigations: updated.map((item, i) => ({ ...item, order: i })) });
    };

    const handleNavDragEnd = (event: DragEndEvent) => {
        if (!settings) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = parseInt(String(active.id).split("-")[1]);
        const newIndex = parseInt(String(over.id).split("-")[1]);

        const reordered = arrayMove(settings.navigations, oldIndex, newIndex);
        setSettings({ ...settings, navigations: reordered.map((item, i) => ({ ...item, order: i })) });
    };

    if (hasAccess === null || loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (hasAccess === false) return <div className="text-center p-8 text-white">Access Denied</div>;
    if (!settings) return <div className="text-red-400">Failed to load settings</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Menu className="text-green-400" />
                        Navigation Settings
                    </h1>
                    <p className="text-slate-400 mt-1">Configure the main site navigation menu</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                    <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (<div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{message.text}</div>)}

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Menu size={20} className="text-green-400" />
                        Menu Items
                    </h2>
                    <button onClick={addNavItem} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavDragEnd}>
                    <SortableContext items={settings.navigations.map((_, i) => `nav-${i}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {settings.navigations.map((item, index) => (
                                <SortableNavItem
                                    key={`nav-${index}`}
                                    item={item}
                                    index={index}
                                    onUpdate={updateNavItem}
                                    onRemove={removeNavItem}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
