"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, XIcon } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/youtube-feed")
      .then((r) => r.json())
      .then((data) => {
        if (data.videos && Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
      })
      .catch(() => {});
  }, []);

  if (videos.length === 0) return null;

  return (
    <>
      <div style={{ padding: "0 48px 8px" }}>
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
          {videos.map((v) => (
            <div
              key={v.videoId}
              onClick={() => setActiveVideo(v)}
              style={{
                flex: "0 0 220px",
                cursor: "pointer",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(10,10,26,0.6)",
                transition: "all 0.25s",
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
            </div>
          ))}
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

  useEffect(() => {
    fetch("/api/youtube-feed")
      .then((r) => r.json())
      .then((data) => {
        if (data.shorts && Array.isArray(data.shorts)) {
          setShorts(data.shorts);
        }
      })
      .catch(() => {});
  }, []);

  if (shorts.length === 0) return null;

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
          {shorts.map((v) => (
            <div
              key={v.videoId}
              onClick={() => setActiveShort(v)}
              style={{
                // 6 full cards + half of 7th visible
                // Container = 100vw - 96px(padding) - 68px(sidebar) = ~1376px on 1540px screen
                // (1376 - 6*12gap) / 6.5 ≈ 200px
                flex: "0 0 calc((100vw - 96px - 68px - 72px) / 6.5)",
                cursor: "pointer",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(10,10,26,0.6)",
                transition: "all 0.25s",
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
            </div>
          ))}
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
