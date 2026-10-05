"use client";

import { useEffect, useState } from "react";

type AdPosition =
    | "header-banner"
    | "sidebar-top"
    | "sidebar-bottom"
    | "in-article"
    | "footer-banner"
    | "popup"
    | "between-posts"
    | "home1"
    | "home2"
    | "home3"
    | "home4"
    | "home5"
    | "home6"
    | "home7"
    | "home8"
    | "home9"
    | "top-leaderboard";

interface Advertisement {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: AdPosition;
    isActive: boolean;
    priority: number;
}

interface AdDisplayProps {
    position: AdPosition;
    className?: string;
    maxAds?: number;
    adIndex?: number; // Specific ad index to show (0-based)
}

export default function AdDisplay({ position, className = "", maxAds = 1, adIndex }: AdDisplayProps) {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [loading, setLoading] = useState(true);
    const [impressionRecorded, setImpressionRecorded] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const res = await fetch(`/api/advertisements?position=${position}&active=true`);
                const data = await res.json();
                if (data.success) {
                    // Sort by priority (higher first) - fetch more if we need specific index
                    const sortedAds = data.data
                        .sort((a: Advertisement, b: Advertisement) => b.priority - a.priority);

                    // If adIndex is specified, we need to get that specific ad
                    // Otherwise, limit to maxAds
                    if (adIndex !== undefined) {
                        // Keep all ads so we can select by index
                        setAds(sortedAds);
                    } else {
                        setAds(sortedAds.slice(0, maxAds));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch ads:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, [position, adIndex, maxAds]);

    // Record impression when ad is visible
    useEffect(() => {
        ads.forEach((ad) => {
            if (!impressionRecorded.has(ad._id)) {
                recordImpression(ad._id);
                setImpressionRecorded((prev) => new Set(prev).add(ad._id));
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ads]);

    const recordImpression = async (adId: string) => {
        try {
            await fetch(`/api/advertisements/${adId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "impression" }),
            });
        } catch (error) {
            console.error("Failed to record impression:", error);
        }
    };

    const handleClick = async (adId: string) => {
        try {
            await fetch(`/api/advertisements/${adId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "click" }),
            });
        } catch (error) {
            console.error("Failed to record click:", error);
        }
    };

    if (loading || ads.length === 0) {
        return null;
    }

    // If a specific ad index is requested, filter to just that ad
    const displayAds = adIndex !== undefined
        ? (ads[adIndex] ? [ads[adIndex]] : [])
        : ads;

    if (displayAds.length === 0) {
        return null;
    }

    // Different styles based on position
    const getPositionStyles = () => {
        switch (position) {
            case "header-banner":
            case "top-leaderboard":
                return "w-full bg-gradient-to-r from-gray-100 to-gray-200 py-0";
            case "sidebar-top":
            case "sidebar-bottom":
                return "w-full bg-gray-50 rounded-lg overflow-hidden shadow";
            case "in-article":
                return "w-full my-6";
            case "footer-banner":
                return "w-full bg-gray-800 py-3";
            case "between-posts":
                return "w-full my-4 bg-gray-50 rounded-lg overflow-hidden";
            case "popup":
                return "fixed inset-0 z-50 flex items-center justify-center bg-black/50";
            case "home1":
            case "home2":
            case "home3":
            case "home4":
            case "home5":
            case "home6":
            case "home7":
            case "home8":
            case "home9":
                return "w-full bg-gray-50 rounded-lg overflow-hidden my-4";
            default:
                return "";
        }
    };

    // In-article ads - OnlineKhabar style: each ad as a simple sponsored block
    if (position === "in-article" && displayAds.length >= 1) {
        return (
            <div className={`ad-display space-y-6 ${className}`}>
                {displayAds.map((ad) => (
                    <div key={ad._id} className="in-article-ad-block">
                        {/* Sponsored Label */}
                        {/* <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-500">
                            <span className="h-px w-8 bg-gray-300"></span>
                            <span className="uppercase tracking-wider">Sponsored</span>
                            <span className="h-px w-8 bg-gray-300"></span>
                        </div> */}

                        <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            onClick={() => handleClick(ad._id)}
                            className="block"
                        >
                            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto" loading="lazy" />
                            </div>
                        </a>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`ad-display ${getPositionStyles()} ${className}`}>
            {displayAds.map((ad) => (
                <a
                    key={ad._id}
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => handleClick(ad._id)}
                    className="block relative group"
                >
                    {/* Ad Image */}
                    <div className="relative overflow-hidden will-change-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>


                </a>
            ))}
        </div>
    );
}
