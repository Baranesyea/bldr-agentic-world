"use client";

import React, { useEffect, useState } from "react";

interface VideoItem {
  videoId: string;
  title: string;
  published: string;
}

interface InstaPost {
  shortcode: string;
  caption: string;
}

export default function SocialPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [instaPosts, setInstaPosts] = useState<InstaPost[]>([]);
  const [instaLoading, setInstaLoading] = useState(true);

  useEffect(() => {
    fetch("/api/youtube-feed")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setVideos(data);
        else throw new Error("bad data");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    fetch("/api/instagram-feed")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInstaPosts(data);
      })
      .catch(() => {})
      .finally(() => setInstaLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
        תכנים נוספים
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "28px", fontSize: "14px" }}>
        תכנים שאני מעלה ברשתות החברתיות — טיפים, הדרכות ועדכונים
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* ── YouTube (Right) ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "#FF0000",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", fontFamily: "var(--font-heading-en)" }}>Eran Brownstain</h2>
                <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.4)" }}>YouTube</p>
              </div>
            </div>
            <a
              href="https://www.youtube.com/@eranbrownstain?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#FF0000", color: "white", padding: "6px 14px",
                borderRadius: "8px", fontSize: "12px", fontWeight: 600, textDecoration: "none",
              }}
            >
              הרשם
            </a>
          </div>

          {/* Video list */}
          <div style={{ padding: "12px" }}>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{
                  width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "#FF0000", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {error && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(240,240,245,0.5)" }}>
                <p style={{ marginBottom: "12px" }}>לא הצלחנו לטעון את הסרטונים</p>
                <a
                  href="https://www.youtube.com/@eranbrownstain"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#FF0000", textDecoration: "none", fontWeight: 600 }}
                >
                  צפו ישירות בערוץ →
                </a>
              </div>
            )}

            {!loading && !error && videos.map((video) => (
              <div key={video.videoId} style={{ marginBottom: "16px", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ position: "relative", paddingBottom: "56.25%" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: "8px 4px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", lineHeight: 1.4 }}>
                    {video.title}
                  </p>
                  {video.published && (
                    <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.4)", marginTop: "4px" }}>
                      {new Date(video.published).toLocaleDateString("he-IL", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <a
              href="https://www.youtube.com/@eranbrownstain"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center", padding: "16px",
                color: "#FF0000", textDecoration: "none", fontSize: "14px", fontWeight: 600,
              }}
            >
              לכל הסרטונים בערוץ →
            </a>
          </div>
        </div>

        {/* ── Instagram (Left) ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", fontFamily: "var(--font-heading-en)" }}>@eran_brownstain</h2>
                <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.4)" }}>Instagram</p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/eran_brownstain/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "linear-gradient(135deg, #F58529, #DD2A7B)", color: "white",
                padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, textDecoration: "none",
              }}
            >
              עקוב
            </a>
          </div>

          {/* Instagram posts */}
          <div style={{ padding: "12px" }}>
            {instaLoading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{
                  width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "#E4405F", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            )}

            {!instaLoading && instaPosts.length > 0 ? (
              instaPosts.map((post) => (
                <div key={post.shortcode} style={{ marginBottom: "16px", borderRadius: "10px", overflow: "hidden" }}>
                  <iframe
                    src={`https://www.instagram.com/p/${post.shortcode}/embed`}
                    style={{
                      width: "100%",
                      minHeight: "480px",
                      border: "none",
                      borderRadius: "10px",
                      background: "#fff",
                    }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ))
            ) : !instaLoading ? (
              /* Fallback to profile embed if individual posts couldn't be fetched */
              <iframe
                src="https://www.instagram.com/eran_brownstain/embed"
                style={{
                  width: "100%",
                  minHeight: "800px",
                  border: "none",
                  background: "#fff",
                  borderRadius: "10px",
                }}
                allowFullScreen
                loading="lazy"
              />
            ) : null}
          </div>

          <a
            href="https://www.instagram.com/eran_brownstain/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", textAlign: "center", padding: "16px",
              color: "#E4405F", textDecoration: "none", fontSize: "14px", fontWeight: 600,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            לכל הפוסטים →
          </a>
        </div>
      </div>
    </div>
  );
}
