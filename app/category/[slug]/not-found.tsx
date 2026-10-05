import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-12">
                {/* 404 Error Section */}
                <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-6 bg-red-100 rounded-full">
                            <AlertCircle className="w-16 h-16 text-red-600" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - पृष्ठ नभेटिएको</h1>
                    
                    <p className="text-lg text-gray-600 mb-8">
                        खेद गर्दछौं, यो श्रेणी पृष्ठ उपलब्ध छैन। यो सम्भवतः हाल हटाइएको वा URL परिवर्तन गरिएको हुन सक्छ।
                    </p>

                    {/* Admin Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                        <h2 className="text-lg font-semibold text-blue-900 mb-3">📝 व्यवस्थापकहरूको लागि</h2>
                        <p className="text-sm text-blue-800 mb-4">
                            यदि तपाई एक श्रेणी खोज रहेका हुनुहुन्छ, कृपया निम्नलिखित गरी गर्नुहोस्:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>
                                <strong>Admin Dashboard</strong> मा जानुहोस् (Administrators only)
                            </li>
                            <li>
                                <strong>Settings → Categories</strong> खोज्नुहोस्
                            </li>
                            <li>
                                आफ्नो श्रेणीको URL slug सेट गर्नुहोस् वा नयाँ श्रेणी बनाउनुहोस्
                            </li>
                            <li>
                                सही URL format: <code className="bg-blue-100 px-2 py-1 rounded text-xs">/category/[category-slug]</code>
                            </li>
                        </ol>
                        <p className="text-xs text-blue-700 mt-4 pt-4 border-t border-blue-200">
                            उदाहरण: विजनेस श्रेणीको URL: <code className="bg-blue-100 px-2 py-1 rounded">/category/bijness</code>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                        >
                            <Home className="w-4 h-4" />
                            होमपेज जानुहोस्
                        </Link>
                        <Link
                            href="/admin/settings"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                            श्रेणी व्यवस्थापन
                        </Link>
                    </div>
                </div>
            </main>

            <FooterWrapper />
        </div>
    );
}
