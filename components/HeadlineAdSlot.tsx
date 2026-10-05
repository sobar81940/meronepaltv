"use client";

import { useEffect, useState } from "react";

interface Ad {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
}

// Module-level cache per position
const adCache: Record<string, Ad[]> = {};
const fetchPromises: Record<string, Promise<Ad[]> | undefined> = {};

function getAds(position: string): Promise<Ad[]> {
    if (adCache[position]) return Promise.resolve(adCache[position]);
    if (fetchPromises[position]) return fetchPromises[position];
    fetchPromises[position] = fetch(`/api/advertisements?position=${position}&active=true`)
        .then(r => r.json())
        .then(data => {
            adCache[position] = data.success ? data.data : [];
            return adCache[position];
        })
        .catch(() => {
            adCache[position] = [];
            return [];
        });
    return fetchPromises[position];
}

const SLOT_POSITIONS = ["headline-1", "headline-2", "headline-3"] as const;

export default function HeadlineAdSlot({ index }: { index: number }) {
    const [ad, setAd] = useState<Ad | null>(null);
    const position = SLOT_POSITIONS[index] ?? SLOT_POSITIONS[0];

    useEffect(() => {
        let cancelled = false;

        async function load() {
            // Try specific headline slot first, fallback to between-posts
            for (const pos of [position, "between-posts"]) {
                const ads = await getAds(pos);
                if (!cancelled && ads.length > 0) {
                    setAd(ads[0]);
                    return;
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, [position]);

    if (ad) {
        return (
            <div className="w-full my-4">
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

    return (
        <div className="w-full h-14 my-4 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <span className="text-gray-400 text-xs tracking-widest">Headline Ad {index + 1}</span>
        </div>
    );
}
