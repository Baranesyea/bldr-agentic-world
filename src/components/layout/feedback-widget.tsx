"use client";

import React, { useState, useRef, useCallback } from "react";

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

// Camera shutter sound — two-part mechanical click
function playShutterSound() {
  try {
    const ctx = new AudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.25;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // First click (shutter open) — sharp transient at t=0
      if (t < 0.015) {
        sample += Math.exp(-t * 300) * Math.sin(t * 4000) * 0.6;
        sample += Math.exp(-t * 200) * (Math.random() * 2 - 1) * 0.3;
      }

      // Mechanical resonance
      if (t > 0.005 && t < 0.06) {
        sample += Math.exp(-(t - 0.005) * 100) * Math.sin((t - 0.005) * 2200) * 0.15;
      }

      // Second click (shutter close) — at t=0.1
      const t2 = t - 0.1;
      if (t2 > 0 && t2 < 0.015) {
        sample += Math.exp(-t2 * 350) * Math.sin(t2 * 3500) * 0.45;
        sample += Math.exp(-t2 * 250) * (Math.random() * 2 - 1) * 0.2;
      }

      data[i] = sample;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.onended = () => ctx.close();
  } catch {}
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("הצעה לשיפור");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [hover, setHover] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [formVisible, setFormVisible] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const captureScreenshot = useCallback(async () => {
    setCapturing(true);

    // Step 1: Fade out the form and button
    setFormVisible(false);
    // Hide overlay
    const overlay = document.querySelector("[data-feedback-overlay]") as HTMLElement;
    if (overlay) overlay.style.opacity = "0";

    // Wait for fade out
    await new Promise(r => setTimeout(r, 300));

    // Fully hide elements so they don't appear in capture
    if (widgetRef.current) widgetRef.current.style.display = "none";
    if (btnRef.current) btnRef.current.style.display = "none";
    if (overlay) overlay.style.display = "none";

    // Small delay for paint
    await new Promise(r => setTimeout(r, 50));

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Save scroll position, scroll to top-left of current view for accurate capture
      const savedScrollX = window.scrollX;
      const savedScrollY = window.scrollY;

      // Capture only the visible viewport by targeting document.body
      // with scrollX/Y offset and viewport dimensions
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        x: savedScrollX,
        y: savedScrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: -savedScrollX,
        scrollY: -savedScrollY,
        windowWidth: document.body.scrollWidth,
        windowHeight: document.body.scrollHeight,
      });

      // The canvas should now be viewport-sized, but crop if needed
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = window.innerWidth;
      croppedCanvas.height = window.innerHeight;
      const ctx = croppedCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, window.innerWidth, window.innerHeight, 0, 0, window.innerWidth, window.innerHeight);
      }

      // Step 2: Flash effect + sound
      playShutterSound();

      // Show flash overlay
      if (flashRef.current) {
        flashRef.current.style.opacity = "1";
        setTimeout(() => {
          if (flashRef.current) flashRef.current.style.opacity = "0";
        }, 100);
      }

      // Convert to webp (use croppedCanvas for clean viewport-only output)
      const dataUrl = croppedCanvas.toDataURL("image/webp", 0.75);
      setAttachment(dataUrl);
      setAttachmentName("screenshot.webp");
    } catch {
      // Fallback
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (ctx) {
          ctx.fillStyle = "#050510";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#fff";
          ctx.font = "16px sans-serif";
          ctx.fillText("צילום מסך לא זמין - נא צרף תמונה ידנית", 20, 40);
        }
        setAttachment(canvas.toDataURL("image/webp", 0.75));
        setAttachmentName("screenshot-fallback.webp");
      } catch {}
    }

    // Step 3: Restore elements
    if (widgetRef.current) widgetRef.current.style.display = "";
    if (btnRef.current) btnRef.current.style.display = "";
    if (overlay) {
      overlay.style.display = "";
      overlay.style.opacity = "";
    }

    // Wait for flash to finish, then fade form back in
    await new Promise(r => setTimeout(r, 250));
    setFormVisible(true);
    setCapturing(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    let userName = "אורח";
    let userEmail = "";
    try {
      const cached = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      if (cached.full_name) userName = cached.full_name;
      if (cached.email) userEmail = cached.email;
    } catch {}

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          userEmail,
          category,
          message: content.trim(),
          mood,
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
          attachmentUrl: attachment,
        }),
      });
    } catch {}

    setContent("");
    setMood(null);
    setCategory("הצעה לשיפור");
    setAttachment(null);
    setAttachmentName("");
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Flash overlay for screenshot effect */}
      <div
        ref={flashRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "white",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 0.1s ease-out",
        }}
      />

      {/* Floating button */}
      <button
        ref={btnRef}
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
          data-feedback-overlay=""
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 51,
            background: "rgba(0,0,0,0.3)",
            transition: "opacity 0.25s",
          }}
        />
      )}

      {/* Slide-up panel */}
      <div
        ref={widgetRef}
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
          borderRadius: 6,
          padding: 24,
          transform: open && formVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: open && formVisible ? 1 : 0,
          pointerEvents: open && formVisible ? "auto" : "none",
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
            <div style={{ position: "relative", marginBottom: 14 }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", paddingLeft: 36, borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 14, outline: "none",
                appearance: "none", direction: "rtl", cursor: "pointer",
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>
              ))}
            </select>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(240,240,245,0.5)" }}>▼</span>
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ספר לנו מה הפריע לך או מה אפשר לשפר..."
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 14, resize: "vertical", outline: "none",
                marginBottom: 14, direction: "rtl", lineHeight: 1.6, boxSizing: "border-box",
              }}
            />

            {/* Attachment area */}
            <div style={{ marginBottom: 14 }}>
              {attachment ? (
                <div style={{
                  position: "relative", borderRadius: 4, overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)", marginBottom: 8,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachment} alt="צילום" style={{ width: "100%", maxHeight: 150, objectFit: "cover", display: "block" }} />
                  <button
                    onClick={() => { setAttachment(null); setAttachmentName(""); }}
                    style={{
                      position: "absolute", top: 6, left: 6, width: 24, height: 24,
                      borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none",
                      color: "#fff", fontSize: 14, cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                  <div style={{ padding: "6px 10px", background: "rgba(0,0,0,0.4)", fontSize: 11, color: "rgba(240,240,245,0.6)" }}>
                    {attachmentName}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={captureScreenshot}
                    disabled={capturing}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                      color: "rgba(240,240,245,0.7)", fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {capturing ? "מצלם..." : "צלם מסך"}
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                      color: "rgba(240,240,245,0.7)", fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    צרף קובץ
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>

            {/* Mood */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ color: "rgba(240,240,245,0.7)", fontSize: 13, marginBottom: 10 }}>איך אתה מרגיש?</p>
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
                width: "100%", padding: "12px", borderRadius: 4, border: "none",
                background: content.trim() ? "rgba(0,0,255,0.7)" : "rgba(255,255,255,0.08)",
                color: content.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 15, fontWeight: 600,
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
