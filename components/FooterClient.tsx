"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";
import { SiteSettings } from "@/models/Settings";

export default function FooterClient() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);

        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setSettings(data.data);
                }
            })
            .catch(console.error);

        return () => clearTimeout(timer);
    }, []);

    // Show consistent loading state for SSR
    if (!mounted) {
        return (
            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="h-4 w-48 bg-gray-700 rounded mx-auto animate-pulse" />
                </div>
            </footer>
        );
    }

    // Show loading state while fetching settings
    if (!settings || !settings.footerSettings) {
        return (
            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="h-4 w-48 bg-gray-700 rounded mx-auto animate-pulse" />
                </div>
            </footer>
        );
    }

    return (
        <Footer
            settings={settings.footerSettings}
            siteName={settings.siteName || ""}
            logoUrl={settings.logoUrl || ""}
            logoText={settings.logoText || ""}
        />
    );
}
