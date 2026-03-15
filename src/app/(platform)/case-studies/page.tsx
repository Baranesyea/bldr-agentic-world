"use client";

import React, { useState, useEffect, useCallback } from "react";

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
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleClose = useCallback(() => setSelected(null), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bldr_case_studies");
      if (stored) {
        setCaseStudies(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

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
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          מקרי בוחן
        </h1>
        <p style={{ fontSize: 16, color: "rgba(240,240,245,0.5)", maxWidth: 500, margin: "0 auto" }}>
          פתרונות אמיתיים שבנינו ללקוחות — צפו ולמדו
        </p>
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
            <div
              key={cs.id}
              style={cardS}
              onClick={() => setSelected(cs)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(0,0,255,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Thumbnail */}
              <div style={{
                height: 180,
                background: GRADIENTS[i % GRADIENTS.length],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(8px)",
                  transition: "transform 0.2s",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
                    <polygon points="8 5 20 12 8 19 8 5" />
                  </svg>
                </div>
              </div>

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
                  WebkitBoxOrient: "vertical",
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
      <div style={{
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

      {/* Lightbox Modal */}
      {selected && (
        <div
          onClick={handleClose}
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
