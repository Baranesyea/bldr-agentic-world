"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, XIcon, EyeOff, Eye } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface YouTubeVideo {
  videoId: string;
  title: string;
  published: string;
}

function useHorizontalScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 2;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}

/** Shared horizontal scroll strip with RTL edge fade hints */
function ScrollStrip({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(true);
  useHorizontalScroll(scrollRef);

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    // RTL: scrollLeft is negative (or 0 at start)
    const scrollPos = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setShowStartFade(scrollPos > 20);
    setShowEndFade(scrollPos < maxScroll - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowEndFade(el.scrollWidth > el.clientWidth);
    el.addEventListener("scroll", updateFades, { passive: true });
    return () => el.removeEventListener("scroll", updateFades);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* RTL: start = right side */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 8,
          width: 60,
          background: "linear-gradient(to left, #050510, transparent)",
          zIndex: 2,
          pointerEvents: "none",
          opacity: showStartFade ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />
      {/* RTL: end = left side */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 8,
          width: 60,
          background: "linear-gradient(to right, #050510, transparent)",
          zIndex: 2,
          pointerEvents: "none",
          opacity: showEndFade ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          paddingBottom: "8px",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/** Video lightbox */
function VideoLightbox({
  video,
  isShort,
  onClose,
}: {
  video: YouTubeVideo;
  isShort: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: isShort ? "min(360px, 90vw)" : "100%",
          maxWidth: isShort ? "360px" : "56rem",
          aspectRatio: isShort ? "9/16" : "16/9",
          maxHeight: isShort ? "85vh" : undefined,
          margin: "0 16px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: -48,
            right: 0,
            background: "rgba(23,23,23,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer",
            color: "white",
            display: "flex",
          }}
        >
          <XIcon size={20} />
        </button>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px solid white",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&vq=hd1080&hd=1`}
            style={{ width: "100%", height: "100%", border: "none" }}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Main videos carousel (horizontal, between hero and courses) */
export function YouTubeCarousel() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const { isAdmin } = useUser();

  useEffect(() => {
    fetch("/api/youtube-feed")
      .then((r) => r.json())
      .then((data) => {
        if (data.videos && Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
        if (data.hiddenVideoIds && Array.isArray(data.hiddenVideoIds)) {
          setHiddenIds(data.hiddenVideoIds);
        }
      })
      .catch(() => {});
  }, []);

  const toggleHide = async (videoId: string) => {
    const newHidden = hiddenIds.includes(videoId)
      ? hiddenIds.filter((id) => id !== videoId)
      : [...hiddenIds, videoId];
    setHiddenIds(newHidden);
    await fetch("/api/youtube-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiddenVideoIds: newHidden }),
    });
  };

  const visibleVideos = isAdmin ? videos : videos.filter((v) => !hiddenIds.includes(v.videoId));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (visibleVideos.length > 0 && !loaded) setLoaded(true);
  }, [visibleVideos.length, loaded]);

  if (visibleVideos.length === 0) return null;

  return (
    <>
      <div style={{
        padding: "0 48px 8px",
        animation: loaded ? "ytSlideIn 0.4s ease-out both" : "none",
      }}>
      <style>{`
        @keyframes ytSlideIn {
          from { opacity: 0; transform: translateY(-20px); max-height: 0; margin-bottom: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 500px; margin-bottom: 0; }
        }
      `}</style>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f0f5",
            marginBottom: "16px",
          }}
        >
          להישאר בלופ
        </h2>
        <ScrollStrip>
          {visibleVideos.map((v) => {
            const isHidden = hiddenIds.includes(v.videoId);
            return (
            <div
              key={v.videoId}
              onClick={() => { if (!isHidden || !isAdmin) setActiveVideo(v); }}
              style={{
                flex: "0 0 220px",
                cursor: "pointer",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(10,10,26,0.6)",
                transition: "all 0.25s",
                opacity: isHidden ? 0.35 : 1,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9" }}>
                <img
                  src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                  alt={v.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(5,5,16,0.9) 0%, rgba(5,5,16,0.4) 40%, transparent 100%)",
                  }}
                />
                {/* Play button on hover */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(0,0,255,0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={16} fill="white" color="white" />
                  </div>
                </div>
                {/* Title on thumbnail */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "8px 10px",
                    zIndex: 1,
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "rgba(240,240,245,0.9)",
                      lineHeight: 1.4,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {v.title}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleHide(v.videoId); }}
                  title={isHidden ? "הצג סרטון" : "הסתר סרטון"}
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    zIndex: 5,
                    background: isHidden ? "rgba(255,80,80,0.8)" : "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {isHidden ? <Eye size={14} color="white" /> : <EyeOff size={14} color="white" />}
                </button>
              )}
            </div>
            );
          })}
        </ScrollStrip>
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoLightbox video={activeVideo} isShort={false} onClose={() => setActiveVideo(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

/** Shorts carousel (horizontal, below courses) — 6 full + 7th peeking */
export function YouTubeShortsCarousel() {
  const [shorts, setShorts] = useState<YouTubeVideo[]>([]);
  const [activeShort, setActiveShort] = useState<YouTubeVideo | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const { isAdmin } = useUser();

  useEffect(() => {
    fetch("/api/youtube-feed")
      .then((r) => r.json())
      .then((data) => {
        if (data.shorts && Array.isArray(data.shorts)) {
          setShorts(data.shorts);
        }
        if (data.hiddenVideoIds && Array.isArray(data.hiddenVideoIds)) {
          setHiddenIds(data.hiddenVideoIds);
        }
      })
      .catch(() => {});
  }, []);

  const toggleHide = async (videoId: string) => {
    const newHidden = hiddenIds.includes(videoId)
      ? hiddenIds.filter((id) => id !== videoId)
      : [...hiddenIds, videoId];
    setHiddenIds(newHidden);
    await fetch("/api/youtube-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiddenVideoIds: newHidden }),
    });
  };

  const visibleShorts = isAdmin ? shorts : shorts.filter((v) => !hiddenIds.includes(v.videoId));

  if (visibleShorts.length === 0) return null;

  return (
    <>
      <div style={{ padding: "16px 48px 48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#f0f0f5",
            marginBottom: "16px",
          }}
        >
          תכנים קצרים
        </h2>
        <ScrollStrip>
          {visibleShorts.map((v) => {
            const isHidden = hiddenIds.includes(v.videoId);
            return (
            <div
              key={v.videoId}
              onClick={() => { if (!isHidden || !isAdmin) setActiveShort(v); }}
              style={{
                flex: typeof window !== "undefined" && window.innerWidth <= 768
                  ? "0 0 calc((100vw - 48px) / 3.2)"
                  : "0 0 calc((100vw - 96px - 68px - 72px) / 6.5)",
                cursor: "pointer",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(10,10,26,0.6)",
                transition: "all 0.25s",
                opacity: isHidden ? 0.35 : 1,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ position: "relative", aspectRatio: "9/16" }}>
                <img
                  src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                  alt={v.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Gradient overlay — low, only behind title */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: "linear-gradient(to top, rgba(5,5,16,0.95) 0%, rgba(5,5,16,0.7) 40%, transparent 100%)",
                  }}
                />
                {/* Play button on hover */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,0,0,0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={14} fill="white" color="white" />
                  </div>
                </div>
                {/* Title overlay at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "24px 8px 8px",
                    zIndex: 1,
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 1.3,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {v.title}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleHide(v.videoId); }}
                  title={isHidden ? "הצג סרטון" : "הסתר סרטון"}
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    zIndex: 5,
                    background: isHidden ? "rgba(255,80,80,0.8)" : "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {isHidden ? <Eye size={14} color="white" /> : <EyeOff size={14} color="white" />}
                </button>
              )}
            </div>
            );
          })}
        </ScrollStrip>
      </div>

      <AnimatePresence>
        {activeShort && (
          <VideoLightbox video={activeShort} isShort={true} onClose={() => setActiveShort(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
