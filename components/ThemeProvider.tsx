"use client";

import { useEffect } from "react";
import { ThemeSettings } from "@/models/Settings";

interface ThemeProviderProps {
    themeSettings?: ThemeSettings;
    children: React.ReactNode;
}

export default function ThemeProvider({ themeSettings, children }: ThemeProviderProps) {
    useEffect(() => {
        const root = document.documentElement;
        const themeMode = themeSettings?.theme ?? "light";

        const isDark = themeMode === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : themeMode === "dark";

        // Helper to convert hex to oklch (optional, or just set hex)
        // Tailwind v4 uses oklch by default in variables, but accepts hex in vars if we just set the property.
        // However, looking at globals.css, 'primary' maps to 'var(--primary)'.
        // If we set --primary to a hex value, it should work fine for background-color, 
        // but simple hex might not work with opacity modifiers if Tailwind expects oklch components.
        // For simplicity in this iteration, we will set the variables directly.
        // If Tailwind v4 alpha composition is needed, distinct conversions might be required.
        // But standard CSS variables work fine with hex for most cases.

        if (themeSettings?.primaryColor) {
            root.style.setProperty("--primary", themeSettings.primaryColor);
        }

        if (themeSettings?.secondaryColor) {
            root.style.setProperty("--secondary", themeSettings.secondaryColor);
        }

        if (themeSettings?.accentColor) {
            root.style.setProperty("--accent", themeSettings.accentColor);
        }

        // Handle Theme Mode
        root.classList.toggle("dark", isDark);
        root.style.colorScheme = isDark ? "dark" : "light";

    }, [themeSettings]);

    return <>{children}</>;
}
