"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Trash2, Edit, Eye, EyeOff, Plus, Search,
    CheckSquare, Square, AlertCircle, Newspaper,
    Tag, FolderOpen, CheckCircle, ChevronLeft,
    ChevronRight, FileText, Clock, TrendingUp,
    List, LayoutGrid, MoreHorizontal, Filter,
    ArrowUpDown, Calendar, User, Layers, Youtube, Facebook
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Post {
    _id: string;
    title: string;
    category?: string;
    published: boolean;
    isHeadline?: boolean;
    createdAt: string;
    author?: string;
    imageUrl?: string;
    viewCount?: number;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
}

export default function PostsPage() {
    const searchParams = useSearchParams();
    const shareType = searchParams.get("shareType");
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [limit] = useState(12);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, thisMonth: 0, headlines: 0 });

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (data.user) setUserRole(data.user.role);
            } catch (error) {
                console.error("Failed to fetch session:", error);
            }
        };
        fetchSession();
    }, []);

    useEffect(() => {
        fetch("/api/stats")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats({
                        total: data.data.totalPosts,
                        published: data.data.publishedPosts,
                        draft: data.data.draftPosts,
                        thisMonth: data.data.thisMonthPosts,
                        headlines: data.data.headlinePosts,
                    });
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (shareType) params.append("shareType", shareType);
            if (filterCategory) params.append("category", filterCategory);

            const res = await fetch(`/api/posts?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setPosts(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalPosts(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, limit, shareType, filterCategory]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    useEffect(() => {
        setPage(1);
    }, [shareType]);

    useEffect(() => {
        setPage(1);
    }, [filterCategory]);

    const pageTitle = shareType === "youtube"
        ? "YouTube Shorts"
        : shareType === "facebookReel"
            ? "Facebook Reels"
            : "Posts";

    const pageDescription = shareType === "youtube"
        ? "Manage posts marked for YouTube Shorts"
        : shareType === "facebookReel"
            ? "Manage posts marked for Facebook Reels"
            : "Manage your news articles";

    const isAdmin = userRole === "admin";

    const handleDelete = async (id: string) => {
        if (!isAdmin) { setError("Permission denied."); return; }
        if (!confirm("Delete this post?")) return;
        setError(null);
        try {
            const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPosts(posts.filter(p => p._id !== id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            } else {
                const data = await res.json();
                setError(data.error || "Failed to delete");
            }
        } catch { setError("Failed to delete post"); }
    };

    const handleBulkDelete = async () => {
        if (!isAdmin) { setError("Permission denied."); return; }
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} post(s)?`)) return;
        setError(null);
        setDeleting(true);
        try {
            const res = await fetch("/api/posts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPosts(posts.filter(p => !selectedIds.has(p._id)));
                setSelectedIds(new Set());
                setSuccess(`${data.deletedCount} post(s) deleted`);
            } else setError(data.error || "Failed to delete");
        } catch { setError("Failed to delete posts"); }
        finally { setDeleting(false); }
    };

    const handleBulkCategoryUpdate = async () => {
        if (!isAdmin || selectedIds.size === 0 || !selectedCategory) return;
        setError(null);
        setUpdating(true);
        try {
            const res = await fetch("/api/posts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds), updates: { category: selectedCategory } }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPosts(posts.map(p => selectedIds.has(p._id) ? { ...p, category: selectedCategory } : p));
                setSelectedIds(new Set());
                setShowCategoryModal(false);
                setSelectedCategory("");
                setSuccess(`${data.updatedCount} post(s) updated`);
            } else setError(data.error || "Failed to update");
        } catch { setError("Failed to update posts"); }
        finally { setUpdating(false); }
    };

    const handleBulkHeadlineToggle = async (setAsHeadline: boolean) => {
        if (!isAdmin || selectedIds.size === 0) return;
        setError(null);
        setUpdating(true);
        try {
            const res = await fetch("/api/posts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds), updates: { isHeadline: setAsHeadline } }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPosts(posts.map(p => selectedIds.has(p._id) ? { ...p, isHeadline: setAsHeadline } : p));
                setSelectedIds(new Set());
                setSuccess(`${data.updatedCount} post(s) ${setAsHeadline ? 'set as' : 'removed from'} headlines`);
            } else setError(data.error || "Failed to update");
        } catch { setError("Failed to update posts"); }
        finally { setUpdating(false); }
    };

    const handleTogglePublish = async (id: string) => {
        try {
            const res = await fetch(`/api/posts/${id}`, { method: "PATCH" });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map(p => (p._id === id ? data.data : p)));
            }
        } catch { console.error("Toggle failed"); }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === posts.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(posts.map(p => p._id)));
    };

    const allSelected = posts.length > 0 && selectedIds.size === posts.length;

    useEffect(() => {
        if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
    }, [success]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const statCards = [
        { label: "Total Posts", value: stats.total || totalPosts, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Published", value: stats.published, icon: Eye, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Drafts", value: stats.draft, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { label: "Headlines", value: stats.headlines, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
                    <p className="text-muted-foreground mt-1">{pageDescription}</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    New Post
                </Link>
            </div>

            {/* Messages */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl">
                    <CheckCircle className="text-green-400 shrink-0" size={20} />
                    <p className="text-green-400">{success}</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl">
                    <AlertCircle className="text-red-400 shrink-0" size={20} />
                    <p className="text-red-400">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-sm">Dismiss</button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl p-4 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-lg ${stat.bg} flex items-center justify-center`}>
                            <stat.icon size={22} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Search posts by title, content, or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-card rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="h-full appearance-none pl-10 pr-9 py-3 bg-card rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[160px]"
                            title="Filter by category"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={16} />
                    </div>
                    {filterCategory && (
                        <button
                            onClick={() => setFilterCategory("")}
                            className="px-3 py-3 rounded-xl bg-card text-muted-foreground hover:text-foreground transition-all text-sm"
                            title="Clear category filter"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-card text-primary" : "bg-card text-muted-foreground hover:text-foreground"}`}
                        title="List view"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-card text-primary" : "bg-card text-muted-foreground hover:text-foreground"}`}
                        title="Grid view"
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl">
                    <FileText size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                    <p className="text-lg font-medium text-foreground">No posts found</p>
                    <p className="text-muted-foreground text-sm mt-1">
                        {search ? "Try a different search term" : "Create your first post to get started"}
                    </p>
                    {!search && (
                        <Link
                            href="/admin/posts/new"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all"
                        >
                            <Plus size={18} />
                            Create Post
                        </Link>
                    )}
                </div>
            ) : viewMode === "list" ? (
                /* List View */
                <div className="bg-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ borderCollapse: "collapse", borderSpacing: 0 }}>
                            <thead>
                                <tr className="bg-muted/50">
                                    {isAdmin && (
                                        <th className="px-4 md:px-6 py-3 w-10">
                                            <button onClick={toggleSelectAll} className="flex items-center text-muted-foreground hover:text-foreground transition-colors" title={allSelected ? "Deselect all" : "Select all"}>
                                                {allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                                            </button>
                                        </th>
                                    )}
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><FileText size={14} /> Title</div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                        <div className="flex items-center gap-1"><Tag size={14} /> Category</div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                        <div className="flex items-center gap-1"><Eye size={14} /> Status</div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                        <div className="flex items-center gap-1"><Newspaper size={14} /> Headline</div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                        <div className="flex items-center gap-1"><Calendar size={14} /> Date</div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                        <div className="flex items-center justify-end gap-1"><ArrowUpDown size={14} /> Actions</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr
                                        key={post._id}
                                        className={`transition-all hover:bg-muted/30 ${selectedIds.has(post._id) ? "bg-primary/5" : ""}`}
                                    >
                                        {isAdmin && (
                                            <td className="px-4 md:px-6 py-4 w-10">
                                                <button onClick={() => toggleSelect(post._id)} className="text-muted-foreground hover:text-foreground transition-colors">
                                                    {selectedIds.has(post._id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                                                </button>
                                            </td>
                                        )}
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 w-10 h-10 rounded-lg bg-muted overflow-hidden hidden sm:block">
                                                    {post.imageUrl ? (
                                                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <FileText size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <Link
                                                        href={`/admin/posts/${post._id}/edit`}
                                                        className="text-sm font-medium text-black dark:text-white hover:text-primary transition-colors line-clamp-2"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User size={12} className="text-muted-foreground shrink-0" />
                                                        <span className="text-xs text-muted-foreground truncate">{post.author || "Unknown"}</span>
                                                        {post.viewCount !== undefined && (
                                                            <>
                                                                <span className="text-muted-foreground/50">·</span>
                                                                <Eye size={12} className="text-muted-foreground shrink-0" />
                                                                <span className="text-xs text-muted-foreground">{post.viewCount}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2 md:hidden">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${post.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                                            {post.published ? "Published" : "Draft"}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground truncate max-w-[100px]">{post.category || "—"}</span>
                                                        {post.isHeadline && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">Headline</span>}
                                                        <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(post.createdAt)}</span>
                                                    </div>
                                                    {/* Mobile action buttons */}
                                                    <div className="flex items-center gap-1 mt-2 md:hidden">
                                                        <button onClick={() => handleTogglePublish(post._id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all" title={post.published ? "Unpublish" : "Publish"}>
                                                            {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                        <Link href={`/admin/posts/${post._id}/edit`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all" title="Edit">
                                                            <Edit size={14} />
                                                        </Link>
                                                        {isAdmin && (
                                                            <button onClick={() => handleDelete(post._id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden md:table-cell align-middle">
                                            <span className="inline-block px-2.5 py-1 bg-muted rounded text-xs text-muted-foreground truncate max-w-[130px]">{post.category || "—"}</span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden md:table-cell align-middle">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${post.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                                {post.published ? "Published" : "Draft"}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden md:table-cell align-middle">
                                            {post.isHeadline ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[11px] font-medium">
                                                    <Newspaper size={11} />
                                                    Headline
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 hidden md:table-cell align-middle text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(post.createdAt)}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 align-middle hidden md:table-cell">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleTogglePublish(post._id)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all" title={post.published ? "Unpublish" : "Publish"}>
                                                    {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <Link href={`/admin/posts/${post._id}/edit`} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all" title="Edit">
                                                    <Edit size={16} />
                                                </Link>
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(post._id)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((post) => (
                        <div
                            key={post._id}
                            className={`bg-card rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 ${selectedIds.has(post._id) ? "ring-2 ring-primary" : ""}`}
                        >
                            {/* Thumbnail */}
                            <div className="relative h-40 bg-muted">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText size={40} className="text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    {post.isHeadline && (
                                        <span className="px-2 py-0.5 bg-purple-500/80 text-white rounded-full text-[10px] font-medium backdrop-blur-sm">Headline</span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${post.published ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-white"}`}>
                                        {post.published ? "Published" : "Draft"}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => toggleSelect(post._id)}
                                        className="absolute top-2 left-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-all"
                                    >
                                        {selectedIds.has(post._id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-muted-foreground" />}
                                    </button>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                                <Link
                                    href={`/admin/posts/${post._id}/edit`}
                                    className="text-sm font-medium text-black dark:text-white hover:text-primary transition-colors line-clamp-2"
                                >
                                    {post.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <User size={12} />
                                    <span className="truncate">{post.author || "Unknown"}</span>
                                    <span>·</span>
                                    <Calendar size={12} />
                                    <span>{formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground truncate">{post.category || "Uncategorized"}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 mt-3 pt-3">
                                    <button
                                        onClick={() => handleTogglePublish(post._id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                    >
                                        {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {post.published ? "Unpublish" : "Publish"}
                                    </button>
                                    <Link
                                        href={`/admin/posts/${post._id}/edit`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all"
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(post._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                        <span className="hidden sm:inline"> · {totalPosts} total posts</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (page <= 3) pageNum = i + 1;
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === pageNum ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="h-20" />

            {/* Floating Selection Bar */}
            {isAdmin && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card rounded-full px-5 py-2.5 shadow-xl flex items-center gap-3 z-50">
                    <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
                    <div className="h-5 w-px bg-border" />
                    <button
                        onClick={() => handleBulkHeadlineToggle(true)}
                        disabled={updating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-full text-xs transition-all disabled:opacity-50"
                    >
                        <Newspaper size={13} /> Headline
                    </button>
                    <button
                        onClick={() => handleBulkHeadlineToggle(false)}
                        disabled={updating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-full text-xs transition-all disabled:opacity-50"
                    >
                        <Newspaper size={13} /> Remove
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        disabled={updating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full text-xs transition-all disabled:opacity-50"
                    >
                        <Tag size={13} /> Category
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full text-xs transition-all disabled:opacity-50"
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground mb-1">Change Category</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            Select a new category for {selectedIds.size} selected post(s)
                        </p>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-background rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-6"
                        >
                            <option value="">Choose a category...</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCategoryModal(false); setSelectedCategory(""); }}
                                className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkCategoryUpdate}
                                disabled={!selectedCategory || updating}
                                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm font-medium"
                            >
                                {updating ? "Updating..." : "Update Category"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
