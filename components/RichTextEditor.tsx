"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Image as ImageIcon,
    Youtube as YoutubeIcon,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    Highlighter,
    Palette,
    X,
    Upload,
    Loader2
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = "Write your content here...",
}: RichTextEditorProps) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-500 underline cursor-pointer",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg my-4",
                },
            }),
            Youtube.configure({
                HTMLAttributes: {
                    class: "w-full aspect-video rounded-lg my-4",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync content from outside (e.g., AI generation)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const addLink = useCallback(() => {
        if (linkUrl && editor) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
            setLinkUrl("");
            setShowLinkInput(false);
        }
    }, [editor, linkUrl]);

    const removeLink = useCallback(() => {
        if (editor) {
            editor.chain().focus().unsetLink().run();
        }
    }, [editor]);

    const addImage = useCallback(() => {
        if (imageUrl && editor) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl("");
            setShowImageInput(false);
        }
    }, [editor, imageUrl]);

    const addYoutube = useCallback(() => {
        if (youtubeUrl && editor) {
            editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
            setYoutubeUrl("");
            setShowYoutubeInput(false);
        }
    }, [editor, youtubeUrl]);

    if (!editor) {
        return (
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg h-[400px] animate-pulse" />
        );
    }

    const ToolbarButton = ({
        onClick,
        active,
        children,
        title,
    }: {
        onClick: () => void;
        active?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-slate-600 transition-colors ${active ? "bg-slate-600 text-blue-400" : "text-slate-300"
                }`}
        >
            {children}
        </button>
    );

    const ToolbarDivider = () => <div className="w-px h-6 bg-slate-600 mx-1" />;

    return (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-800 border-b border-slate-600">
                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <Undo size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <Redo size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive("underline")}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <Strikethrough size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive("code")}
                    title="Code"
                >
                    <Code size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    active={editor.isActive("highlight")}
                    title="Highlight"
                >
                    <Highlighter size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    active={editor.isActive({ textAlign: "left" })}
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    active={editor.isActive({ textAlign: "center" })}
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    active={editor.isActive({ textAlign: "right" })}
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    active={editor.isActive({ textAlign: "justify" })}
                    title="Justify"
                >
                    <AlignJustify size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive("orderedList")}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    <Minus size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Link */}
                <ToolbarButton
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    active={editor.isActive("link") || showLinkInput}
                    title="Add Link"
                >
                    <LinkIcon size={18} />
                </ToolbarButton>

                {/* Image */}
                <ToolbarButton
                    onClick={() => setShowImageInput(!showImageInput)}
                    active={showImageInput}
                    title="Add Image"
                >
                    <ImageIcon size={18} />
                </ToolbarButton>

                {/* YouTube */}
                <ToolbarButton
                    onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                    active={showYoutubeInput}
                    title="Add YouTube Video"
                >
                    <YoutubeIcon size={18} />
                </ToolbarButton>
            </div>

            {/* Link Input */}
            {showLinkInput && (
                <div className="flex items-center gap-2 p-2 bg-slate-700 border-b border-slate-600">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="Enter URL..."
                        className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && addLink()}
                    />
                    <button
                        type="button"
                        onClick={addLink}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                    >
                        Add
                    </button>
                    {editor.isActive("link") && (
                        <button
                            type="button"
                            onClick={removeLink}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                        >
                            Remove
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowLinkInput(false)}
                        className="p-1.5 text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Image Input */}
            {showImageInput && (
                <div className="flex items-center gap-2 p-2 bg-slate-700 border-b border-slate-600">
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Enter image URL..."
                        className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && addImage()}
                    />
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm flex items-center gap-2 transition-colors">
                        {uploading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Upload size={16} />
                        )}
                        <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            disabled={uploading}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                setUploading(true);
                                try {
                                    const formData = new FormData();
                                    formData.append("file", file);

                                    const res = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formData,
                                    });

                                    const data = await res.json();
                                    if (data.success) {
                                        editor?.chain().focus().setImage({ src: data.data.url }).run();
                                        setShowImageInput(false);
                                    } else {
                                        console.error("Upload failed:", data.error);
                                    }
                                } catch (error) {
                                    console.error("Upload error:", error);
                                } finally {
                                    setUploading(false);
                                }
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={addImage}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowImageInput(false)}
                        className="p-1.5 text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* YouTube Input */}
            {showYoutubeInput && (
                <div className="flex items-center gap-2 p-2 bg-slate-700 border-b border-slate-600">
                    <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Enter YouTube URL..."
                        className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && addYoutube()}
                    />
                    <button
                        type="button"
                        onClick={addYoutube}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowYoutubeInput(false)}
                        className="p-1.5 text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} className="text-white" />

            {/* Editor Styles */}
            <style jsx global>{`
                .ProseMirror {
                    min-height: 300px;
                    padding: 1rem;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #64748b;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 1rem 0;
                }
                .ProseMirror h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0.75rem 0;
                }
                .ProseMirror h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0.5rem 0;
                }
                .ProseMirror p {
                    margin: 0.5rem 0;
                }
                .ProseMirror ul,
                .ProseMirror ol {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .ProseMirror li {
                    margin: 0.25rem 0;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #3b82f6;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #94a3b8;
                    font-style: italic;
                }
                .ProseMirror code {
                    background: #1e293b;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-family: monospace;
                }
                .ProseMirror pre {
                    background: #1e293b;
                    padding: 1rem;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                .ProseMirror hr {
                    border: none;
                    border-top: 2px solid #334155;
                    margin: 1.5rem 0;
                }
                .ProseMirror mark {
                    background-color: #fef08a;
                    color: #000;
                    padding: 0.1rem 0.2rem;
                    border-radius: 2px;
                }
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
                .ProseMirror iframe {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
            `}</style>
        </div>
    );
}
