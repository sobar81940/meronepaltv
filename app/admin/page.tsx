import PostModel from "@/models/Post";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Clock3,
    Eye,
    EyeOff,
    ExternalLink,
    FileText,
    FolderOpen,
    Image as ImageIcon,
    List,
    Plus,
    Settings,
    Share2,
    Tags,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import AdminStatsCards from "@/components/AdminStatsCards";

export const dynamic = "force-dynamic";

function relativeTime(date: Date | string) {
    const diff = Math.max(0, Date.now() - new Date(date).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Sparkline({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 110 42" className="h-12 w-28 overflow-visible" aria-hidden="true">
            <defs>
                <linearGradient id={`fill-${color}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".24" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M2 35 C14 24, 18 30, 27 20 S43 28, 53 17 S69 25, 78 12 S96 20, 108 4 V42 H2Z" fill={`url(#fill-${color})`} />
            <path d="M2 35 C14 24, 18 30, 27 20 S43 28, 53 17 S69 25, 78 12 S96 20, 108 4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default async function AdminDashboard() {
    const [statsData, recentPosts] = await Promise.all([
        PostModel.getStats(),
        PostModel.paginate(1, 5),
    ]);

    const quickActions = [
        { label: "New Post", description: "Create a news article", href: "/admin/posts/new", icon: Plus },
        { label: "All Posts", description: "Manage and edit your articles", href: "/admin/posts", icon: List },
        { label: "Categories", description: "Organize your content", href: "/admin/categories", icon: Tags },
        { label: "Media Gallery", description: "Upload and manage media", href: "/admin/gallery", icon: ImageIcon },
        { label: "Settings", description: "Configure your site", href: "/admin/settings", icon: Settings },
        { label: "View Site", description: "Open public website", href: "/", icon: ExternalLink, external: true },
    ];

    return (
        <div className="relative space-y-7">
            <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-2/3 rounded-full bg-blue-100/40 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Activity size={14} className="text-blue-500" />
                        <span>Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dashboard <span aria-hidden="true">👋</span></h1>
                    <p className="mt-1.5 text-sm text-slate-500">Welcome back to your news portal admin. Here&apos;s what&apos;s happening today.</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="hidden items-center gap-2 sm:flex"><CalendarDays size={16} />{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-blue-500/30">
                        <Plus size={18} /> New Post
                    </Link>
                </div>
            </div>

            <AdminStatsCards initialStats={statsData} />

            <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-5">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Zap size={18} /></div>
                        <div><h2 className="font-bold text-slate-900">Quick Actions</h2><p className="text-xs text-slate-500">Common tasks to manage your news portal</p></div>
                    </div>
                    <div className="space-y-2">
                        {quickActions.map((action) => (
                            <Link key={action.label} href={action.href} target={action.external ? "_blank" : undefined} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50/70">
                                <div className="rounded-lg bg-white p-2 text-slate-500 shadow-sm transition group-hover:text-blue-600"><action.icon size={17} /></div>
                                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{action.label}</p><p className="truncate text-[11px] text-slate-500">{action.description}</p></div>
                                <ArrowRight size={15} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-3">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileText size={18} /></div><div><h2 className="font-bold text-slate-900">Recent Posts</h2><p className="text-xs text-slate-500">Your latest published articles</p></div></div>
                        <Link href="/admin/posts" className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">View All <ArrowRight size={13} /></Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentPosts.posts.length === 0 ? (
                            <div className="p-10 text-center text-sm text-slate-500"><FolderOpen className="mx-auto mb-2 text-slate-300" />No posts yet.</div>
                        ) : recentPosts.posts.map((post, index) => (
                            <Link key={post._id.toString()} href={`/admin/posts/${post._id}/edit`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-blue-50/40">
                                <div className="hidden h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:block">
                                    {post.imageUrl ? <img src={post.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><FileText size={18} /></div>}
                                </div>
                                <span className="hidden text-xs font-semibold text-slate-300 sm:block">#{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-600">{post.title}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><span>{post.category || "Uncategorized"}</span><span>·</span><Clock3 size={11} /><span>{relativeTime(post.createdAt)}</span></div>
                                </div>
                                <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${post.published ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{post.published ? "Published" : "Draft"}</span>
                                <span className="text-slate-400">⋮</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
