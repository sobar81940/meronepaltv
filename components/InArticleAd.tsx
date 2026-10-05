"use client";

import { useEffect, useState } from "react";

interface Ad {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
}

// Module-level cache so all slots share one fetch
let cachedAds: Ad[] | null = null;
let fetchPromise: Promise<Ad[]> | null = null;

function getAds(): Promise<Ad[]> {
    if (cachedAds) return Promise.resolve(cachedAds);
    if (fetchPromise) return fetchPromise;
    fetchPromise = fetch(`/api/advertisements?position=in-article&active=true`)
        .then(r => r.json())
        .then(data => {
            cachedAds = data.success ? data.data : [];
            return cachedAds!;
        })
        .catch(() => {
            cachedAds = [];
            return [];
        });
    return fetchPromise;
}

export default function InArticleAd({ slotIndex = 0 }: { slotIndex?: number }) {
    const [ad, setAd] = useState<Ad | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAds().then(ads => {
            if (!cancelled && ads.length > 0) {
                setAd(ads[slotIndex % ads.length]);
            }
        });
        return () => { cancelled = true; };
    }, [slotIndex]);

    if (!ad) return null;

    return (
        <div className="w-full my-6">
            <a
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block w-full"
                onClick={() =>
                    fetch(`/api/advertisements/${ad._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "click" }),
                    }).catch(() => {})
                }
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-auto rounded-lg border border-gray-200"
                    loading="lazy"
                />
            </a>
        </div>
    );
}
