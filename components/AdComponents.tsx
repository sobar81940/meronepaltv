"use client";

import { useEffect, useState, useCallback } from "react";

interface Advertisement {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: string;
    isActive: boolean;
}

// Ad size configurations matching OnlineKhabar
const AD_SIZES = {
    "header-banner": { width: 1230, height: 100 },      // Top leaderboard like OnlineKhabar
    "footer-banner": { width: 1230, height: 100 },      // Bottom leaderboard
    "sidebar-top": { width: 300, height: 250 },         // Medium rectangle
    "sidebar-bottom": { width: 300, height: 600 },      // Half page
    "in-article": { width: 728, height: 90 },           // Leaderboard
    "between-posts": { width: 728, height: 90 },        // Leaderboard
    "popup": { width: 600, height: 400 },               // Interstitial
    "home1": { width: 1230, height: 100 },
    "home2": { width: 1230, height: 100 },
    "home3": { width: 1230, height: 100 },
    "home4": { width: 1230, height: 100 },
    "home5": { width: 1230, height: 100 },
    "home6": { width: 1230, height: 100 },
    "home7": { width: 1230, height: 100 },
    "home8": { width: 1230, height: 100 },
    "home9": { width: 1230, height: 100 },
    "top-leaderboard": { width: 728, height: 90 }, // Next to logo size
};

interface AdBannerProps {
    position: keyof typeof AD_SIZES;
    className?: string;
}

// Single Ad Banner Component
export function AdBanner({ position, className = "" }: AdBannerProps) {
    const [ad, setAd] = useState<Advertisement | null>(null);

    const fetchAd = useCallback(async () => {
        try {
            const res = await fetch(`/api/advertisements?position=${position}&active=true`);
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                setAd(data.data[0]);
                // Record impression
                fetch(`/api/advertisements/${data.data[0]._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "impression" }),
                });
            }
        } catch (error) {
            console.error("Failed to fetch ad:", error);
        }
    }, [position]);

    useEffect(() => {
        const timer = setTimeout(() => fetchAd(), 0);
        return () => clearTimeout(timer);
    }, [fetchAd]);

    const handleClick = () => {
        if (ad) {
            // Record click
            fetch(`/api/advertisements/${ad._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "click" }),
            });
        }
    };

    if (!ad) return null;

    return (
        <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            className={`block ${className}`}
            aria-label={`${ad.title} - विज्ञापन`}
        >
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto" loading="lazy" />

            </div>
        </a>
    );
}

// Header Banner - Full width at top (1230x100 like OnlineKhabar)
export function HeaderBanner() {
    return (
        <div className="w-full mb-4">
            <AdBanner position="header-banner" className="max-w-[1230px] mx-auto" />
        </div>
    );
}

// Sidebar Ad Component
export function SidebarAd({ position }: { position: "sidebar-top" | "sidebar-bottom" }) {
    return (
        <div className="mb-4">
            <AdBanner position={position} />
        </div>
    );
}

// Between Posts Ad
export function BetweenPostsAd() {
    return (
        <div className="my-6">
            <AdBanner position="between-posts" />
        </div>
    );
}

// Footer Banner (1230x100 like OnlineKhabar)
export function FooterBanner() {
    return (
        <div className="w-full mt-8 mb-4">
            <AdBanner position="footer-banner" className="max-w-[1230px] mx-auto" />
        </div>
    );
}

// In-Article Ad (for article pages)
export function InArticleAd() {
    return (
        <div className="my-6 px-4 py-3 bg-gray-50 rounded-lg">
            <AdBanner position="in-article" />
        </div>
    );
}

// Popup Ad Component
export function PopupAd() {
    const [ad, setAd] = useState<Advertisement | null>(null);
    const [show, setShow] = useState(false);

    const fetchAd = useCallback(async () => {
        try {
            // Check if popup was shown recently
            const lastShown = localStorage.getItem("popup_ad_shown");
            if (lastShown) {
                const lastTime = parseInt(lastShown);
                const now = Date.now();
                // Don't show if shown in last 1 hour
                if (now - lastTime < 3600000) return;
            }

            const res = await fetch("/api/advertisements?position=popup&active=true");
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                setAd(data.data[0]);
                // Show after 3 seconds
                setTimeout(() => setShow(true), 3000);
                // Record impression
                fetch(`/api/advertisements/${data.data[0]._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "impression" }),
                });
                // Mark as shown
                localStorage.setItem("popup_ad_shown", Date.now().toString());
            }
        } catch (error) {
            console.error("Failed to fetch popup ad:", error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchAd(), 0);
        return () => clearTimeout(timer);
    }, [fetchAd]);

    const handleClick = () => {
        if (ad) {
            fetch(`/api/advertisements/${ad._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "click" }),
            });
        }
    };

    if (!ad || !show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="विज्ञापन">
            <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-90 duration-300">
                <button
                    onClick={() => setShow(false)}
                    aria-label="विज्ञापन बन्द गर्नुहोस्"
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10"
                >
                    <span aria-hidden="true">✕</span>
                </button>
                <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={handleClick}
                    aria-label={`${ad.title} - विज्ञापन हेर्नुहोस्`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto" loading="lazy" />
                </a>

            </div>
        </div>
    );
}

// Multiple Ads Carousel/Slider for sidebar
export function SidebarAdSlider() {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchAds = useCallback(async () => {
        try {
            const res = await fetch("/api/advertisements?position=sidebar-top&active=true");
            const data = await res.json();
            if (data.success) {
                setAds(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch ads:", error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchAds(), 0);
        return () => clearTimeout(timer);
    }, [fetchAds]);

    useEffect(() => {
        if (ads.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % ads.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [ads.length]);

    if (ads.length === 0) return null;

    const currentAd = ads[currentIndex];

    return (
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
            <a
                href={currentAd.linkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={`${currentAd.title} - विज्ञापन`}
                onClick={() => {
                    fetch(`/api/advertisements/${currentAd._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "click" }),
                    });
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentAd.imageUrl} alt={currentAd.title} className="w-full h-auto transition-opacity duration-500" loading="lazy" />
            </a>

            {/* Dots indicator */}
            {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" role="tablist" aria-label="विज्ञापन स्लाइडर">
                    {ads.map((ad, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            role="tab"
                            aria-selected={index === currentIndex}
                            aria-label={`विज्ञापन ${index + 1}`}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
