"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ReviewSettings {
  enabled: boolean;
  triggers: { type: string; minutesInSystem?: number; loginCount?: number; enabled: boolean }[];
  popupTitle: string;
  lowRatingMessage: string;
  highRatingMessage: string;
  videoAcceptedMessage: string;
}

type Phase = "hidden" | "rating" | "text" | "response" | "video_ask" | "video_accepted";

export function ReviewPopup() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [sending, setSending] = useState(false);
  const triggeredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should show the popup
  const shouldShow = useCallback((s: ReviewSettings) => {
    if (!s.enabled) return false;
    // Already reviewed this session
    if (sessionStorage.getItem("bldr_review_shown")) return false;
    // Already reviewed ever
    if (localStorage.getItem("bldr_review_done")) return false;

    return true;
  }, []);

  const showPopup = useCallback(() => {
    if (triggeredRef.current) return;
    // Don't show during tour
    if (document.querySelector("[data-tour-active]")) return;
    // Don't show during video
    if (document.querySelector("iframe[src*='vimeo']")) return;
    // Don't show if watching a lesson (check if on lesson page)
    if (window.location.pathname.includes("/lessons/")) return;

    triggeredRef.current = true;
    sessionStorage.setItem("bldr_review_shown", "true");
    setPhase("rating");
  }, []);

  useEffect(() => {
    // Get user info
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      setUserEmail(profile.email || "");
      setUserName(profile.full_name || profile.fullName || "");
    } catch {}

    fetch("/api/reviews/settings")
      .then((r) => r.json())
      .then((s: ReviewSettings) => {
        setSettings(s);
        if (!shouldShow(s)) return;

        // Setup triggers
        for (const trigger of s.triggers) {
          if (!trigger.enabled) continue;

          if (trigger.type === "time" && trigger.minutesInSystem) {
            // Show after X minutes
            const ms = (trigger.minutesInSystem || 20) * 60 * 1000;
            timerRef.current = setTimeout(showPopup, ms);
          }

          if (trigger.type === "login_count" && trigger.loginCount) {
            const count = parseInt(localStorage.getItem("bldr_login_count") || "0");
            if (count >= trigger.loginCount) {
              // Delay a bit so it doesn't show immediately on login
              setTimeout(showPopup, 10000);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shouldShow, showPopup]);

  const handleSubmitRating = () => {
    if (stars === 0) return;
    setPhase("text");
  };

  const handleSubmitReview = async () => {
    setSending(true);

    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        userName,
        stars,
        text: text || null,
        wantsVideo: false,
        triggerType: "auto",
      }),
    });

    localStorage.setItem("bldr_review_done", "true");
    setSending(false);

    if (stars >= 4) {
      setPhase("video_ask");
    } else {
      setPhase("response");
    }
  };

  const handleVideoResponse = async (wants: boolean) => {
    if (wants) {
      // Update the review
      setSending(true);
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          userName,
          stars,
          text,
          wantsVideo: true,
          triggerType: "auto",
        }),
      });
      setSending(false);
      setPhase("video_accepted");
    } else {
      setPhase("response");
    }
  };

  const close = () => setPhase("hidden");

  if (phase === "hidden" || !settings) return null;

  const displayStars = hoverStar || stars;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99990,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "reviewFadeIn 0.3s ease",
        direction: "rtl",
      }}
      onClick={close}
    >
      <style>{`
        @keyframes reviewFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes reviewSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(165deg, rgba(12,12,30,0.98) 0%, rgba(8,8,22,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "36px 32px",
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          animation: "reviewSlideUp 0.4s ease",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={close}
          style={{
            position: "absolute", top: 12, left: 12,
            background: "none", border: "none", color: "rgba(240,240,245,0.4)",
            fontSize: 18, cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* ── Phase: Rating ── */}
        {phase === "rating" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", marginBottom: 24, marginTop: 0 }}>
              {settings.popupTitle}
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 36, transition: "transform 0.15s",
                    transform: displayStars >= n ? "scale(1.15)" : "scale(1)",
                    filter: displayStars >= n ? "none" : "grayscale(1) brightness(0.4)",
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitRating}
              disabled={stars === 0}
              style={{
                ...btnStyle,
                opacity: stars === 0 ? 0.4 : 1,
                cursor: stars === 0 ? "not-allowed" : "pointer",
              }}
            >
              המשך
            </button>
          </>
        )}

        {/* ── Phase: Text ── */}
        {phase === "text" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ fontSize: 24, filter: stars >= n ? "none" : "grayscale(1) brightness(0.4)" }}>⭐</span>
              ))}
            </div>
            <p style={{ fontSize: 15, color: "rgba(240,240,245,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
              רוצה להוסיף כמה מילים?
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ספר לנו..."
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "14px 16px",
                color: "#f0f0f5",
                fontSize: 14,
                width: "100%",
                minHeight: 100,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
              <button onClick={handleSubmitReview} disabled={sending} style={btnStyle}>
                {sending ? "שולח..." : "שלח"}
              </button>
              <button
                onClick={() => { setText(""); handleSubmitReview(); }}
                style={{ ...btnStyle, background: "rgba(255,255,255,0.06)" }}
              >
                דלג
              </button>
            </div>
          </>
        )}

        {/* ── Phase: Response (low rating) ── */}
        {phase === "response" && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🙏</div>
            <p style={{ fontSize: 16, color: "#f0f0f5", lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>
              {stars >= 4 ? settings.highRatingMessage.split("\n")[0] : settings.lowRatingMessage}
            </p>
            <button onClick={close} style={btnStyle}>סגור</button>
          </>
        )}

        {/* ── Phase: Video Ask (high rating) ── */}
        {phase === "video_ask" && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎬</div>
            <p style={{ fontSize: 16, color: "#f0f0f5", lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>
              {settings.highRatingMessage}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => handleVideoResponse(true)} disabled={sending} style={btnStyle}>
                {sending ? "שולח..." : "כן, בטח!"}
              </button>
              <button onClick={() => handleVideoResponse(false)} style={{ ...btnStyle, background: "rgba(255,255,255,0.06)" }}>
                לא הפעם
              </button>
            </div>
          </>
        )}

        {/* ── Phase: Video Accepted ── */}
        {phase === "video_accepted" && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💚</div>
            <p style={{ fontSize: 16, color: "#f0f0f5", lineHeight: 1.7, marginBottom: 24 }}>
              {settings.videoAcceptedMessage}
            </p>
            <button onClick={close} style={btnStyle}>סגור</button>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0000FF 0%, #0033FF 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "12px 32px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 0 20px rgba(0,0,255,0.2)",
  transition: "all 0.2s",
};
