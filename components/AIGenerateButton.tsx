"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, X, Wand2, FileText, Heading, Edit3, Languages } from "lucide-react";

interface AIGenerateButtonProps {
    onGenerate: (content: string) => void;
    currentContent?: string;
    currentTitle?: string;
}

type GenerationType = "article" | "headline" | "excerpt" | "improve" | "translate_to_nepali";

interface AIModel {
    id: string;
    name: string;
}

interface AIProvider {
    id: string;
    name: string;
    models: AIModel[];
    available: boolean;
}

export default function AIGenerateButton({
    onGenerate,
    currentContent,
    currentTitle,
}: AIGenerateButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState("");
    const [selectedType, setSelectedType] = useState<GenerationType>("article");
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState("google");
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");

    // Fetch available AI providers on mount
    useEffect(() => {
        fetch("/api/generate")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setProviders(data.data);
                    // Set default to first available provider
                    const available = data.data.find((p: AIProvider) => p.available);
                    if (available) {
                        setSelectedProvider(available.id);
                        if (available.models[0]) {
                            setSelectedModel(available.models[0].id);
                        }
                    }
                }
            })
            .catch(console.error);
    }, []);

    // Update model when provider changes
    const handleProviderChange = (providerId: string) => {
        setSelectedProvider(providerId);
        const provider = providers.find(p => p.id === providerId);
        if (provider && provider.models[0]) {
            setSelectedModel(provider.models[0].id);
        }
    };

    // Get current provider's models
    const currentProviderModels = providers.find(p => p.id === selectedProvider)?.models || [];

    // Auto-fill prompt with title when modal opens
    const openModal = () => {
        if (currentTitle) {
            setPrompt(currentTitle);
        }
        setIsOpen(true);
    };

    const generateContent = async () => {
        if (!prompt.trim() && selectedType !== "improve" && selectedType !== "excerpt") {
            setError("Please enter a topic or prompt");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let inputPrompt = prompt;

            // For improve mode, use current content
            if (selectedType === "improve" && currentContent) {
                inputPrompt = currentContent;
            }
            // For excerpt mode, use current content
            if (selectedType === "excerpt" && currentContent) {
                inputPrompt = currentContent;
            }

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: inputPrompt,
                    type: selectedType,
                    provider: selectedProvider,
                    model: selectedModel,
                }),
            });

            const data = await res.json();

            if (data.success) {
                onGenerate(data.data.content);
                setIsOpen(false);
                setPrompt("");
            } else {
                setError(data.error || "Failed to generate content");
            }
        } catch (err) {
            setError("Failed to connect to AI service");
        } finally {
            setLoading(false);
        }
    };

    const generationTypes: { type: GenerationType; label: string; icon: React.ReactNode; description: string }[] = [
        {
            type: "article",
            label: "नयाँ लेख",
            icon: <FileText size={18} />,
            description: "Generate a full news article from a topic",
        },
        {
            type: "headline",
            label: "शीर्षक",
            icon: <Heading size={18} />,
            description: "Generate headline suggestions",
        },
        {
            type: "excerpt",
            label: "सारांश",
            icon: <Edit3 size={18} />,
            description: "Generate excerpt from content",
        },
        {
            type: "improve",
            label: "सुधार",
            icon: <Wand2 size={18} />,
            description: "Improve existing content",
        },
        {
            type: "translate_to_nepali",
            label: "नेपालीमा अनुवाद",
            icon: <Languages size={18} />,
            description: "Translate text to Nepali",
        },
    ];

    return (
        <>
            {/* Quick Generate from Title Button */}
            {currentTitle && (
                <button
                    type="button"
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const res = await fetch("/api/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    prompt: currentTitle,
                                    type: "article",
                                }),
                            });
                            const data = await res.json();
                            if (data.success) {
                                onGenerate(data.data.content);
                            }
                        } catch (err) {
                            console.error(err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all text-sm disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Sparkles size={16} />
                    )}
                    Title देखि बनाउ
                </button>
            )}
            <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-purple-500/25"
            >
                <Sparkles size={18} />
                AI Generate
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">AI Content Generator</h3>
                                    <p className="text-sm text-slate-400">Powered by Gemini</p>
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
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Generation Type
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {generationTypes.map((gt) => (
                                        <button
                                            key={gt.type}
                                            type="button"
                                            onClick={() => setSelectedType(gt.type)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${selectedType === gt.type
                                                ? "bg-purple-600/20 border-purple-500 text-purple-300"
                                                : "border-slate-600 text-slate-300 hover:border-slate-500"
                                                }`}
                                        >
                                            {gt.icon}
                                            {gt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {generationTypes.find((gt) => gt.type === selectedType)?.description}
                                </p>
                            </div>

                            {/* AI Provider Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        AI Provider
                                    </label>
                                    <select
                                        value={selectedProvider}
                                        onChange={(e) => handleProviderChange(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    >
                                        {providers.filter(p => p.available).map((provider) => (
                                            <option key={provider.id} value={provider.id}>
                                                {provider.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Model
                                    </label>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    >
                                        {currentProviderModels.map((model: AIModel) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Prompt Input */}
                            {selectedType !== "improve" && selectedType !== "excerpt" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {selectedType === "article" ? "विषय / Topic" :
                                            selectedType === "translate_to_nepali" ? "Text to translate" : "Prompt"}
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={
                                            selectedType === "article"
                                                ? "e.g., नेपालको अर्थतन्त्र र आर्थिक विकास..."
                                                : selectedType === "headline"
                                                    ? "Enter topic for headline suggestions..."
                                                    : "Enter text to translate..."
                                        }
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                </div>
                            )}

                            {/* Info for improve/excerpt modes */}
                            {(selectedType === "improve" || selectedType === "excerpt") && (
                                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                                    <p className="text-sm text-slate-300">
                                        {selectedType === "improve"
                                            ? "This will improve your existing content. Make sure you have content in the editor."
                                            : "This will generate an excerpt from your existing content."}
                                    </p>
                                    {!currentContent && (
                                        <p className="text-sm text-yellow-400 mt-2">
                                            ⚠️ No content detected in the editor
                                        </p>
                                    )}
                                </div>
                            )}

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
                                onClick={generateContent}
                                disabled={loading || ((selectedType === "improve" || selectedType === "excerpt") && !currentContent)}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate
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
