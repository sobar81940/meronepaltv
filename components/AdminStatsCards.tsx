"use client";

import { useEffect, useState } from "react";
import {
    CalendarDays,
    CalendarRange,
    Eye,
    EyeOff,
    FileText,
    Share2,
    TrendingUp,
    Users,
} from "lucide-react";

interface Stats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    thisMonthPosts: number;
    thisYearPosts: number;
    totalVisitors: number;
    totalViews: number;
    totalShares: number;
}

interface AdminStatsCardsProps {
    initialStats: Stats;
}

const statConfig = [
    { label: "Total Posts", key: "totalPosts", icon: FileText, badge: "Core", trend: "+12%", color: "#2476f3", iconBg: "bg-blue-100 text-blue-600" },
    { label: "Published", key: "publishedPosts", icon: Eye, badge: "Core", trend: "+8%", color: "#16c784", iconBg: "bg-emerald-100 text-emerald-600" },
    { label: "Drafts", key: "draftPosts", icon: EyeOff, badge: "Core", trend: "0%", color: "#f6a800", iconBg: "bg-amber-100 text-amber-600" },
    { label: "This Month", key: "thisMonthPosts", icon: CalendarDays, badge: "Period", trend: "0%", color: "#9b6cff", iconBg: "bg-violet-100 text-violet-600" },
    { label: "This Year", key: "thisYearPosts", icon: CalendarRange, badge: "Period", trend: "+18%", color: "#f03b9d", iconBg: "bg-pink-100 text-pink-600" },
    { label: "Visitors", key: "totalVisitors", icon: Users, badge: "Engagement", trend: "+27%", color: "#18b9e8", iconBg: "bg-cyan-100 text-cyan-600" },
    { label: "Views", key: "totalViews", icon: TrendingUp, badge: "Engagement", trend: "+14%", color: "#25c981", iconBg: "bg-green-100 text-green-600" },
    { label: "Shares", key: "totalShares", icon: Share2, badge: "Engagement", trend: "+21%", color: "#ef5571", iconBg: "bg-rose-100 text-rose-600" },
] as const;

function Sparkline({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 110 42" className="h-12 w-28 overflow-visible" aria-hidden="true">
            <path d="M2 35 C14 24, 18 30, 27 20 S43 28, 53 17 S69 25, 78 12 S96 20, 108 4 V42 H2Z" fill={color} fillOpacity=".12" />
            <path d="M2 35 C14 24, 18 30, 27 20 S43 28, 53 17 S69 25, 78 12 S96 20, 108 4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function AdminStatsCards({ initialStats }: AdminStatsCardsProps) {
    const [stats, setStats] = useState(initialStats);

    useEffect(() => {
        let active = true;
        const refresh = async () => {
            try {
                const response = await fetch("/api/stats", { cache: "no-store" });
                if (!response.ok) return;
                const payload = await response.json();
                if (active && payload.success && payload.data) setStats(payload.data);
            } catch {
                // Keep the last successful values visible if a refresh fails.
            }
        };

        const timer = window.setInterval(refresh, 10000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, []);

    return (
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statConfig.map((stat) => (
                <div key={stat.label} className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-100/60">
                    <div className="flex items-start justify-between">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}><stat.icon size={21} /></div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{stat.badge}</span>
                            <span className="text-slate-400">⋮</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                            <p className="text-2xl font-bold tabular-nums text-slate-950">{stats[stat.key].toLocaleString()}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                            <p className="mt-2 text-[11px] font-semibold text-emerald-500">↗ {stat.trend} <span className="font-normal text-slate-400">from last period</span></p>
                        </div>
                        <Sparkline color={stat.color} />
                    </div>
                </div>
            ))}
        </div>
    );
}
