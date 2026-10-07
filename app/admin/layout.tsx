"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    LogOut,
    Menu,
    X,
    Tags,
    Settings,
    Image,
    ChevronLeft,
    ChevronDown,
    Home,
    User,
    Bell,
    Users,
    LucideIcon,
    Megaphone,
    Layers,
    Calendar,
    Star,
    Mail,
    Sun,
    Moon,
    Search,
    Plus,
    CalendarDays,
} from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image";

interface UserPermissions {
    canCreatePosts: boolean;
    canManageGallery: boolean;
    canManageCategories: boolean;
    canManageSettings: boolean;
    canManageUsers: boolean;
}

interface UserSession {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
    permissions?: UserPermissions;
}

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    permission?: keyof UserPermissions | "admin";
    subItems?: { href: string; label: string }[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const allNavGroups: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Content",
        items: [
            { href: "/admin/posts", label: "All Posts", icon: FileText },
            { href: "/admin/posts/new", label: "New Post", icon: PlusCircle, permission: "canCreatePosts" },
            { href: "/admin/categories", label: "Categories", icon: Tags, permission: "canManageCategories" },
            { href: "/admin/gallery", label: "Media Gallery", icon: Image, permission: "canManageGallery" },
            { href: "/admin/webstories", label: "Web Stories", icon: Layers, permission: "canManageGallery" },
            { href: "/admin/celebrities", label: "Celebrities", icon: Star, permission: "canCreatePosts" },
            { href: "/admin/events", label: "Events", icon: Calendar, permission: "canCreatePosts" },
        ],
    },
    {
        label: "System",
        items: [
            { href: "/admin/newsletter", label: "Newsletter", icon: Mail, permission: "admin" },
            { href: "/admin/advertisements", label: "Advertisements", icon: Megaphone, permission: "admin" },
            { href: "/admin/users", label: "Users", icon: Users, permission: "canManageUsers" },
            {
                href: "/admin/settings",
                label: "Settings",
                icon: Settings,
                permission: "canManageSettings",
                subItems: [
                    { href: "/admin/settings", label: "General & Info" },
                    { href: "/admin/settings/home-builder", label: "Home Page Builder" },
                    { href: "/admin/settings/live-broadcast", label: "Live Broadcast" },
                    { href: "/admin/settings/footer", label: "Footer" },
                    { href: "/admin/settings/theme", label: "Theme" },
                    { href: "/admin/settings/seo", label: "SEO & Google" },
                    { href: "/admin/settings/social", label: "Social Media" },
                    { href: "/admin/settings/navigation", label: "Navigation" },
                    { href: "/admin/settings/mega-menu", label: "Mega Menu" },
                    { href: "/admin/settings/trending", label: "Trending Topics" },
                    { href: "/admin/settings/pages", label: "Static Pages" },
                ]
            },
        ],
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        }>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </Suspense>
    );
}

function AdminLayoutInner({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const [siteName, setSiteName] = useState("News Portal");
    const [logoUrl, setLogoUrl] = useState("");
    const [logoText, setLogoText] = useState("NP");
    const [themeMode, setThemeMode] = useState<string>("light");

    const applyThemeMode = (mode: string) => {
        const root = document.documentElement;
        const isDark = mode === "dark";

        root.classList.toggle("dark", isDark);
        root.style.colorScheme = isDark ? "dark" : "light";
    };

    // Fetch user session and settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sessionRes, settingsRes] = await Promise.all([
                    fetch("/api/auth/session"),
                    fetch("/api/settings")
                ]);

                if (sessionRes.ok) {
                    const data = await sessionRes.json();
                    if (data.user) setUser(data.user);
                }

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data.success && data.data) {
                        const s = data.data;
                        if (s.siteName) setSiteName(s.siteName);
                        if (s.logoUrl) setLogoUrl(s.logoUrl);
                        if (s.logoText) setLogoText(s.logoText);
                        if (s.themeSettings?.theme) {
                            const savedTheme = s.themeSettings.theme;
                            const resolvedTheme = savedTheme === "system"
                                ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                                : savedTheme;

                            setThemeMode(resolvedTheme);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        applyThemeMode(themeMode);
    }, [themeMode]);

    const toggleTheme = async () => {
        const newMode = themeMode === "dark" ? "light" : "dark";
        setThemeMode(newMode);

        // Save to settings (fire and forget)
        try {
            const settingsRes = await fetch("/api/settings");
            const settingsData = await settingsRes.json();
            if (settingsData.success && settingsData.data) {
                const current = settingsData.data;
                await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...current,
                        themeSettings: {
                            ...current.themeSettings,
                            theme: newMode
                        }
                    }),
                });
            }
        } catch (error) {
            console.error("Failed to save theme preference:", error);
        }
    };

    // Filter navigation based on permissions
    const navGroups = useMemo(() => {
        if (!user) return [];

        const isAdmin = user.role === "admin";
        const permissions = user.permissions;

        return allNavGroups
            .map(group => ({
                ...group,
                items: group.items.filter(item => {
                    if (!item.permission) return true;
                    if (item.permission === "admin") return isAdmin;
                    if (isAdmin) return true;
                    return permissions?.[item.permission] ?? false;
                }),
            }))
            .filter(group => group.items.length > 0);
    }, [user]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setSidebarOpen(false), 0);
        return () => window.clearTimeout(timeoutId);
    }, [pathname]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    const toggleExpand = (href: string) => {
        if (collapsed) {
            setCollapsed(false);
        }
        setExpandedItems(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case "admin": return "Administrator";
            case "editor": return "Editor";
            case "demo": return "Demo User";
            default: return role;
        }
    };

    const isDark = themeMode === "dark";
    const currentShareType = searchParams.get("shareType");

    return (
        <div data-admin="true" className="min-h-screen bg-background text-foreground flex">
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white shadow-lg shadow-black/20"
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-out
                    ${collapsed ? "w-[72px]" : "w-64 md:w-72"}
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    lg:h-full bg-sidebar/90 backdrop-blur-xl border-r border-sidebar-border`}
            >
                {/* Header */}
                <div className={`flex items-center gap-3 p-4 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 overflow-hidden">
                        {logoUrl ? (
                            <NextImage
                                src={logoUrl}
                                alt={siteName}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-sm font-bold text-white">
                                {logoText?.slice(0, 2).toUpperCase() || "NP"}
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-base font-semibold text-sidebar-foreground truncate">{siteName}</h1>
                            <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle - Desktop only */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all shadow-lg z-50"
                >
                    <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
                </button>

                {/* Navigation */}
                <nav className="flex-1 min-h-0 p-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {!collapsed && (
                                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const [itemPath, itemQueryString] = item.href.split("?");
                                    const itemShareType = new URLSearchParams(itemQueryString || "").get("shareType");
                                    const hasQuery = Boolean(itemQueryString);
                                    const isActive = pathname === itemPath && (!hasQuery || currentShareType === itemShareType) ||
                                        (itemPath !== "/admin" && pathname.startsWith(itemPath + "/") || pathname === itemPath && !hasQuery);
                                    const isParentActive = item.subItems && pathname.startsWith(itemPath + "/");
                                    const isExpanded = expandedItems.includes(item.href);

                                    return (
                                        <div key={item.href}>
                                            <div
                                                onClick={() => item.subItems ? toggleExpand(item.href) : router.push(item.href)}
                                                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
                                                    ${collapsed ? "justify-center" : ""}
                                                    ${isActive || isParentActive
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                                    }`}
                                            >
                                                {(isActive || isParentActive) && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
                                                )}

                                                <item.icon
                                                    size={20}
                                                    className={`flex-shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80"
                                                        }`}
                                                />

                                                {!collapsed && (
                                                    <>
                                                        <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                                                        {item.subItems && (
                                                            <ChevronDown
                                                                size={16}
                                                                className={`text-sidebar-foreground/40 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                                            />
                                                        )}
                                                    </>
                                                )}

                                                {collapsed && (
                                                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-medium text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                                        {item.label}
                                                    </div>
                                                )}
                                            </div>

                                            {item.subItems && isExpanded && !collapsed && (
                                                <div className="mt-1 ml-4 pl-4 border-l border-sidebar-border/50 space-y-1">
                                                    {item.subItems.map((subItem) => {
                                                        const isSubActive = pathname === subItem.href;
                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isSubActive
                                                                    ? "text-blue-400 bg-sidebar-accent"
                                                                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                                                    }`}
                                                            >
                                                                {subItem.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="border-t border-sidebar-border">
                    {/* Quick Actions + Theme Toggle */}
                    <div className={`p-3 flex ${collapsed ? "flex-col items-center gap-2" : "items-center justify-between"}`}>
                        <Link
                            href="/"
                            target="_blank"
                            className={`flex items-center gap-3 px-3 py-2.5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all ${collapsed ? "justify-center w-full" : ""}`}
                            title="View Site"
                        >
                            <Home size={18} className="flex-shrink-0" />
                            {!collapsed && <span className="text-sm">View Site</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-medium text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                    View Site
                                </div>
                            )}
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className={`group relative p-2.5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all ${collapsed ? "" : ""}`}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-medium text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                    {isDark ? "Light Mode" : "Dark Mode"}
                                </div>
                            )}
                        </button>
                    </div>

                    {/* User Section */}
                    <div className={`p-3 pt-0 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
                        {!collapsed && (
                            <Link
                                href="/admin/profile"
                                className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl hover:bg-sidebar-accent/50 transition-all group"
                            >
                                <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${!user?.profileImage ? (
                                    user?.role === "admin"
                                        ? "bg-gradient-to-br from-emerald-400 to-cyan-500"
                                        : user?.role === "demo"
                                            ? "bg-gradient-to-br from-orange-400 to-amber-500"
                                            : "bg-gradient-to-br from-blue-400 to-indigo-500"
                                ) : "bg-sidebar-accent"
                                    }`}>
                                    {user?.profileImage ? (
                                        <NextImage
                                            src={user.profileImage}
                                            alt={user.name}
                                            width={36}
                                            height={36}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={16} className="text-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-blue-400 transition-colors">
                                        {user?.name || "Loading..."}
                                    </p>
                                    <p className="text-xs text-sidebar-foreground/50 truncate">
                                        {user ? getRoleDisplay(user.role) : ""}
                                    </p>
                                </div>
                            </Link>
                        )}
                        {collapsed && (
                            <Link
                                href="/admin/profile"
                                className="group relative rounded-xl transition-all"
                                title="Profile"
                            >
                                <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center ${!user?.profileImage ? (
                                    user?.role === "admin"
                                        ? "bg-gradient-to-br from-emerald-400 to-cyan-500"
                                        : user?.role === "demo"
                                            ? "bg-gradient-to-br from-orange-400 to-amber-500"
                                            : "bg-gradient-to-br from-blue-400 to-indigo-500"
                                ) : "bg-sidebar-accent"
                                    }`}>
                                    {user?.profileImage ? (
                                        <NextImage
                                            src={user.profileImage}
                                            alt={user.name || "Profile"}
                                            width={36}
                                            height={36}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={16} className="text-white" />
                                    )}
                                </div>
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-medium text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                    Profile
                                </div>
                            </Link>
                        )}

                        <button
                            onClick={handleLogout}
                            className={`group flex items-center gap-3 w-full px-3 py-2.5 text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all relative
                                ${collapsed ? "justify-center" : ""}`}
                        >
                            <LogOut size={18} className="flex-shrink-0 group-hover:text-red-400 transition-colors" />
                            {!collapsed && <span className="text-sm">Logout</span>}

                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-sidebar border border-sidebar-border rounded-lg text-xs font-medium text-sidebar-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                    Logout
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-4 border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur-xl lg:px-8">
                    <div className="lg:hidden w-10" />

                    <div className="hidden min-w-0 flex-1 items-center gap-5 md:flex">
                        <div className="relative w-full max-w-md">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search posts, categories, media..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                        <span className="hidden items-center gap-2 whitespace-nowrap text-xs text-slate-500 xl:flex">
                            <CalendarDays size={15} className="text-blue-500" />
                            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </span>
                    </div>

                    <h2 className="flex-1 text-base font-semibold text-slate-800 md:hidden">
                        {pathname === "/admin" ? "Dashboard" : (() => {
                            const pageLabels: Record<string, string> = {
                                posts: "All Posts", "posts/new": "New Post",
                                categories: "Categories", gallery: "Media Gallery",
                                webstories: "Web Stories", celebrities: "Celebrities",
                                events: "Events", newsletter: "Newsletter",
                                advertisements: "Advertisements", users: "Users",
                                profile: "Profile",
                                settings: "General Settings", "settings/home-builder": "Home Page Builder",
                                "settings/live-broadcast": "Live Broadcast", "settings/footer": "Footer Settings",
                                "settings/theme": "Theme Settings", "settings/seo": "SEO & Google",
                                "settings/social": "Social Media", "settings/navigation": "Navigation",
                                "settings/mega-menu": "Mega Menu", "settings/trending": "Trending Topics",
                                "settings/pages": "Static Pages",
                            };
                            const key = pathname.replace(/^\/admin\//, "");
                            return pageLabels[key] || pathname.split("/").pop()?.replace(/-/g, " ") || "";
                        })()}
                    </h2>

                    <div className="flex items-center gap-2.5">
                        {pathname === "/admin" && (
                            <Link href="/admin/posts/new" className="hidden items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 sm:flex">
                                <Plus size={16} /> New Post
                            </Link>
                        )}
                        {/* Theme toggle in top bar (visible on mobile where sidebar toggle is hidden) */}
                        <button
                            onClick={toggleTheme}
                            className="lg:hidden p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all"
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600" aria-label="Notifications">
                            <Bell size={19} />
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>
                        <Link href="/admin/profile" className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                                {user?.profileImage ? <NextImage src={user.profileImage} alt={user.name || "Admin"} width={36} height={36} className="h-full w-full object-cover" /> : (user?.name?.slice(0, 1).toUpperCase() || "A")}
                            </div>
                            <div className="hidden min-w-0 lg:block">
                                <p className="max-w-24 truncate text-xs font-semibold text-slate-800">{user?.name || "Admin"}</p>
                                <p className="text-[10px] text-slate-400">{user ? getRoleDisplay(user.role) : "Administrator"}</p>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </Link>
                    </div>
                </header>

                <div className="p-6 lg:p-8">{children}</div>
            </main>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
