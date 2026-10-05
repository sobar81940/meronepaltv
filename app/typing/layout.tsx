import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "नेपाली टाइपिङ उपकरण",
    description: "नेपाली युनिकोड र प्रीति फन्टमा टाइप गर्ने उपकरण - Unicode to Preeti र Preeti to Unicode कन्भर्टर।",
    robots: { index: false, follow: true },
};

export default function TypingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}