"use client";

import AdDisplay from "./AdDisplay";

interface SidebarAdProps {
    position: "sidebar-top" | "sidebar-bottom";
}

export default function SidebarAd({ position }: SidebarAdProps) {
    return (
        <div className="mb-4">
            <AdDisplay
                position={position}
                className="rounded-lg overflow-hidden shadow-sm"
            />
        </div>
    );
}
