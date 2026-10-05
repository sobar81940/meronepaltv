import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import ShareMarketDashboard from "@/components/ShareMarketDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "शेयर मार्केट - NEPSE Live",
    description: "नेप्से सूचकाङ्क, शेयर मूल्य, उच्च बृद्धि, उच्च गिरावट र कारोबार अपडेट",
    keywords: ["nepse", "share market", "nepal stock exchange", "शेयर मार्केट", "नेप्से", "शेयर बजार"],
};

export default async function ShareMarketPage() {
    const settings = await SettingsModel.get();

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <main className="container mx-auto px-4 py-6">
                <ShareMarketDashboard />
            </main>

            <Footer
                settings={settings.footerSettings}
                siteName={settings.siteName}
                logoUrl={settings.logoUrl}
                logoText={settings.logoText}
            />
        </div>
    );
}
