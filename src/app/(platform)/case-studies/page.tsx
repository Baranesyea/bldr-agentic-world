"use client";

import React, { useState, useEffect } from "react";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  tags: string[];
  createdAt: string;
}

interface CaseStudyRequest {
  id: string;
  name: string;
  email: string;
  description: string;
  createdAt: string;
  status: "new" | "in_progress" | "done";
}

const GRADIENTS = [
  "linear-gradient(135deg, #0a0a4a, #1a1aff)",
  "linear-gradient(135deg, #1a0a3a, #6a2aff)",
  "linear-gradient(135deg, #0a2a3a, #0acaff)",
  "linear-gradient(135deg, #0a3a1a, #0aff5a)",
  "linear-gradient(135deg, #3a0a2a, #ff2a8a)",
  "linear-gradient(135deg, #2a1a0a, #ffaa0a)",
];

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  // Already embed format
  if (url.includes("youtube.com/embed/")) return url;
  // watch?v= format
  const match = url.match(/[?&]v=([^&#]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // youtu.be format
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
}

const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  overflow: "hidden",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
};

const tagS: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: "rgba(0,0,255,0.12)",
  color: "rgba(140,140,255,1)",
  border: "1px solid rgba(0,0,255,0.2)",
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const btnP: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 12,
  border: "none",
  background: "#0000FF",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bldr_case_studies");
      if (stored) {
        setCaseStudies(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const handleSubmit = () => {
    if (!formName.trim() || !formEmail.trim() || !formDesc.trim()) return;
    const request: CaseStudyRequest = {
      id: crypto.randomUUID(),
      name: formName.trim(),
      email: formEmail.trim(),
      description: formDesc.trim(),
      createdAt: new Date().toISOString(),
      status: "new",
    };
    try {
      const stored = localStorage.getItem("bldr_case_study_requests");
      const list: CaseStudyRequest[] = stored ? JSON.parse(stored) : [];
      list.push(request);
      localStorage.setItem("bldr_case_study_requests", JSON.stringify(list));
    } catch {}
    setFormName("");
    setFormEmail("");
    setFormDesc("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            מקרי בוחן
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,240,245,0.5)" }}>
            פתרונות אמיתיים שבנינו ללקוחות — צפו ולמדו
          </p>
        </div>
        <button
          onClick={() => {
            const el = document.getElementById("request-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            background: "#0000FF", color: "white", padding: "10px 24px",
            borderRadius: "12px", fontWeight: 600, fontSize: "14px",
            border: "none", cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,0,255,0.25)",
            display: "flex", alignItems: "center", gap: "8px",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          הגש בקשה למקרה בוחן
        </button>
      </div>

      {/* Gallery Grid */}
      {loaded && caseStudies.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: "80px 32px",
          textAlign: "center",
          marginBottom: 60,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📂</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            אין מקרי בוחן עדיין
          </h2>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 60 }}>
          {caseStudies.map((cs, i) => (
            <div key={cs.id} style={cardS}>
              {/* Video with HeroVideoDialog */}
              <HeroVideoDialog
                animationStyle="from-center"
                videoSrc={toEmbedUrl(cs.videoUrl) + "?autoplay=1"}
                thumbnailSrc={`https://img.youtube.com/vi/${extractYouTubeId(cs.videoUrl) || "dQw4w9WgXcQ"}/hqdefault.jpg`}
                thumbnailAlt={cs.title}
              />

              {/* Info */}
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                  {cs.title}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "rgba(240,240,245,0.5)",
                  lineHeight: 1.6,
                  marginBottom: 12,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}>
                  {cs.description}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cs.tags.map((tag) => (
                    <span key={tag} style={tagS}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request a Case Study */}
      <div id="request-section" style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 40,
        maxWidth: 600,
        margin: "0 auto",
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, textAlign: "center" }}>
          רוצה מקרה בוחן מותאם?
        </h2>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", marginBottom: 28, textAlign: "center" }}>
          ספר לנו על הצורך שלך ונבנה מקרה בוחן רלוונטי
        </p>

        {submitted ? (
          <div style={{
            padding: "20px",
            borderRadius: 12,
            background: "rgba(0,200,100,0.08)",
            border: "1px solid rgba(0,200,100,0.2)",
            textAlign: "center",
            color: "rgba(100,255,180,1)",
            fontSize: 14,
            fontWeight: 500,
          }}>
            הבקשה נשלחה בהצלחה! ניצור איתך קשר בקרוב.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 8, fontWeight: 500 }}>שם</label>
              <input style={inputS} placeholder="השם שלך" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 8, fontWeight: 500 }}>אימייל</label>
              <input style={inputS} type="email" placeholder="name@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 8, fontWeight: 500 }}>תיאור הצורך</label>
              <textarea
                style={{ ...inputS, minHeight: 100, resize: "vertical" }}
                placeholder="ספר לנו מה אתה מחפש..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <button
              style={{ ...btnP, opacity: formName.trim() && formEmail.trim() && formDesc.trim() ? 1 : 0.4 }}
              onClick={handleSubmit}
              disabled={!formName.trim() || !formEmail.trim() || !formDesc.trim()}
            >
              שלח בקשה
            </button>
          </div>
        )}
      </div>

      {/* Old lightbox removed — using HeroVideoDialog instead */}
      {false && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "80%", maxWidth: 1000, position: "relative" }}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: -44,
                left: 0,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              marginBottom: 20,
            }}>
              <iframe
                src={toEmbedUrl(selected.videoUrl) + "?autoplay=1"}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              {selected.title}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(240,240,245,0.6)", lineHeight: 1.6 }}>
              {selected.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
