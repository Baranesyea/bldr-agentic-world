"use client";

import React, { useState, useEffect } from "react";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { ShareButton } from "@/components/ui/share-button";
import { PricingPopup } from "@/components/ui/pricing-popup";

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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const match = url.match(/[?&]v=([^&#]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
}

const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
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
  borderRadius: 4,
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
  borderRadius: 4,
  border: "none",
  background: "#0000FF",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

interface CaseStudiesClientProps {
  caseStudies: CaseStudy[];
}

export default function CaseStudiesClient({ caseStudies }: CaseStudiesClientProps) {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touristCaseStudyId, setTouristCaseStudyId] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    // Check tourist case study access
    try {
      const touristRaw = localStorage.getItem("bldr_tourist");
      if (touristRaw) {
        const tourist = JSON.parse(touristRaw);
        if (tourist.type === "case_study" && tourist.caseStudyId) {
          setTouristCaseStudyId(tourist.caseStudyId);
        }
      }
    } catch {}
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
      {showPricing && <PricingPopup onClose={() => setShowPricing(false)} />}
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
          onClick={() => setShowRequestForm(true)}
          style={{
            background: "#0000FF", color: "white", padding: "10px 24px",
            borderRadius: "4px", fontWeight: 600, fontSize: "14px",
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
      {caseStudies.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
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
          {caseStudies.map((cs, i) => {
            const isLocked = !!touristCaseStudyId && cs.id !== touristCaseStudyId;
            return (
            <div key={cs.id} style={{ ...cardS, position: "relative" }}>
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {cs.tags.map((tag) => (
                    <span key={tag} style={tagS}>{tag}</span>
                  ))}
                </div>
                <ShareButton
                  type="case_study"
                  name={cs.title}
                  caseStudyId={cs.id}
                  caseStudyTitle={cs.title}
                  videoUrl={cs.videoUrl}
                />
              </div>
              {/* Lock overlay for tourists */}
              {isLocked && (
                <div
                  onClick={() => setShowPricing(true)}
                  style={{
                    position: "absolute", inset: 0, zIndex: 2,
                    background: "rgba(10,10,26,0.85)",
                    backdropFilter: "blur(4px)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "8px", cursor: "pointer", borderRadius: 4,
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🔒</span>
                  <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", textAlign: "center", padding: "0 16px" }}>
                    נעול
                  </p>
                  <span style={{ fontSize: "12px", color: "#5555ff", fontWeight: 600 }}>
                    להצטרפות ←
                  </span>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Request a Case Study — Popup */}
      {showRequestForm && (
        <div
          onClick={() => setShowRequestForm(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              padding: 40,
              maxWidth: 500,
              width: "90vw",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowRequestForm(false)}
              style={{
                position: "absolute", top: 12, left: 12,
                background: "none", border: "none", color: "rgba(240,240,245,0.5)",
                fontSize: 20, cursor: "pointer", lineHeight: 1,
              }}
            >×</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, textAlign: "center" }}>
              רוצה מקרה בוחן מותאם?
            </h2>
            <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", marginBottom: 28, textAlign: "center" }}>
              ספר לנו על הצורך שלך ונבנה מקרה בוחן רלוונטי
            </p>

            {submitted ? (
              <div style={{
                padding: "20px", borderRadius: 4,
                background: "rgba(0,200,100,0.08)",
                border: "1px solid rgba(0,200,100,0.2)",
                textAlign: "center", color: "rgba(100,255,180,1)",
                fontSize: 14, fontWeight: 500,
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
        </div>
      )}

    </div>
  );
}
