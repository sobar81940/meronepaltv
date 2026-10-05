import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gadgets",
    robots: { index: false, follow: true },
};

export default async function GadgetsPage() {
    const settings = await SettingsModel.get();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Gadgets</h1>
                <p className="text-gray-600">यो पृष्ठ निर्माणाधीन छ।</p>
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
