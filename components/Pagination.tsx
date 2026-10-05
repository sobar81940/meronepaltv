"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
    currentPage,
    totalPages,
}: {
    currentPage: number;
    totalPages: number;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div className="flex items-center justify-center space-x-2 my-8">
            <Link
                href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
                className={`p-2 rounded-lg flex items-center justify-center ${currentPage <= 1
                    ? "text-gray-400 cursor-not-allowed pointer-events-none"
                    : "text-gray-700 hover:bg-gray-100 hover:text-primary transition"
                    }`}
                aria-disabled={currentPage <= 1}
            >
                <ChevronLeft size={20} />
            </Link>

            {startPage > 1 && (
                <>
                    <Link
                        href={createPageURL(1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        1
                    </Link>
                    {startPage > 2 && <span className="text-gray-500">...</span>}
                </>
            )}

            {pages.map((page) => (
                <Link
                    key={page}
                    href={createPageURL(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                        }`}
                >
                    {page}
                </Link>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
                    <Link
                        href={createPageURL(totalPages)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        {totalPages}
                    </Link>
                </>
            )}

            <Link
                href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
                className={`p-2 rounded-lg flex items-center justify-center ${currentPage >= totalPages
                    ? "text-gray-400 cursor-not-allowed pointer-events-none"
                    : "text-gray-700 hover:bg-gray-100 hover:text-primary transition"
                    }`}
                aria-disabled={currentPage >= totalPages}
            >
                <ChevronRight size={20} />
            </Link>
        </div>
    );
}
