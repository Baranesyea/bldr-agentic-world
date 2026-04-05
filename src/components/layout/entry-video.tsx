"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface EntryVideoSettings {
  enabled: boolean;
  vimeoUrl: string;
  delaySec: number;
  showAfterTour: boolean;
}

export function EntryVideo() {
  const [show, setShow] = useState(false);
  const [vimeoId, setVimeoId] = useState<string | null>(null);
  const triggeredRef = useRef(false);

  const triggerVideo = useCallback((id: string, delaySec: number) => {
    if (triggeredRef.current) return;
    const shown = sessionStorage.getItem("bldr_entry_video_shown");
    if (shown) return;
    triggeredRef.current = true;

    const delay = (delaySec || 0) * 1000;
    setTimeout(() => {
      setVimeoId(id);
      setShow(true);
      sessionStorage.setItem("bldr_entry_video_shown", "true");
    }, delay);
  }, []);

  useEffect(() => {
    fetch("/api/entry-video")
      .then((r) => r.json())
      .then((data: EntryVideoSettings) => {
        if (!data.enabled || !data.vimeoUrl) return;

        const id = data.vimeoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
        if (!id) return;

        const tourDone = localStorage.getItem("bldr_onboarding_done") === "true";

        if (!tourDone && data.showAfterTour) {
          // First visit with tour — wait for tour to finish or be skipped
          const onTourDone = () => {
            triggerVideo(id, data.delaySec);
          };
          window.addEventListener("bldr:tour-complete", onTourDone);

          // Also catch when user skips via the done screen dismiss
          const onShowDoneDismiss = () => {
            // Small delay to let the done screen close
            setTimeout(() => triggerVideo(id, data.delaySec), 500);
          };
          window.addEventListener("bldr:tour-done-dismissed", onShowDoneDismiss);

          return () => {
            window.removeEventListener("bldr:tour-complete", onTourDone);
            window.removeEventListener("bldr:tour-done-dismissed", onShowDoneDismiss);
          };
        } else {
          // Returning user or not linked to tour
          triggerVideo(id, data.delaySec);
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
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0&badge=0&autopause=0&player_id=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
