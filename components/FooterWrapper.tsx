import SettingsModel from "@/models/Settings";
import Footer from "./Footer";

export default async function FooterWrapper() {
    const settings = await SettingsModel.get();

    return (
        <Footer
            settings={settings.footerSettings}
            siteName={settings.siteName}
            logoUrl={settings.logoUrl}
            logoText={settings.logoText}
        />
    );
}
