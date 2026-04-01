"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

const SEED_CASE_STUDIES: CaseStudy[] = [
  { id: "cs1", title: "בניית מערכת CRM מותאמת אישית", description: "איך בנינו CRM מותאם לסוכנות נדל\u05F4ן עם אוטומציות מלאות", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["CRM", "נדל\"ן", "אוטומציה"], createdAt: new Date().toISOString() },
  { id: "cs2", title: "אוטומציית תהליכי גיוס עובדים", description: "חיסכנו 80% מזמן הגיוס עם מערכת אוטומטית", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["HR", "גיוס", "אוטומציה"], createdAt: new Date().toISOString() },
  { id: "cs3", title: "צ'אטבוט שירות לקוחות חכם", description: "בוט AI שמטפל ב-70% מהפניות בלי התערבות אנושית", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["AI", "שירות", "צ'אטבוט"], createdAt: new Date().toISOString() },
  { id: "cs4", title: "מערכת ניהול מלאי עם AI", description: "חיזוי מלאי חכם שהפחית פחת ב-40%", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["AI", "מלאי", "לוגיסטיקה"], createdAt: new Date().toISOString() },
  { id: "cs5", title: "אוטומציית שיווק ומדיה חברתית", description: "מערכת שמנהלת תוכן, מפרסמת ומנתחת בצורה אוטומטית", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["שיווק", "סושיאל", "אוטומציה"], createdAt: new Date().toISOString() },
  { id: "cs6", title: "דשבורד BI אינטראקטיבי", description: "דשבורד נתונים בזמן אמת שמציג KPIs קריטיים", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", tags: ["BI", "נתונים", "דשבורד"], createdAt: new Date().toISOString() },
];

const CS_KEY = "bldr_case_studies";
const REQ_KEY = "bldr_case_study_requests";

const statusMap: Record<string, { bg: string; color: string; border: string; label: string }> = {
  new: { bg: "rgba(0,100,255,0.12)", color: "rgba(100,160,255,1)", border: "rgba(0,100,255,0.2)", label: "חדש" },
  in_progress: { bg: "rgba(255,179,0,0.12)", color: "#FFB300", border: "rgba(255,179,0,0.2)", label: "בטיפול" },
  done: { bg: "rgba(0,200,100,0.12)", color: "rgba(100,255,180,1)", border: "rgba(0,200,100,0.2)", label: "הושלם" },
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

const tagPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  background: "rgba(0,0,255,0.12)",
  color: "rgba(140,140,255,1)",
  border: "1px solid rgba(0,0,255,0.2)",
};

const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  padding: 20,
};

const smallBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(240,240,245,0.7)",
};

export default function AdminCaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [requests, setRequests] = useState<CaseStudyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formVideo, setFormVideo] = useState("");
  const [formTagInput, setFormTagInput] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CS_KEY);
      if (stored) {
        setCaseStudies(JSON.parse(stored));
      } else {
        setCaseStudies(SEED_CASE_STUDIES);
        localStorage.setItem(CS_KEY, JSON.stringify(SEED_CASE_STUDIES));
      }
    } catch {}
    try {
      const stored = localStorage.getItem(REQ_KEY);
      if (stored) setRequests(JSON.parse(stored));
    } catch {}
  }, []);

  const saveCS = (list: CaseStudy[]) => {
    setCaseStudies(list);
    localStorage.setItem(CS_KEY, JSON.stringify(list));
  };

  const saveReq = (list: CaseStudyRequest[]) => {
    setRequests(list);
    localStorage.setItem(REQ_KEY, JSON.stringify(list));
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormVideo("");
    setFormTagInput("");
    setFormTags([]);
    setShowForm(false);
    setEditId(null);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && formTagInput.trim()) {
      e.preventDefault();
      const tag = formTagInput.trim().replace(/,/g, "");
      if (tag && !formTags.includes(tag)) {
        setFormTags([...formTags, tag]);
      }
      setFormTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formDesc.trim()) return;
    if (editId) {
      saveCS(caseStudies.map((cs) =>
        cs.id === editId
          ? { ...cs, title: formTitle.trim(), description: formDesc.trim(), videoUrl: formVideo.trim(), tags: formTags }
          : cs
      ));
    } else {
      const newCS: CaseStudy = {
        id: crypto.randomUUID(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        videoUrl: formVideo.trim(),
        tags: formTags,
        createdAt: new Date().toISOString(),
      };
      saveCS([...caseStudies, newCS]);
    }
    resetForm();
  };

  const startEdit = (cs: CaseStudy) => {
    setEditId(cs.id);
    setFormTitle(cs.title);
    setFormDesc(cs.description);
    setFormVideo(cs.videoUrl);
    setFormTags([...cs.tags]);
    setShowForm(true);
  };

  const deleteCS = (id: string) => {
    if (!confirm("למחוק את מקרה הבוחן?")) return;
    saveCS(caseStudies.filter((cs) => cs.id !== id));
  };

  const moveCS = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= caseStudies.length) return;
    const arr = [...caseStudies];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    saveCS(arr);
  };

  const updateStatus = (id: string, status: CaseStudyRequest["status"]) => {
    saveReq(requests.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteRequest = (id: string) => {
    if (!confirm("למחוק את הבקשה?")) return;
    saveReq(requests.filter((r) => r.id !== id));
  };

  const renderForm = () => (
    <div style={{ ...cardS, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
        {editId ? "עריכת מקרה בוחן" : "מקרה בוחן חדש"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, fontWeight: 500 }}>כותרת</label>
          <input style={inputS} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="כותרת מקרה הבוחן" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, fontWeight: 500 }}>תיאור</label>
          <textarea style={{ ...inputS, minHeight: 80, resize: "vertical" }} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="תיאור קצר של מקרה הבוחן" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, fontWeight: 500 }}>כתובת וידאו</label>
          <input style={inputS} value={formVideo} onChange={(e) => setFormVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, fontWeight: 500 }}>תגיות</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: formTags.length > 0 ? 8 : 0 }}>
            {formTags.map((tag) => (
              <span key={tag} style={tagPill}>
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  style={{ background: "none", border: "none", color: "rgba(140,140,255,0.8)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, fontFamily: "inherit" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            style={inputS}
            value={formTagInput}
            onChange={(e) => setFormTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="הקלד תגית ולחץ Enter"
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 24px",
              borderRadius: 4,
              border: "none",
              background: "#0000FF",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: formTitle.trim() && formDesc.trim() ? 1 : 0.4,
            }}
            disabled={!formTitle.trim() || !formDesc.trim()}
          >
            שמור
          </button>
          <button onClick={resetForm} style={{ ...smallBtn, padding: "10px 20px" }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", textDecoration: "none" }}>
          ניהול
        </Link>
        <span style={{ color: "rgba(240,240,245,0.7)", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,245,0.7)" }}>מקרי בוחן</span>
      </div>

      {/* Section A: Manage Case Studies */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>ניהול מקרי בוחן</h1>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              style={{
                padding: "10px 22px",
                borderRadius: 4,
                border: "none",
                background: "#0000FF",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + הוסף מקרה בוחן
            </button>
          )}
        </div>

        {showForm && renderForm()}

        {caseStudies.length === 0 ? (
          <div style={{ ...cardS, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📂</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>אין מקרי בוחן</h2>
            <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)" }}>הוסף את מקרה הבוחן הראשון</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {caseStudies.map((cs, i) => (
              <div key={cs.id} style={{ ...cardS, display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Reorder buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, paddingTop: 4 }}>
                  <button
                    onClick={() => moveCS(i, -1)}
                    disabled={i === 0}
                    style={{ ...smallBtn, padding: "4px 8px", fontSize: 14, opacity: i === 0 ? 0.3 : 1 }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveCS(i, 1)}
                    disabled={i === caseStudies.length - 1}
                    style={{ ...smallBtn, padding: "4px 8px", fontSize: 14, opacity: i === caseStudies.length - 1 ? 0.3 : 1 }}
                  >
                    ▼
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{cs.title}</h3>
                  <p style={{
                    fontSize: 13,
                    color: "rgba(240,240,245,0.7)",
                    lineHeight: 1.5,
                    marginBottom: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {cs.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {cs.tags.map((tag) => (
                      <span key={tag} style={tagPill}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "rgba(240,240,245,0.7)" }}>
                    <span>{cs.videoUrl}</span>
                    <span>{new Date(cs.createdAt).toLocaleDateString("he-IL")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => startEdit(cs)} style={smallBtn}>ערוך</button>
                  <button
                    onClick={() => deleteCS(cs.id)}
                    style={{
                      ...smallBtn,
                      border: "1px solid rgba(255,60,60,0.2)",
                      background: "rgba(255,60,60,0.06)",
                      color: "rgba(255,120,120,0.8)",
                    }}
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 48 }} />

      {/* Section B: Requests */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>בקשות למקרי בוחן</h2>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)", marginBottom: 20 }}>
          בקשות שהתקבלו מהטופס בעמוד מקרי הבוחן
        </p>

        {requests.length === 0 ? (
          <div style={{ ...cardS, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>אין בקשות עדיין</h3>
            <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)" }}>
              בקשות חדשות יופיעו כאן כשמשתמשים ישלחו דרך טופס מקרי הבוחן
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((req) => {
              const st = statusMap[req.status] || statusMap.new;
              return (
                <div key={req.id} style={{ ...cardS, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{req.name}</span>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 4 }}>{req.email}</p>
                    <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)", lineHeight: 1.6, marginBottom: 8 }}>{req.description}</p>
                    <span style={{ fontSize: 11, color: "rgba(240,240,245,0.7)" }}>
                      {new Date(req.createdAt).toLocaleDateString("he-IL")} {new Date(req.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value as CaseStudyRequest["status"])}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#fff",
                        fontSize: 13,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        outline: "none",
                        appearance: "none" as const,
                      }}
                    >
                      <option value="new">חדש</option>
                      <option value="in_progress">בטיפול</option>
                      <option value="done">הושלם</option>
                    </select>
                    <button
                      onClick={() => deleteRequest(req.id)}
                      style={{
                        ...smallBtn,
                        border: "1px solid rgba(255,60,60,0.2)",
                        background: "rgba(255,60,60,0.06)",
                        color: "rgba(255,120,120,0.8)",
                      }}
                    >
                      מחק
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
