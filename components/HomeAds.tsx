"use client";

import { HeaderBanner, SidebarAd, FooterBanner, PopupAd, BetweenPostsAd, SidebarAdSlider, AdBanner } from "./AdComponents";

// Wrapper components for use in server components
export function HomePageAds() {
    return (
        <>
            <PopupAd />
        </>
    );
}

export function HeaderAdSection() {
    return <HeaderBanner />;
}

export function SidebarTopAd() {
    return <SidebarAdSlider />;
}

export function SidebarBottomAd() {
    return <SidebarAd position="sidebar-bottom" />;
}

export function FooterAdSection() {
    return <FooterBanner />;
}

export function BetweenPostsAdSection() {
    return <BetweenPostsAd />;
}

export function BuilderAdSection({ position }: { position: string }) {
    // Cast to any to bypass strict literal check since builder position comes from DB
    // @ts-expect-error - bypassing strict literal check for builder position
    return <AdBanner position={position} />;
}
