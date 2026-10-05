"use client";

import { useState } from "react";
import { Copy, Download, RefreshCw, Trash2, ArrowLeftRight, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { unicodeToPreeti, preetiToUnicode } from "@/lib/unicodeToPreeti";

export default function NepaliTypingPage() {
    const [unicodeText, setUnicodeText] = useState("");
    const [preetiText, setPreetiText] = useState("");
    const [activePanel, setActivePanel] = useState<"unicode" | "preeti">("unicode");

    // Sample text for testing
    const sampleText = "नमस्ते! यो नेपाली टाइपिङ उपकरण हो।";

    // Handle Unicode input change
    const handleUnicodeChange = (text: string) => {
        setUnicodeText(text);
        setPreetiText(unicodeToPreeti(text));
    };

    // Handle Preeti input change
    const handlePreetiChange = (text: string) => {
        setPreetiText(text);
        setUnicodeText(preetiToUnicode(text));
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert(`${type} text copied to clipboard!`);
        } catch (err) {
            alert("Failed to copy text");
        }
    };

    // Download as text file
    const downloadText = (text: string, filename: string) => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Clear all text
    const clearAll = () => {
        setUnicodeText("");
        setPreetiText("");
    };

    // Swap panels
    const swapPanels = () => {
        setActivePanel(activePanel === "unicode" ? "preeti" : "unicode");
    };

    // Load sample text
    const loadSample = () => {
        handleUnicodeChange(sampleText);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main id="main-content" className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            नेपाली टाइपिङ उपकरण
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            युनिकोड र प्रीती फन्टबीच परिवर्तन गर्नुहोस्। नेपालीमा टाइप गर्नुहोस् र तुरुन्त Preeti फन्टमा परिणाम पाउनुहोस्।
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center mb-6">
                        <button
                            onClick={loadSample}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            aria-label="नमूना पाठ लोड गर्नुहोस्"
                        >
                            <FileText size={18} aria-hidden="true" />
                            नमूना पाठ
                        </button>
                        <button
                            onClick={swapPanels}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            aria-label="प्यानलहरू साट्नुहोस्"
                        >
                            <ArrowLeftRight size={18} aria-hidden="true" />
                            साट्नुहोस्
                        </button>
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            aria-label="सबै खाली गर्नुहोस्"
                        >
                            <Trash2 size={18} aria-hidden="true" />
                            खाली गर्नुहोस्
                        </button>
                    </div>

                    {/* Typing Interface */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Unicode Panel */}
                        <div className={`bg-white rounded-xl shadow-lg p-6 ${activePanel === "unicode" ? "ring-2 ring-[#e61e2b]" : ""}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">युनिकोड नेपाली</h2>
                                <span className="text-sm text-gray-500">{unicodeText.length} अक्षरहरू</span>
                            </div>

                            <textarea
                                value={unicodeText}
                                onChange={(e) => handleUnicodeChange(e.target.value)}
                                onFocus={() => setActivePanel("unicode")}
                                placeholder="यहाँ नेपालीमा टाइप गर्नुहोस्..."
                                className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:border-[#e61e2b] focus:outline-none resize-none text-lg"
                                style={{ fontFamily: "sans-serif" }}
                                aria-label="युनिकोड नेपाली इनपुट"
                            />

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => copyToClipboard(unicodeText, "Unicode")}
                                    disabled={!unicodeText}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#e61e2b] text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="युनिकोड पाठ प्रतिलिपि गर्नुहोस्"
                                >
                                    <Copy size={18} aria-hidden="true" />
                                    प्रतिलिपि
                                </button>
                                <button
                                    onClick={() => downloadText(unicodeText, "nepali-unicode.txt")}
                                    disabled={!unicodeText}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="युनिकोड पाठ डाउनलोड गर्नुहोस्"
                                >
                                    <Download size={18} aria-hidden="true" />
                                    डाउनलोड
                                </button>
                            </div>
                        </div>

                        {/* Preeti Panel */}
                        <div className={`bg-white rounded-xl shadow-lg p-6 ${activePanel === "preeti" ? "ring-2 ring-[#e61e2b]" : ""}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">प्रीती फन्ट</h2>
                                <span className="text-sm text-gray-500">{preetiText.length} अक्षरहरू</span>
                            </div>

                            <textarea
                                value={preetiText}
                                onChange={(e) => handlePreetiChange(e.target.value)}
                                onFocus={() => setActivePanel("preeti")}
                                placeholder="Preeti font output appears here..."
                                className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:border-[#e61e2b] focus:outline-none resize-none text-lg"
                                style={{ fontFamily: "Preeti, monospace" }}
                                aria-label="प्रीती फन्ट आउटपुट"
                            />

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => copyToClipboard(preetiText, "Preeti")}
                                    disabled={!preetiText}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#e61e2b] text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="प्रीती पाठ प्रतिलिपि गर्नुहोस्"
                                >
                                    <Copy size={18} aria-hidden="true" />
                                    प्रतिलिपि
                                </button>
                                <button
                                    onClick={() => downloadText(preetiText, "nepali-preeti.txt")}
                                    disabled={!preetiText}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="प्रीती पाठ डाउनलोड गर्नुहोस्"
                                >
                                    <Download size={18} aria-hidden="true" />
                                    डाउनलोड
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">कसरी प्रयोग गर्ने:</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-[#e61e2b] font-bold">•</span>
                                <span>बायाँ प्यानलमा नेपालीमा टाइप गर्नुहोस् (युनिकोड)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#e61e2b] font-bold">•</span>
                                <span>दायाँ प्यानलमा तुरुन्त Preeti फन्ट परिणाम देख्नुहोस्</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#e61e2b] font-bold">•</span>
                                <span>प्रतिलिपि वा डाउनलोड बटन प्रयोग गरेर पाठ सुरक्षित गर्नुहोस्</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#e61e2b] font-bold">•</span>
                                <span>नमूना बटन क्लिक गरेर उपकरण परीक्षण गर्नुहोस्</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>

            <Footer
                settings={{
                    layout: "minimal",
                    backgroundColor: "#1a1a1a",
                    textColor: "#ffffff",
                    accentColor: "#e61e2b",
                    showCopyright: true,
                    copyrightText: "© {year} {siteName}. All rights reserved.",
                    showSocial: false,
                    showNewsletter: false,
                    showAbout: false,
                    showContact: false,
                    socialLinks: [],
                    columns: [],
                    // Required properties with minimal defaults
                    aboutText: "",
                    contactEmail: "",
                    contactPhone: "",
                    contactAddress: "",
                    newsletterTitle: "",
                    newsletterDescription: "",
                    showAppDownload: false,
                    appStoreUrl: "",
                    playStoreUrl: "",
                }}
                siteName="News Portal"
            />
        </div>
    );
}
