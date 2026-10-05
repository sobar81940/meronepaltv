"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { User, Mail, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Camera, Trash2, Upload } from "lucide-react";

interface Profile {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
    postCount: number;
    createdAt: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/auth/profile");
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setName(data.data.name);
                setEmail(data.data.email);
                setProfileImage(data.data.profileImage);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            setMessage({ type: "error", text: "Failed to load profile" });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Please select an image file" });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image size must be less than 5MB" });
            return;
        }

        setUploadingImage(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                // Update profile with new image
                const updateRes = await fetch("/api/auth/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profileImage: uploadData.data.url }),
                });

                const updateData = await updateRes.json();

                if (updateData.success) {
                    setProfileImage(uploadData.data.url);
                    setMessage({ type: "success", text: "Profile image updated!" });
                    fetchProfile();
                } else {
                    setMessage({ type: "error", text: updateData.error || "Failed to update profile image" });
                }
            } else {
                setMessage({ type: "error", text: uploadData.error || "Failed to upload image" });
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
            setMessage({ type: "error", text: "Failed to upload image" });
        } finally {
            setUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!confirm("Are you sure you want to remove your profile image?")) return;

        setSaving(true);
        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileImage: "" }),
            });

            const data = await res.json();

            if (data.success) {
                setProfileImage(undefined);
                setMessage({ type: "success", text: "Profile image removed!" });
                fetchProfile();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to remove image" });
            }
        } catch (error) {
            console.error("Failed to remove image:", error);
            setMessage({ type: "error", text: "Failed to remove image" });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validate passwords if changing
        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                setMessage({ type: "error", text: "Current password is required to change password" });
                return;
            }
            if (newPassword !== confirmPassword) {
                setMessage({ type: "error", text: "New passwords do not match" });
                return;
            }
            if (newPassword.length < 6) {
                setMessage({ type: "error", text: "New password must be at least 6 characters" });
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "Profile updated successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                // Refresh profile data
                fetchProfile();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update profile" });
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case "admin": return "Administrator";
            case "editor": return "Editor";
            case "demo": return "Demo User";
            default: return role;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "editor": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "demo": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    const getAvatarGradient = (role: string) => {
        switch (role) {
            case "admin": return "bg-gradient-to-br from-emerald-400 to-cyan-500";
            case "demo": return "bg-gradient-to-br from-orange-400 to-amber-500";
            default: return "bg-gradient-to-br from-blue-400 to-indigo-500";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                <p className="text-slate-400 mt-1">Manage your account settings</p>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start gap-6">
                    {/* Profile Image Section */}
                    <div className="relative group">
                        <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center relative ${!profileImage ? getAvatarGradient(profile?.role || "") : "bg-slate-700"
                            }`}>
                            {profileImage ? (
                                <Image
                                    src={profileImage}
                                    alt={profile?.name || "Profile"}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={40} className="text-white" />
                            )}
                        </div>

                        {/* Upload overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="p-2 text-white hover:text-blue-400 transition-colors"
                            >
                                {uploadingImage ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <Camera size={24} />
                                )}
                            </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">{profile?.name}</h2>
                        <p className="text-slate-400">{profile?.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(profile?.role || "")}`}>
                            {getRoleDisplay(profile?.role || "")}
                        </span>

                        {/* Image actions */}
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Upload size={14} />
                                {profileImage ? "Change Photo" : "Upload Photo"}
                            </button>
                            {profileImage && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {profile?.role === "demo" && (
                    <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-sm text-orange-300">
                            <strong>Demo Account:</strong> You have created {profile.postCount} of 2 allowed posts.
                        </p>
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${message.type === "success"
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                    }`}>
                    {message.type === "success" ? (
                        <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                    ) : (
                        <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                    )}
                    <p className={message.type === "success" ? "text-green-400" : "text-red-400"}>
                        {message.text}
                    </p>
                </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <User size={20} className="text-blue-400" />
                        Basic Information
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Your name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Mail size={16} className="inline mr-2" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Lock size={20} className="text-blue-400" />
                        Change Password
                    </h3>
                    <p className="text-sm text-slate-400">Leave blank to keep current password</p>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Changes
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
