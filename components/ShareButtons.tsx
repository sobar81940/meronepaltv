"use client";

import React from "react";

interface ShareButtonsProps {
  slug: string;
  url: string;
  title?: string;
}

async function getLocation(timeout = 5000): Promise<{ lat: number; lon: number } | null> {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(null);
      }
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout }
    );
  });
}

async function recordShare(slug: string) {
  try {
    const location = await getLocation(5000);
    // Require location to record share
    if (!location) return { recorded: false };

    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });

    if (!res.ok) return { recorded: false };
    const data = await res.json();
    return { recorded: !!data.incremented };
  } catch (err) {
    console.error("recordShare error", err);
    return { recorded: false };
  }
}

export default function ShareButtons({ slug, url, title = "" }: ShareButtonsProps) {
  const openWindow = (u: string) => {
    window.open(u, '_blank', 'width=600,height=400');
  };

  const handleFacebook = async () => {
    await recordShare(slug);
    openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  };

  const handleTwitter = async () => {
    await recordShare(slug);
    openWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
  };

  const handleLinkedin = async () => {
    await recordShare(slug);
    openWindow(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
  };

  const handleGenericShare = async () => {
    const { recorded } = await recordShare(slug);

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        // share cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }

    return recorded;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={handleFacebook} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition shadow-md" aria-label="Share on Facebook">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3.6l.4-4H15V6a1 1 0 0 1 1-1h2z"></path></svg>
      </button>

      <button onClick={handleTwitter} className="w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition shadow-md" aria-label="Share on X">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 12.07 4v1A12.94 12.94 0 0 1 3 1s-4 9 5 13a13 13 0 0 1-8 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
      </button>

      <button onClick={handleLinkedin} className="w-10 h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition shadow-md" aria-label="Share on LinkedIn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12" rx="1"></rect><circle cx="4" cy="4" r="2"></circle></svg>
      </button>

      <button onClick={handleGenericShare} className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition shadow-md" aria-label="More share options">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
      </button>
    </div>
  );
}
