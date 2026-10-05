"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface NewsletterFormProps {
    title?: string;
    description?: string;
    accentColor?: string;
    textColor?: string;
    source?: string;
}

export default function NewsletterForm({
    title = "न्यूजलेटर सदस्यता लिनुहोस्",
    description = "ताजा समाचार सिधा तपाईंको इमेलमा प्राप्त गर्नुहोस्",
    accentColor = "#e61e2b",
    textColor = "#ffffff",
    source = "footer",
}: NewsletterFormProps) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage("सफलतापूर्वक सदस्यता लिइयो!");
                setEmail("");
                // Reset after 5 seconds
                setTimeout(() => {
                    setStatus("idle");
                    setMessage("");
                }, 5000);
            } else {
                setStatus("error");
                setMessage(data.error || "सदस्यता लिन सकिएन");
            }
        } catch (error) {
            setStatus("error");
            setMessage("सदस्यता लिन सकिएन। पछि पुन: प्रयास गर्नुहोस्।");
        }
    };

    if (status === "success") {
        return (
            <div
                className="p-6 rounded-2xl text-center"
                style={{ backgroundColor: `${textColor}08` }}
            >
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" aria-hidden="true" />
                <h3 className="text-white font-semibold mb-2">धन्यवाद!</h3>
                <p className="text-sm" style={{ color: textColor }}>{message}</p>
            </div>
        );
    }

    return (
        <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: `${textColor}08` }}
        >
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <p className="text-sm mb-4" style={{ color: textColor }}>{description}</p>

            <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="relative" suppressHydrationWarning>
                    <label htmlFor="newsletter-email" className="sr-only" suppressHydrationWarning>
                        तपाईंको इमेल ठेगाना
                    </label>
                    <input
                        id="newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="तपाईंको इमेल"
                        disabled={status === "loading"}
                        required
                        aria-required="true"
                        aria-invalid={status === "error"}
                        aria-describedby={status === "error" ? "newsletter-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:ring-2 disabled:opacity-50"
                        style={{
                            backgroundColor: `${textColor}10`,
                            color: textColor,
                        }}
                        suppressHydrationWarning
                    />
                </div>

                {status === "error" && (
                    <div id="newsletter-error" role="alert" aria-live="polite" className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
                    style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 4px 20px ${accentColor}30`
                    }}
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            पठाउँदै...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" aria-hidden="true" />
                            सदस्यता लिनुहोस्
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
