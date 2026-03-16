"use client";

import React, { useState, useEffect } from "react";

interface FeedbackItem {
  id: string;
  category: string;
  content: string;
  mood: number | null;
  page: string;
  createdAt: string;
  status: "new" | "read" | "resolved";
  userName: string;
  userEmail: string;
}

const categories = ["באג", "הצעה לשיפור", "בעיה כללית", "אחר"];

function MoodFace({ type, selected, onClick }: { type: number; selected: boolean; onClick: () => void }) {
  const size = 36;
  const strokeColor = selected ? "#fff" : "rgba(240,240,245,0.4)";
  const bg = selected ? "rgba(0,0,255,0.25)" : "transparent";
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        border: selected ? "1px solid rgba(0,0,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: "50%",
        width: 48,
        height: 48,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="18" cy="18" r="14" />
        <circle cx="13" cy="15" r="1.2" fill={strokeColor} stroke="none" />
        <circle cx="23" cy="15" r="1.2" fill={strokeColor} stroke="none" />
        {type === 0 && <path d="M12 23 Q18 28 24 23" />}
        {type === 1 && <line x1="12" y1="23" x2="24" y2="23" />}
        {type === 2 && <path d="M12 25 Q18 20 24 25" />}
      </svg>
    </button>
  );
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [hover, setHover] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    let userName = "אורח";
    let userEmail = "";
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_user_profile") || "{}");
      if (profile.name) userName = profile.name;
      if (profile.email) userEmail = profile.email;
    } catch {}
    const item: FeedbackItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      category,
      content: content.trim(),
      mood,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      createdAt: new Date().toISOString(),
      status: "new",
      userName,
      userEmail,
    };
    const existing = JSON.parse(localStorage.getItem("bldr_feedback") || "[]");
    existing.push(item);
    localStorage.setItem("bldr_feedback", JSON.stringify(existing));
    setContent("");
    setMood(null);
    setCategory(categories[0]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid rgba(0,0,255,0.3)",
          background: "rgba(10,10,30,0.9)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hover
            ? "0 0 20px rgba(0,0,255,0.4), 0 0 40px rgba(0,0,255,0.15)"
            : "0 0 12px rgba(0,0,255,0.15)",
          transition: "box-shadow 0.3s",
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(200,200,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Panel overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 51,
            background: "rgba(0,0,0,0.3)",
          }}
        />
      )}

      {/* Slide-up panel */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 52,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          background: "rgba(14,14,32,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 24,
          transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s",
          direction: "rtl",
        }}
      >
        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="8 12 11 15 16 9" />
            </svg>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>תודה! הפידבק שלך התקבל</p>
          </div>
        ) : (
          <>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>שלח פידבק</h3>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 14,
                marginBottom: 14,
                outline: "none",
                appearance: "none",
                direction: "rtl",
                cursor: "pointer",
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>
              ))}
            </select>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ספר לנו מה הפריע לך או מה אפשר לשפר..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                marginBottom: 14,
                direction: "rtl",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />

            {/* Mood */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 13, marginBottom: 10 }}>איך אתה מרגיש?</p>
              <div style={{ display: "flex", gap: 12 }}>
                <MoodFace type={0} selected={mood === 0} onClick={() => setMood(mood === 0 ? null : 0)} />
                <MoodFace type={1} selected={mood === 1} onClick={() => setMood(mood === 1 ? null : 1)} />
                <MoodFace type={2} selected={mood === 2} onClick={() => setMood(mood === 2 ? null : 2)} />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background: content.trim() ? "rgba(0,0,255,0.7)" : "rgba(255,255,255,0.08)",
                color: content.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 15,
                fontWeight: 600,
                cursor: content.trim() ? "pointer" : "default",
                transition: "background 0.2s",
              }}
            >
              שלח
            </button>
          </>
        )}
      </div>
    </>
  );
}
