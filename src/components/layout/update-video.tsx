"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UpdateVideoSettings {
  enabled: boolean;
  vimeoUrl: string;
  delaySec: number;
  version: string;
}

export function UpdateVideo() {
  const [show, setShow] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [vimeoId, setVimeoId] = useState<string | null>(null);
  const triggeredRef = useRef(false);

  const triggerVideo = useCallback((id: string, delaySec: number, version: string) => {
    if (triggeredRef.current) return;
    // Check if user already saw this version
    const seenVersion = localStorage.getItem("bldr_update_video_seen");
    if (seenVersion === version) return;
    triggeredRef.current = true;

    const delay = (delaySec || 0) * 1000;
    setTimeout(() => {
      setVimeoId(id);
      setShow(true);
      localStorage.setItem("bldr_update_video_seen", version);
    }, delay);
  }, []);

  useEffect(() => {
    // Only show to returning users (tour already completed, not first visit)
    const tourDone = localStorage.getItem("bldr_onboarding_done") === "true";
    if (!tourDone) return; // First visit — skip update video

    // Don't show if entry video hasn't been shown yet (still first visit flow)
    const entryShown = localStorage.getItem("bldr_entry_video_shown");
    if (!entryShown) return;

    fetch("/api/update-video")
      .then((r) => r.json())
      .then((data: UpdateVideoSettings) => {
        if (!data.enabled || !data.vimeoUrl || !data.version) return;

        const id = data.vimeoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
        if (!id) return;

        // Add delay so it doesn't clash with page load
        setTimeout(() => triggerVideo(id, data.delaySec, data.version), 2000);
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
        zIndex: 99980,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: iframeLoaded ? 1 : 0,
        transition: "opacity 0.5s ease",
        direction: "rtl",
      }}
    >
      {/* Badge */}
      <div style={{
        position: "fixed", top: 20, right: 20,
        background: "rgba(0,0,255,0.15)", border: "1px solid rgba(100,100,255,0.3)",
        borderRadius: 8, padding: "6px 14px", zIndex: 100000,
        color: "#8888ff", fontSize: 13, fontWeight: 600,
      }}>
        🆕 עדכון חדש
      </div>

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
          background: "#000",
        }}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0&badge=0&autopause=0&player_id=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
