"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Newspaper, Search, Clock, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
}

interface MobileBottomNavProps {
    mediaBaseUrl: string;
}

const getNavItems = (mediaBaseUrl: string): NavItem[] => [
    {
        name: "सेलिब्रिटी",
        href: "/wiki",
        icon: <Newspaper size={22} />,
    },
    {
        name: "सर्च",
        href: "/search",
        icon: <Search size={22} />,
    },
    {
        name: "शर्ट्स",
        href: "/shorts",
        icon: (
            <div className="w-12 h-12 -mt-6 bg-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white relative overflow-hidden z-10">
                <Image
                    src="https://pub-b769d2cb60264fbb834dbed29f4b1007.r2.dev/news-portal/favicon-512-1790909520455.png"
                    alt="Shorts"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                />
            </div>
        ),
    },
    {
        name: "ताजा अपडेट",
        href: "/newsStory",
        icon: <Clock size={22} />,
    },
    {
        name: "अरू",
        href: "#more",
        icon: <MoreHorizontal size={22} />,
    },
];

export default function MobileBottomNav({ mediaBaseUrl }: MobileBottomNavProps) {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);
    const navItems = getNavItems(mediaBaseUrl);

    // Hide bottom nav on News Story pages
    if (pathname?.startsWith('/newsStory')) {
        return null;
    }

    const handleMoreClick = () => {
        setShowMore(!showMore);
    };

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Menu Panel */}
            {showMore && (
                <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 z-50 rounded-t-2xl shadow-2xl animate-slide-up">
                    <div className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                            <Link
                                href="/patro"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                    📅
                                </div>
                                <span className="text-xs text-gray-700">पात्रो</span>
                            </Link>
                            <Link
                                href="/share-market"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    📊
                                </div>
                                <span className="text-xs text-gray-700">शेयर</span>
                            </Link>
                            <Link
                                href="/gallery"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                    🖼️
                                </div>
                                <span className="text-xs text-gray-700">ग्यालरी</span>
                            </Link>
                            <Link
                                href="/webstories"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    📱
                                </div>
                                <span className="text-xs text-gray-700">कथाहरू</span>
                            </Link>
                            <Link
                                href="/events"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    🎉
                                </div>
                                <span className="text-xs text-gray-700">कार्यक्रम</span>
                            </Link>
                            <Link
                                href="/celebrity"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                                    ⭐
                                </div>
                                <span className="text-xs text-gray-700">सेलिब्रिटी</span>
                            </Link>
                            <Link
                                href="/typing"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                    ⌨️
                                </div>
                                <span className="text-xs text-gray-700">टाइपिङ</span>
                            </Link>
                            <Link
                                href="/login"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition"
                                onClick={() => setShowMore(false)}
                            >
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    👤
                                </div>
                                <span className="text-xs text-gray-700">लगइन</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#005677] z-50 shadow-2xl safe-area-bottom">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        const isShorts = index === 2;
                        const isMore = item.href === "#more";

                        if (isMore) {
                            return (
                                <button
                                    key={item.name}
                                    onClick={handleMoreClick}
                                    className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-white/70 hover:text-white transition-colors"
                                >
                                    {item.icon}
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isShorts
                                    ? ""
                                    : isActive
                                        ? "text-white"
                                        : "text-white/70 hover:text-white"
                                    }`}
                            >
                                {item.icon}
                                {!isShorts && (
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="md:hidden h-16" />
        </>
    );
}
