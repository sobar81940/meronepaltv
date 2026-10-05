"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit, Plus, X, Check, ChevronRight, ChevronDown } from "lucide-react";

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    parentId?: string | null;
    children?: Category[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [flatCategories, setFlatCategories] = useState<Category[]>([]); // For parent dropdown
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        color: "#3B82F6",
        parentId: ""
    });

    const fetchCategories = async () => {
        try {
            // Fetch hierarchical structure
            const res = await fetch("/api/categories?nested=true");
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
                // Expand all by default
                const allIds = new Set<string>();
                const collectIds = (cats: Category[]) => {
                    cats.forEach(c => {
                        if (c.children && c.children.length > 0) {
                            allIds.add(c._id);
                            collectIds(c.children);
                        }
                    });
                };
                collectIds(data.data);
                setExpandedIds(allIds);
            }

            // Fetch flat list for dropdown
            const flatRes = await fetch("/api/categories");
            const flatData = await flatRes.json();
            if (flatData.success) setFlatCategories(flatData.data);
        } catch (error) {
            console.error("Failed to fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    parentId: form.parentId || null,
                }),
            });

            if (res.ok) {
                fetchCategories();
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save:", error);
        }
    };

    const handleEdit = (category: Category) => {
        setForm({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            color: category.color,
            parentId: category.parentId || "",
        });
        setEditingId(category._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category? Subcategories will become root categories.")) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) fetchCategories();
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const resetForm = () => {
        setForm({ name: "", slug: "", description: "", color: "#3B82F6", parentId: "" });
        setEditingId(null);
        setShowForm(false);
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const colors = [
        "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
        "#8B5CF6", "#EC4899", "#06B6D4", "#6366F1",
    ];

    // Render category item with children
    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category._id);

        return (
            <div key={category._id}>
                <div
                    className={`bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4 ${level > 0 ? 'ml-8 border-l-2' : ''}`}
                    style={{ borderLeftColor: level > 0 ? category.color : undefined }}
                >
                    {/* Expand/Collapse button */}
                    <button
                        onClick={() => hasChildren && toggleExpand(category._id)}
                        className={`p-1 rounded transition ${hasChildren ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-transparent cursor-default'}`}
                        disabled={!hasChildren}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                        ) : (
                            <span className="w-[18px] h-[18px] block" />
                        )}
                    </button>

                    <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            {category.name}
                            {hasChildren && (
                                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                                    {category.children!.length} subcategories
                                </span>
                            )}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            <span className="text-slate-500">Slug:</span> /{category.slug}
                        </p>
                        {category.description && (
                            <p className="text-slate-500 text-sm truncate mt-1">
                                {category.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Render children */}
                {hasChildren && isExpanded && (
                    <div className="mt-2 space-y-2">
                        {category.children!.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Get valid parent options (exclude editing category and its children)
    const getParentOptions = () => {
        if (!editingId) return flatCategories;

        // Find all descendants of the editing category
        const descendants = new Set<string>();
        const findDescendants = (parentId: string) => {
            flatCategories.forEach(cat => {
                if (cat.parentId === parentId) {
                    descendants.add(cat._id);
                    findDescendants(cat._id);
                }
            });
        };
        findDescendants(editingId);

        return flatCategories.filter(cat =>
            cat._id !== editingId && !descendants.has(cat._id)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Categories</h1>
                    <p className="text-slate-400 mt-1">Manage post categories and subcategories</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">
                                {editingId ? "Edit Category" : "New Category"}
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    URL Slug (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="auto-generated if left empty"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Example: /category/{form.slug || 'category-name'}
                                </p>
                            </div>

                            {/* Parent Category Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Parent Category
                                </label>
                                <select
                                    value={form.parentId}
                                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None (Root Category)</option>
                                    {getParentOptions().map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Leave empty to create a root category
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Color
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setForm({ ...form, color })}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${form.color === color ? "scale-110 ring-2 ring-white" : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {form.color === color && <Check size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-slate-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                                >
                                    {editingId ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Categories List - Hierarchical */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center text-slate-400 py-8">Loading...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No categories</div>
                ) : (
                    categories.map((category) => renderCategory(category))
                )}
            </div>
        </div>
    );
}

