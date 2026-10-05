import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsModel from "@/models/Settings";
import NepaliCalendar from "@/components/NepaliCalendar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "नेपाली पात्रो - Nepali Calendar",
    description: "नेपाली पात्रो (बिक्रम सम्बत) - तिथि, पर्व, चाड, राशिफल र थप जानकारी",
    keywords: ["nepali patro", "nepali calendar", "bikram sambat", "नेपाली पात्रो", "तिथि", "पर्व"],
};

export default async function PatroPage() {
    const settings = await SettingsModel.get();

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <main className="container mx-auto px-4 py-6">
                {/* Calendar Component */}
                <NepaliCalendar />
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
