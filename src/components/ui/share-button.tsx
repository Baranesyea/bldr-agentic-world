"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";

export interface ShareLink {
  id: string;
  name: string;
  code: string;
  type: "lesson" | "course" | "case_study";
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  caseStudyId?: string;
  caseStudyTitle?: string;
  videoUrl?: string;
  expiresAt?: string | null;
  createdAt: string;
  uses: number;
  status: "active" | "disabled";
}

interface ShareButtonProps {
  type: "lesson" | "course" | "case_study";
  name: string;
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  caseStudyId?: string;
  caseStudyTitle?: string;
  videoUrl?: string;
}

// Encode all link data into the token so any browser can decode it
function encodeToken(link: Omit<ShareLink, "id" | "code" | "uses" | "status" | "createdAt">): string {
  const json = JSON.stringify(link);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function saveLinks(links: ShareLink[]) {
  try { localStorage.setItem("bldr_share_links", JSON.stringify(links)); } catch {}
}

function loadLinks(): ShareLink[] {
  try {
    const s = localStorage.getItem("bldr_share_links");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function ShareButton(props: ShareButtonProps) {
  const { isAdmin } = useUser();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | "">(0);
  const [showExpiry, setShowExpiry] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const links = loadLinks();
    const existing = links.find(l => {
      if (l.type !== props.type || l.status !== "active") return false;
      if (props.type === "lesson") return l.courseId === props.courseId && l.lessonId === props.lessonId;
      if (props.type === "course") return l.courseId === props.courseId;
      if (props.type === "case_study") return l.caseStudyId === props.caseStudyId;
      return false;
    });
    setLink(existing || null);
  }, [open, props.courseId, props.lessonId, props.caseStudyId, props.type]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!isAdmin) return null;

  const generateLink = () => {
    const expiresAt = expiryDays && Number(expiryDays) > 0
      ? new Date(Date.now() + Number(expiryDays) * 86400000).toISOString()
      : null;

    const payload = {
      name: props.name,
      type: props.type,
      courseId: props.courseId,
      lessonId: props.lessonId,
      lessonTitle: props.lessonTitle,
      courseTitle: props.courseTitle,
      caseStudyId: props.caseStudyId,
      caseStudyTitle: props.caseStudyTitle,
      videoUrl: props.videoUrl,
      expiresAt,
    };

    const code = encodeToken(payload);
    const newLink: ShareLink = {
      id: Date.now().toString(),
      code,
      createdAt: new Date().toISOString(),
      uses: 0,
      status: "active",
      ...payload,
    };
    const links = loadLinks();
    // Remove old active link for same content
    const filtered = links.filter(l => {
      if (l.type !== props.type || l.status !== "active") return true;
      if (props.type === "lesson") return !(l.courseId === props.courseId && l.lessonId === props.lessonId);
      if (props.type === "course") return l.courseId !== props.courseId;
      if (props.type === "case_study") return l.caseStudyId !== props.caseStudyId;
      return true;
    });
    saveLinks([newLink, ...filtered]);
    setLink(newLink);
  };

  const getUrl = (code: string) => `${window.location.origin}/watch/${code}`;

  const copyUrl = () => {
    if (!link) return;
    navigator.clipboard.writeText(getUrl(link.code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeLink = () => {
    if (!link) return;
    saveLinks(loadLinks().map(l => l.id === link.id ? { ...l, status: "disabled" as const } : l));
    setLink(null);
  };

  const isExpired = link?.expiresAt ? new Date(link.expiresAt) < new Date() : false;

  const TYPE_LABELS: Record<string, string> = {
    lesson: "שיעור",
    course: "קורס",
    case_study: "מקרה בוחן",
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title={`שתף ${TYPE_LABELS[props.type]}`}
        style={{
          width: 30, height: 30, borderRadius: "50%", padding: 0,
          border: "1px solid rgba(255,255,255,0.15)",
          background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
          color: "rgba(240,240,245,0.6)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s, border-color 0.2s",
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99998 }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px", zIndex: 99999,
              background: "#0e0e22", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
              direction: "rtl",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(240,240,245,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              קישור שיתוף — {TYPE_LABELS[props.type]}
            </p>
            <p style={{ fontSize: "13px", color: "#fff", fontWeight: 600, marginBottom: "14px" }}>
              {props.name}
            </p>

            {link && !isExpired ? (
              <>
                <div style={{
                  display: "flex", gap: "6px", alignItems: "center",
                  background: "rgba(255,255,255,0.04)", borderRadius: "4px",
                  padding: "8px 10px", marginBottom: "10px",
                }}>
                  <span style={{ flex: 1, fontSize: "11px", color: "rgba(240,240,245,0.6)", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {getUrl(link.code)}
                  </span>
                  <button onClick={copyUrl} style={{
                    padding: "4px 10px", borderRadius: "4px", border: "none",
                    background: copied ? "rgba(34,197,94,0.2)" : "rgba(0,0,255,0.2)",
                    color: copied ? "#22c55e" : "#7777ff",
                    fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0,
                  }}>
                    {copied ? "✓ הועתק" : "העתק"}
                  </button>
                </div>

                <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "10px" }}>
                  שימושים: {link.uses}
                  {link.expiresAt && (
                    <span style={{ marginRight: "8px" }}>
                      · פג תוקף: {new Date(link.expiresAt).toLocaleDateString("he-IL")}
                    </span>
                  )}
                </div>

                <button onClick={revokeLink} style={{
                  width: "100%", padding: "6px", borderRadius: "4px",
                  border: "1px solid rgba(239,68,68,0.2)",
                  background: "rgba(239,68,68,0.06)", color: "#ef4444",
                  fontSize: "11px", cursor: "pointer",
                }}>
                  בטל קישור
                </button>
              </>
            ) : (
              <>
                {isExpired && (
                  <p style={{ fontSize: "11px", color: "#fb923c", marginBottom: "10px" }}>
                    ⚠️ הקישור פג תוקף
                  </p>
                )}

                <button
                  onClick={() => setShowExpiry(!showExpiry)}
                  style={{
                    fontSize: "11px", color: "rgba(240,240,245,0.4)", background: "none",
                    border: "none", cursor: "pointer", marginBottom: "6px", padding: 0,
                  }}
                >
                  {showExpiry ? "▼" : "▶"} הגדר תאריך תפוגה (אופציונלי)
                </button>

                {showExpiry && (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "10px" }}>
                    <input
                      type="number"
                      value={expiryDays}
                      onChange={e => setExpiryDays(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="ימים"
                      min={1}
                      style={{
                        width: "70px", padding: "6px 8px", borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "12px", outline: "none",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.4)" }}>
                      {expiryDays ? `(פג ב-${new Date(Date.now() + Number(expiryDays) * 86400000).toLocaleDateString("he-IL")})` : "ללא הגבלה"}
                    </span>
                  </div>
                )}

                <button onClick={generateLink} style={{
                  width: "100%", padding: "10px", borderRadius: "4px", border: "none",
                  background: "#0000FF", color: "#fff", fontSize: "13px", fontWeight: 700,
                  cursor: "pointer",
                }}>
                  צור קישור שיתוף
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
