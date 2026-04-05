"use client";

import { useState, useEffect, useCallback } from "react";

interface EntryVideoSettings {
  enabled: boolean;
  vimeoUrl: string;
  delaySec: number;
  showAfterTour: boolean;
}

export function EntryVideo() {
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState<EntryVideoSettings | null>(null);
  const [vimeoId, setVimeoId] = useState<string | null>(null);

  const triggerVideo = useCallback((s: EntryVideoSettings) => {
    const id = s.vimeoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
    if (!id) return;
    setVimeoId(id);

    // Check if already shown this session
    const shown = sessionStorage.getItem("bldr_entry_video_shown");
    if (shown) return;

    const delay = (s.delaySec || 0) * 1000;
    setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("bldr_entry_video_shown", "true");
    }, delay);
  }, []);

  useEffect(() => {
    fetch("/api/entry-video")
      .then((r) => r.json())
      .then((data: EntryVideoSettings) => {
        if (!data.enabled || !data.vimeoUrl) return;
        setSettings(data);

        const isFirstVisit = !localStorage.getItem("bldr_onboarding_done");

        if (isFirstVisit && data.showAfterTour) {
          // Wait for tour to complete, then show video
          const handler = () => {
            // Small delay after tour completion
            setTimeout(() => triggerVideo(data), 2000);
          };
          window.addEventListener("bldr:tour-complete", handler);
          return () => window.removeEventListener("bldr:tour-complete", handler);
        } else {
          // Not first visit or not linked to tour — show after delay
          triggerVideo(data);
        }
      })
      .catch(() => {});
  }, [triggerVideo]);

  const close = () => setShow(false);

  if (!show || !vimeoId) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "entryVideoIn 0.3s ease",
        direction: "rtl",
      }}
    >
      <style>{`
        @keyframes entryVideoIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100000,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
      >
        ✕
      </button>

      {/* Video container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 900,
          aspectRatio: "16/9",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(0,0,255,0.2), 0 20px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&badge=0&autopause=0&player_id=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
