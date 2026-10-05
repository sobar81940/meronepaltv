import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextRequest } from "next/server";
import { uploadToSpaces } from "@/lib/spaces";

// Initialize AI providers
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const deepseek = process.env.DEEPSEEK_API_KEY
    ? new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com/v1"
    })
    : null;

const grok = process.env.XAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1"
    })
    : null;

// Available providers and models
interface AIProvider {
    id: string;
    name: string;
    models: { id: string; name: string }[];
    available: boolean;
}

export async function GET() {
    // Return available providers for frontend
    const providers: AIProvider[] = [
        {
            id: "google",
            name: "Google Gemini",
            models: [
                { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
                { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash" },
                { id: "gemini-pro", name: "Gemini Pro" },
            ],
            available: !!genAI,
        },
        {
            id: "openai",
            name: "OpenAI (ChatGPT)",
            models: [
                { id: "gpt-4o-mini", name: "GPT-4o Mini" },
                { id: "gpt-4o", name: "GPT-4o" },
                { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
                { id: "dall-e-3", name: "DALL·E 3 (Image)" },
            ],
            available: !!openai,
        },
        {
            id: "deepseek",
            name: "DeepSeek",
            models: [
                { id: "deepseek-chat", name: "DeepSeek Chat" },
                { id: "deepseek-coder", name: "DeepSeek Coder" },
            ],
            available: !!deepseek,
        },
        {
            id: "grok",
            name: "xAI (Grok)",
            models: [
                { id: "grok-beta", name: "Grok Beta" },
            ],
            available: !!grok,
        },
    ];

    return Response.json({ success: true, data: providers });
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, type, provider = "google", model } = await request.json();

        if (!prompt) {
            return Response.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Handle Image Generation
        if (type === "image") {
            if (!openai) {
                return Response.json(
                    { success: false, error: "OpenAI API key not configured for image generation" },
                    { status: 500 }
                );
            }

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
            });

            const imageBase64 = response.data?.[0]?.b64_json;

            if (!imageBase64) {
                throw new Error("Failed to generate image");
            }

            // Convert base64 to buffer
            const buffer = Buffer.from(imageBase64, "base64");

            // Upload to DigitalOcean Spaces
            const uploadResult = await uploadToSpaces(buffer, {
                folder: "news-portal/generated",
                contentType: "image/png",
            });

            return Response.json({
                success: true,
                data: {
                    content: uploadResult.url,
                    type: "image",
                    provider: "openai",
                    model: "dall-e-3",
                },
            });
        }

        // Build system prompt based on type
        let systemPrompt = "";
        switch (type) {
            case "article":
                systemPrompt = `You are a professional Nepali news journalist. Write a comprehensive news article in Nepali language based on the given topic. 
                The article should:
                - Be written in proper Nepali (Devanagari script)
                - Include a compelling headline
                - Have an engaging introduction
                - Cover the main points thoroughly
                - Be factual and informative
                - Be formatted with proper paragraphs
                - Be suitable for a news portal
                
                Topic: ${prompt}
                
                Write the article in HTML format with proper tags like <h2>, <p>, <strong>, <ul>, <li> etc. for rich text formatting.`;
                break;

            case "headline":
                systemPrompt = `You are a Nepali news editor. Generate 5 compelling news headlines in Nepali (Devanagari script) based on the given topic. Return only the headlines, one per line.
                
                Topic: ${prompt}`;
                break;

            case "excerpt":
                systemPrompt = `Summarize the following content into a brief, engaging excerpt in Nepali (Devanagari script). Keep it under 150 characters. Return only the excerpt text.
                
                Content: ${prompt}`;
                break;

            case "improve":
                systemPrompt = `You are a professional editor. Improve the following Nepali news article to make it more engaging, clear, and professional. Keep the same language and tone but enhance the quality. Return the improved content in HTML format.
                
                Content: ${prompt}`;
                break;

            case "translate_to_nepali":
                systemPrompt = `Translate the following text to Nepali (Devanagari script). Keep the meaning accurate and use natural Nepali language. Return the translation in HTML format if the original contains formatting.
                
                Text: ${prompt}`;
                break;

            default:
                systemPrompt = `You are a helpful Nepali content writer. ${prompt}`;
        }

        let text = "";
        let usedModel = model;

        // Route to appropriate provider
        switch (provider) {
            case "google":
                if (!genAI) {
                    return Response.json(
                        { success: false, error: "Google Gemini API key not configured" },
                        { status: 500 }
                    );
                }
                const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-2.0-flash" });
                const geminiResult = await geminiModel.generateContent(systemPrompt);
                const geminiResponse = await geminiResult.response;
                text = geminiResponse.text();
                usedModel = model || "gemini-2.0-flash";
                break;

            case "openai":
                if (!openai) {
                    return Response.json(
                        { success: false, error: "OpenAI API key not configured" },
                        { status: 500 }
                    );
                }
                const openaiResponse = await openai.chat.completions.create({
                    model: model || "gpt-4o-mini",
                    messages: [{ role: "user", content: systemPrompt }],
                });
                text = openaiResponse.choices[0]?.message?.content || "";
                usedModel = model || "gpt-4o-mini";
                break;

            case "deepseek":
                if (!deepseek) {
                    return Response.json(
                        { success: false, error: "DeepSeek API key not configured" },
                        { status: 500 }
                    );
                }
                const deepseekResponse = await deepseek.chat.completions.create({
                    model: model || "deepseek-chat",
                    messages: [{ role: "user", content: systemPrompt }],
                });
                text = deepseekResponse.choices[0]?.message?.content || "";
                usedModel = model || "deepseek-chat";
                break;

            case "grok":
                if (!grok) {
                    return Response.json(
                        { success: false, error: "xAI (Grok) API key not configured" },
                        { status: 500 }
                    );
                }
                const grokResponse = await grok.chat.completions.create({
                    model: model || "grok-beta",
                    messages: [{ role: "user", content: systemPrompt }],
                });
                text = grokResponse.choices[0]?.message?.content || "";
                usedModel = model || "grok-beta";
                break;

            default:
                return Response.json(
                    { success: false, error: "Invalid provider" },
                    { status: 400 }
                );
        }

        // Clean up the content
        text = text.replace(/^```html\n?/i, "").replace(/\n?```$/i, "");
        text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");

        if (text.includes("<html") || text.includes("<!DOCTYPE")) {
            const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
                text = bodyMatch[1].trim();
            }
        }

        text = text.replace(/<\/?html[^>]*>/gi, "");
        text = text.replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, "");
        text = text.replace(/<\/?body[^>]*>/gi, "");
        text = text.replace(/<!DOCTYPE[^>]*>/gi, "");
        text = text.trim();

        return Response.json({
            success: true,
            data: {
                content: text,
                type,
                provider,
                model: usedModel,
            },
        });
    } catch (error) {
        console.error("AI generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate content";

        if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")) {
            return Response.json(
                {
                    success: false,
                    error: "API rate limit exceeded. Please wait a moment and try again.",
                    retryAfter: 60
                },
                { status: 429 }
            );
        }

        return Response.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
