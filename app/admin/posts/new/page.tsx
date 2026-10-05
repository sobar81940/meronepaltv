"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Type, Image as ImageIcon, Film, Quote, Heading, Code, MoveUp, MoveDown } from "lucide-react";
import Link from "next/link";
import ImageUploadWithBrowser from "@/components/ImageUploadWithBrowser";
import RichTextEditor from "@/components/RichTextEditor";
import AIGenerateButton from "@/components/AIGenerateButton";
import { ContentBlock, ContentBlockType } from "@/lib/types";


interface Category {
    _id: string;
    name: string;
}

interface Author {
    _id: string;
    name: string;
    email: string;
}

interface SiteSettings {
    socialMedia: {
        twitter: { enabled: boolean };
        facebook: { enabled: boolean };
        instagram: { enabled: boolean };
        youtube: { enabled: boolean };
    };
}

export default function NewPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        category: "",
        province: "",
        author: "",
        authorId: "",
        tags: "",
        imageUrl: "",
        published: false,
        isHeadline: false,
    });

    // Multiple Content Blocks
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

    // Social Media Settings & Shares
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [socialShares, setSocialShares] = useState({
        twitter: false,
        facebook: false,
        instagram: false,
        facebookReel: false,
        youtube: false
    });

    useEffect(() => {
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data: { success: boolean, data: Category[] }) => {
                if (data.success) setCategories(data.data);
            });

        fetch("/api/authors")
            .then((res) => res.json())
            .then((data: { success: boolean, data: Author[] }) => {
                if (data.success) setAuthors(data.data);
            });

        // Fetch settings to check enabled social platforms
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data: { success: boolean, data: SiteSettings }) => {
                if (data.success && data.data) {
                    setSiteSettings(data.data);
                    // Enable shares by default if platform is enabled globally
                    if (data.data.socialMedia) {
                        setSocialShares({
                            twitter: !!data.data.socialMedia.twitter?.enabled,
                            facebook: !!data.data.socialMedia.facebook?.enabled,
                            instagram: !!data.data.socialMedia.instagram?.enabled,
                            facebookReel: !!data.data.socialMedia.facebook?.enabled,
                            youtube: !!data.data.socialMedia.youtube?.enabled
                        });
                    }
                }
            });
    }, []);

    // Add a new content block
    const addContentBlock = (type: ContentBlockType) => {
        const newBlock: ContentBlock = {
            id: `block-${Date.now()}`,
            type,
            content: "",
            order: contentBlocks.length,
        };
        setContentBlocks([...contentBlocks, newBlock]);
        setActiveBlockId(newBlock.id);
    };

    // Update a content block
    const updateContentBlock = (id: string, updates: Partial<ContentBlock>) => {
        setContentBlocks(blocks =>
            blocks.map(block =>
                block.id === id ? { ...block, ...updates } : block
            )
        );
    };

    // Remove a content block
    const removeContentBlock = (id: string) => {
        setContentBlocks(blocks => blocks.filter(block => block.id !== id));
        if (activeBlockId === id) setActiveBlockId(null);
    };

    // Move content block up
    const moveBlockUp = (index: number) => {
        if (index === 0) return;
        const newBlocks = [...contentBlocks];
        [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
        newBlocks.forEach((block, i) => block.order = i);
        setContentBlocks(newBlocks);
    };

    // Move content block down
    const moveBlockDown = (index: number) => {
        if (index === contentBlocks.length - 1) return;
        const newBlocks = [...contentBlocks];
        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
        newBlocks.forEach((block, i) => block.order = i);
        setContentBlocks(newBlocks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    slug: form.slug || undefined, // Only send if manually set
                    tags: form.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
                    socialShares: form.published ? socialShares : undefined,
                }),
            });

            if (res.ok) {
                router.push("/admin/posts");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setLoading(false);
        }
    };

    // Block type icons
    const blockTypeInfo: Record<ContentBlockType, { icon: React.ReactNode; label: string; color: string }> = {
        text: { icon: <Type size={18} />, label: "Text", color: "text-blue-400" },
        image: { icon: <ImageIcon size={18} />, label: "Image", color: "text-green-400" },
        video: { icon: <Film size={18} />, label: "Video", color: "text-purple-400" },
        quote: { icon: <Quote size={18} />, label: "Quote", color: "text-yellow-400" },
        heading: { icon: <Heading size={18} />, label: "Heading", color: "text-orange-400" },
        embed: { icon: <Code size={18} />, label: "Embed", color: "text-pink-400" },
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/posts"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Create New Post</h1>
                    <p className="text-slate-400 mt-1">Write a new article with multiple content sections</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter post title..."
                            required
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Slug (URL) <span className="text-slate-500 text-xs">- Leave empty for auto-generate</span>
                        </label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") })}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="e.g., my-post-title (auto-generated if empty)"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Preview: /post/{form.slug || "[auto-generated]"}
                        </p>
                    </div>

                    {/* Main Content */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Main Content *
                            </label>
                            <AIGenerateButton
                                currentContent={form.content}
                                currentTitle={form.title}
                                onGenerate={(content) => setForm({ ...form, content })}
                            />
                        </div>
                        <RichTextEditor
                            content={form.content}
                            onChange={(content) => setForm({ ...form, content })}
                            placeholder="Write your main article content..."
                        />
                    </div>

                    {/* Multiple Content Blocks */}
                    <div className="border-t border-slate-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-slate-300">
                                Additional Content Sections
                                <span className="text-slate-500 text-xs ml-2">({contentBlocks.length} blocks)</span>
                            </label>
                        </div>

                        {/* Add Block Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(Object.keys(blockTypeInfo) as ContentBlockType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => addContentBlock(type)}
                                    className={`flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 hover:text-white transition text-sm`}
                                >
                                    <Plus size={14} />
                                    <span className={blockTypeInfo[type].color}>{blockTypeInfo[type].icon}</span>
                                    {blockTypeInfo[type].label}
                                </button>
                            ))}
                        </div>

                        {/* Content Blocks List */}
                        {contentBlocks.length > 0 && (
                            <div className="space-y-4">
                                {contentBlocks.map((block, index) => (
                                    <div
                                        key={block.id}
                                        className={`bg-slate-900/50 rounded-lg border transition ${activeBlockId === block.id ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700'}`}
                                    >
                                        {/* Block Header */}
                                        <div className="flex items-center gap-3 p-3 border-b border-slate-700/50 bg-slate-800/50 rounded-t-lg">
                                            <div className="text-slate-500 cursor-grab">
                                                <GripVertical size={16} />
                                            </div>
                                            <div className={`flex items-center gap-2 ${blockTypeInfo[block.type].color}`}>
                                                {blockTypeInfo[block.type].icon}
                                                <span className="text-sm font-medium text-slate-300">{blockTypeInfo[block.type].label} Block</span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => moveBlockUp(index)}
                                                    disabled={index === 0}
                                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition disabled:opacity-30"
                                                    title="Move Up"
                                                >
                                                    <MoveUp size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveBlockDown(index)}
                                                    disabled={index === contentBlocks.length - 1}
                                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition disabled:opacity-30"
                                                    title="Move Down"
                                                >
                                                    <MoveDown size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeContentBlock(block.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                                    title="Remove Block"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Block Content */}
                                        <div className="p-4">
                                            {block.type === 'text' && (
                                                <RichTextEditor
                                                    content={block.content}
                                                    onChange={(content) => updateContentBlock(block.id, { content })}
                                                    placeholder="Write text content..."
                                                />
                                            )}

                                            {block.type === 'heading' && (
                                                <input
                                                    type="text"
                                                    value={block.content}
                                                    onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-xl font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter heading text..."
                                                />
                                            )}

                                            {block.type === 'quote' && (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={block.content}
                                                        onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white italic placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        placeholder="Enter quote text..."
                                                        rows={3}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={block.caption || ""}
                                                        onChange={(e) => updateContentBlock(block.id, { caption: e.target.value })}
                                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Quote attribution (e.g., — Author Name)"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'image' && (
                                                <div className="space-y-3">
                                                    <ImageUploadWithBrowser
                                                        value={block.mediaUrl || ""}
                                                        onChange={(url: string) => updateContentBlock(block.id, { mediaUrl: url, content: url })}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={block.caption || ""}
                                                        onChange={(e) => updateContentBlock(block.id, { caption: e.target.value })}
                                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Image caption (optional)"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'video' && (
                                                <div className="space-y-3">
                                                    <input
                                                        type="url"
                                                        value={block.mediaUrl || ""}
                                                        onChange={(e) => updateContentBlock(block.id, { mediaUrl: e.target.value, content: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={block.caption || ""}
                                                        onChange={(e) => updateContentBlock(block.id, { caption: e.target.value })}
                                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Video caption (optional)"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'embed' && (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={block.embedCode || ""}
                                                        onChange={(e) => updateContentBlock(block.id, { embedCode: e.target.value, content: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        placeholder="Paste embed code (iframe, Twitter embed, etc.)"
                                                        rows={4}
                                                    />
                                                    <p className="text-xs text-slate-500">Supports: Twitter, YouTube, Facebook, Instagram embeds, and custom iframes</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {contentBlocks.length === 0 && (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                                <p className="mb-2">No additional content blocks added</p>
                                <p className="text-xs">Click the buttons above to add text, images, videos, quotes, or embeds</p>
                            </div>
                        )}
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Excerpt
                        </label>
                        <textarea
                            value={form.excerpt}
                            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Brief summary (auto-generated if empty)..."
                        />
                    </div>

                    {/* Category, Province & Author */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                प्रदेश (Province)
                            </label>
                            <select
                                value={form.province || ""}
                                onChange={(e) => setForm({ ...form, province: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select province</option>
                                <option value="कोशी प्रदेश">कोशी प्रदेश</option>
                                <option value="मधेश प्रदेश">मधेश प्रदेश</option>
                                <option value="बागमती प्रदेश">बागमती प्रदेश</option>
                                <option value="गण्डकी प्रदेश">गण्डकी प्रदेश</option>
                                <option value="लुम्बिनी प्रदेश">लुम्बिनी प्रदेश</option>
                                <option value="कर्णाली प्रदेश">कर्णाली प्रदेश</option>
                                <option value="सुदूरपश्चिम प्रदेश">सुदूरपश्चिम प्रदेश</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Author
                            </label>
                            {authors.length > 0 ? (
                                <select
                                    value={form.authorId || ""}
                                    onChange={(e) => {
                                        const selectedAuthor = authors.find(a => a._id === e.target.value);
                                        setForm({
                                            ...form,
                                            authorId: e.target.value,
                                            author: selectedAuthor ? selectedAuthor.name : ""
                                        });
                                    }}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select author (Optional)</option>
                                    {authors.map((author) => (
                                        <option key={author._id} value={author._id}>
                                            {author.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={form.author}
                                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Author name..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Comma separated tags..."
                        />
                    </div>

                    {/* Featured Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Featured Image
                        </label>
                        <ImageUploadWithBrowser
                            value={form.imageUrl}
                            onChange={(url: string) => setForm({ ...form, imageUrl: url })}
                        />
                    </div>

                    {/* Published Toggle */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="published"
                                checked={form.published}
                                onChange={(e) =>
                                    setForm({ ...form, published: e.target.checked })
                                }
                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="published" className="text-slate-300">
                                Publish immediately
                            </label>
                        </div>

                        {/* Headline Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isHeadline"
                                checked={form.isHeadline}
                                onChange={(e) =>
                                    setForm({ ...form, isHeadline: e.target.checked })
                                }
                                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="isHeadline" className="text-slate-300 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">हेडलाइन</span>
                                Show on Home Headline
                            </label>
                        </div>
                    </div>

                    {/* Social Media Auto-Posting */}
                    {siteSettings?.socialMedia && form.published && (
                        <div className="space-y-3 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Auto-post to Social Media
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {siteSettings.socialMedia.twitter?.enabled && (
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition">
                                        <input
                                            type="checkbox"
                                            checked={socialShares.twitter}
                                            onChange={(e) => setSocialShares({ ...socialShares, twitter: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-300 text-sm">Twitter (X)</span>
                                    </label>
                                )}
                                {siteSettings.socialMedia.facebook?.enabled && (
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition">
                                        <input
                                            type="checkbox"
                                            checked={socialShares.facebook}
                                            onChange={(e) => setSocialShares({ ...socialShares, facebook: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-300 text-sm">Facebook</span>
                                    </label>
                                )}
                                {siteSettings.socialMedia.instagram?.enabled && (
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition">
                                        <input
                                            type="checkbox"
                                            checked={socialShares.instagram}
                                            onChange={(e) => setSocialShares({ ...socialShares, instagram: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-pink-500 focus:ring-pink-500"
                                        />
                                        <span className="text-slate-300 text-sm">Instagram</span>
                                    </label>
                                )}
                                {siteSettings.socialMedia.facebook?.enabled && (
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition">
                                        <input
                                            type="checkbox"
                                            checked={socialShares.facebookReel}
                                            onChange={(e) => setSocialShares({ ...socialShares, facebookReel: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-300 text-sm">Facebook Reel</span>
                                    </label>
                                )}
                                {siteSettings.socialMedia.youtube?.enabled && (
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition">
                                        <input
                                            type="checkbox"
                                            checked={socialShares.youtube}
                                            onChange={(e) => setSocialShares({ ...socialShares, youtube: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-red-500 focus:ring-red-500"
                                        />
                                        <span className="text-slate-300 text-sm">YouTube Shorts</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link
                        href="/admin/posts"
                        className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {loading ? "Creating..." : "Create Post"}
                    </button>
                </div>
            </form>
        </div>
    );
}

