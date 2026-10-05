"use client";

import { useState } from "react";
import { Sparkles, Loader2, Image as ImageIcon, X } from "lucide-react";

interface AIFeaturedImageGeneratorProps {
    onGenerate: (url: string) => void;
    initialPrompt?: string;
}

export default function AIFeaturedImageGenerator({
    onGenerate,
    initialPrompt = "",
}: AIFeaturedImageGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [error, setError] = useState("");

    const openModal = () => {
        setPrompt(initialPrompt);
        setIsOpen(true);
    };

    const generateImage = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt for the image");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    type: "image",
                    provider: "openai", // Explicitly use OpenAI for image gen
                    model: "dall-e-3",
                }),
            });

            const data = await res.json();

            if (data.success) {
                onGenerate(data.data.content);
                setIsOpen(false);
            } else {
                setError(data.error || "Failed to generate image");
            }
        } catch (err) {
            setError("Failed to connect to AI service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
                <Sparkles size={16} />
                Generate with AI
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                                    <ImageIcon size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Generate Featured Image</h3>
                                    <p className="text-sm text-slate-400">Powered by DALL·E 3</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Image Prompt
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the image you want to generate..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Be specific about the style, mood, and content of the image.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-slate-300 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={generateImage}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Image
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
