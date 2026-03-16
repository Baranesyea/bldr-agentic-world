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
  userName?: string;
  userEmail?: string;
}

const categoryColors: Record<string, string> = {
  "באג": "#FF3D00",
  "הצעה לשיפור": "#0000FF",
  "בעיה כללית": "#FFB300",
  "אחר": "rgba(255,255,255,0.2)",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "חדש", color: "#2979FF" },
  read: { label: "נקרא", color: "#FFB300" },
  resolved: { label: "טופל", color: "#00C853" },
};

function MoodFaceSmall({ type }: { type: number }) {
  const c = "rgba(240,240,245,0.5)";
  return (
    <svg width={20} height={20} viewBox="0 0 36 36" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="18" cy="18" r="14" />
      <circle cx="13" cy="15" r="1.2" fill={c} stroke="none" />
      <circle cx="23" cy="15" r="1.2" fill={c} stroke="none" />
      {type === 0 && <path d="M12 23 Q18 28 24 23" />}
      {type === 1 && <line x1="12" y1="23" x2="24" y2="23" />}
      {type === 2 && <path d="M12 25 Q18 20 24 25" />}
    </svg>
  );
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("הכל");
  const [filterStatus, setFilterStatus] = useState("הכל");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("bldr_feedback") || "[]") as FeedbackItem[];
    setItems(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const save = (updated: FeedbackItem[]) => {
    setItems(updated);
    localStorage.setItem("bldr_feedback", JSON.stringify(updated));
  };

  const updateStatus = (id: string, status: "new" | "read" | "resolved") => {
    save(items.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const deleteItem = (id: string) => {
    save(items.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const filtered = items.filter((i) => {
    if (filterCategory !== "הכל" && i.category !== filterCategory) return false;
    if (filterStatus !== "הכל") {
      const statusMap: Record<string, string> = { "חדש": "new", "נקרא": "read", "טופל": "resolved" };
      if (i.status !== statusMap[filterStatus]) return false;
    }
    return true;
  });

  const totalNew = items.filter((i) => i.status === "new").length;
  const byCat = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  const selectStyle: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    direction: "rtl",
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto", direction: "rtl" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        פידבקים
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: 28, fontSize: 14 }}>
        כל הפידבקים שהתקבלו מהמשתמשים.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
          padding: "14px 20px",
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{items.length}</div>
          <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)" }}>סה״כ</div>
        </div>
        <div style={{
          background: "rgba(41,121,255,0.08)",
          border: "1px solid rgba(41,121,255,0.2)",
          borderRadius: 4,
          padding: "14px 20px",
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2979FF" }}>{totalNew}</div>
          <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)" }}>חדשים</div>
        </div>
        {Object.entries(byCat).map(([cat, count]) => (
          <div key={cat} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4,
            padding: "14px 20px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: categoryColors[cat] || "#fff" }}>{count}</div>
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)" }}>{cat}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
          <option value="הכל" style={{ background: "#1a1a2e" }}>קטגוריה: הכל</option>
          {["באג", "הצעה לשיפור", "בעיה כללית", "אחר"].map((c) => (
            <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          {["הכל", "חדש", "נקרא", "טופל"].map((s) => (
            <option key={s} value={s} style={{ background: "#1a1a2e" }}>{s === "הכל" ? "סטטוס: הכל" : s}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(240,240,245,0.4)", fontSize: 14 }}>
          אין פידבקים להצגה
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            const sc = statusConfig[item.status];
            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  padding: 20,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => setExpandedId(expanded ? null : item.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Category badge */}
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: (categoryColors[item.category] || "rgba(255,255,255,0.2)") + "22",
                    color: categoryColors[item.category] || "rgba(255,255,255,0.6)",
                    border: `1px solid ${(categoryColors[item.category] || "rgba(255,255,255,0.2)")}44`,
                  }}>
                    {item.category}
                  </span>
                  {/* Status badge */}
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: sc.color + "18",
                    color: sc.color,
                    border: `1px solid ${sc.color}33`,
                  }}>
                    {sc.label}
                  </span>
                  {item.mood !== null && (
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <MoodFaceSmall type={item.mood} />
                    </span>
                  )}
                  {/* User info */}
                  {item.userName && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: 12, color: "rgba(240,240,245,0.6)", fontWeight: 500 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {item.userName}
                    </span>
                  )}
                  {item.userEmail && (
                    <a href={`mailto:${item.userEmail}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: "#3333FF", textDecoration: "none" }}>
                      {item.userEmail}
                    </a>
                  )}
                  <span style={{ marginRight: "auto", fontSize: 12, color: "rgba(240,240,245,0.35)" }}>
                    {new Date(item.createdAt).toLocaleDateString("he-IL")} {new Date(item.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p style={{
                  color: "rgba(240,240,245,0.8)",
                  fontSize: 14,
                  marginTop: 12,
                  lineHeight: 1.6,
                  overflow: expanded ? "visible" : "hidden",
                  display: expanded ? "block" : "-webkit-box",
                  WebkitLineClamp: expanded ? undefined : 2,
                  WebkitBoxOrient: "vertical" as const,
                }}>
                  {item.content}
                </p>

                {expanded && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {item.userName && (
                        <span style={{ fontSize: 12, color: "rgba(240,240,245,0.6)" }}>משתמש: {item.userName}{item.userEmail ? ` (${item.userEmail})` : ""}</span>
                      )}
                      <span style={{ fontSize: 12, color: "rgba(240,240,245,0.4)" }}>עמוד: {item.page}</span>
                      <select
                        value={item.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(item.id, e.target.value as FeedbackItem["status"]);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...selectStyle, fontSize: 12 }}
                      >
                        <option value="new" style={{ background: "#1a1a2e" }}>חדש</option>
                        <option value="read" style={{ background: "#1a1a2e" }}>נקרא</option>
                        <option value="resolved" style={{ background: "#1a1a2e" }}>טופל</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 4,
                          border: "1px solid rgba(255,59,48,0.3)",
                          background: "rgba(255,59,48,0.1)",
                          color: "#FF3B30",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
