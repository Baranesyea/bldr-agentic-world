"use client";

import React, { useState, useEffect } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface ErrorItem {
  id: string;
  user_email?: string;
  user_name?: string;
  userEmail?: string;
  userName?: string;
  message: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  userAgent?: string;
  resolved: boolean;
  created_at?: string;
  createdAt?: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "עכשיו";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

function formatError(e: ErrorItem): string {
  const email = e.user_email || e.userEmail || "";
  const name = e.user_name || e.userName || "";
  const date = e.created_at || e.createdAt || "";
  let text = `שגיאה: ${e.message}`;
  if (name) text += `\nמשתמש: ${name}`;
  if (email) text += `\nמייל: ${email}`;
  if (e.url) text += `\nURL: ${e.url}`;
  if (date) text += `\nזמן: ${new Date(date).toLocaleString("he-IL")}`;
  if (e.stack) text += `\n\nStack:\n${e.stack}`;
  return text;
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client-errors")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setErrors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string, resolved: boolean) => {
    await fetch("/api/client-errors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
    });
    setErrors((prev) => prev.map((e) => e.id === id ? { ...e, resolved } : e));
  };

  const handleBulkResolve = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) =>
      fetch("/api/client-errors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: true }),
      })
    ));
    setErrors((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, resolved: true } : e));
    setSelected(new Set());
  };

  const handleCopy = (e: ErrorItem) => {
    navigator.clipboard.writeText(formatError(e)).then(() => {
      setCopiedId(e.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const filtered = errors.filter((e) => {
    if (filter === "open") return !e.resolved;
    if (filter === "resolved") return e.resolved;
    return true;
  });

  const openCount = errors.filter((e) => !e.resolved).length;

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f5", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            שגיאות קליינט
            {openCount > 0 && (
              <span style={{
                background: "#FF3D00", color: "white", fontSize: 12, fontWeight: 700,
                padding: "2px 8px", borderRadius: 10,
              }}>{openCount}</span>
            )}
          </h1>
          <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 13, marginTop: 4 }}>
            שגיאות שמשתמשים נתקלו בהן בזמן אמת
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["open", "all", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(new Set()); }}
              style={{
                padding: "6px 14px", borderRadius: 4, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: filter === f ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)",
                color: filter === f ? "#5555FF" : "rgba(240,240,245,0.6)",
              }}
            >
              {f === "open" ? "פתוחות" : f === "all" ? "הכל" : "טופלו"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "rgba(240,240,245,0.6)" }}>
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              style={{ accentColor: "#0000FF", width: 15, height: 15, cursor: "pointer" }}
            />
            בחר הכל ({filtered.length})
          </label>
          {selected.size > 0 && (
            <button
              onClick={handleBulkResolve}
              style={{
                background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)",
                color: "#00C853", padding: "5px 14px", borderRadius: 4,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              סמן {selected.size} כטופל ✓
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.5)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 15 }}>{filter === "open" ? "אין שגיאות פתוחות" : "אין שגיאות"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((e) => {
            const expanded = expandedId === e.id;
            const email = e.user_email || e.userEmail || "";
            const name = e.user_name || e.userName || "";
            const date = e.created_at || e.createdAt || "";
            const agent = e.user_agent || e.userAgent || "";
            const isSelected = selected.has(e.id);

            return (
              <div
                key={e.id}
                style={{
                  background: isSelected ? "rgba(0,0,255,0.04)" : "#0a0a1a",
                  border: `1px solid ${isSelected ? "rgba(0,0,255,0.2)" : e.resolved ? "rgba(0,200,83,0.15)" : "rgba(255,59,48,0.15)"}`,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(e.id)}
                    style={{ accentColor: "#0000FF", width: 15, height: 15, cursor: "pointer", marginTop: 2, flexShrink: 0 }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => setExpandedId(expanded ? null : e.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: e.resolved ? "#00C853" : "#FF3D00",
                      }} />
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: "#f0f0f5", flex: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontFamily: "monospace", direction: "ltr", textAlign: "left",
                      }}>
                        {e.message}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(240,240,245,0.4)", flexShrink: 0 }}>
                        {timeAgo(date)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(240,240,245,0.5)" }}>
                      {name && <span>{name}</span>}
                      {email && <span>{email}</span>}
                      {e.url && <span style={{ direction: "ltr" }}>{(() => { try { return new URL(e.url, "https://app.bldr.co.il").pathname; } catch { return e.url; } })()}</span>}
                    </div>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); handleCopy(e); }}
                    title="העתק"
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0,
                      color: copiedId === e.id ? "#00C853" : "rgba(240,240,245,0.3)",
                      transition: "color 0.2s",
                    }}
                  >
                    {copiedId === e.id ? <CheckIcon size={14} color="#00C853" /> : <CopyIcon size={14} />}
                  </button>
                </div>

                {expanded && (
                  <div style={{ padding: "0 18px 18px", paddingRight: "58px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {e.stack && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,240,245,0.5)", marginBottom: 6 }}>Stack Trace</div>
                        <pre style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 4, padding: 12, fontSize: 11,
                          color: "rgba(240,240,245,0.6)", overflow: "auto",
                          maxHeight: 300, whiteSpace: "pre-wrap", wordBreak: "break-all",
                          direction: "ltr", textAlign: "left", margin: 0,
                        }}>
                          {e.stack}
                        </pre>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, fontSize: 12 }}>
                      {e.url && (
                        <div style={{ color: "rgba(240,240,245,0.5)" }}>
                          <strong style={{ color: "rgba(240,240,245,0.7)" }}>URL:</strong>{" "}
                          <span style={{ direction: "ltr", display: "inline" }}>{e.url}</span>
                        </div>
                      )}
                      {agent && (
                        <div style={{ color: "rgba(240,240,245,0.5)" }}>
                          <strong style={{ color: "rgba(240,240,245,0.7)" }}>דפדפן:</strong>{" "}
                          <span style={{ direction: "ltr", display: "inline", fontSize: 11 }}>{agent}</span>
                        </div>
                      )}
                      {date && (
                        <div style={{ color: "rgba(240,240,245,0.5)" }}>
                          <strong style={{ color: "rgba(240,240,245,0.7)" }}>זמן:</strong>{" "}
                          {new Date(date).toLocaleString("he-IL")}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleResolve(e.id, !e.resolved)}
                        style={{
                          background: e.resolved ? "rgba(255,179,0,0.1)" : "rgba(0,200,83,0.1)",
                          border: `1px solid ${e.resolved ? "rgba(255,179,0,0.3)" : "rgba(0,200,83,0.3)"}`,
                          color: e.resolved ? "#FFB300" : "#00C853",
                          padding: "6px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {e.resolved ? "פתח מחדש" : "סמן כטופל ✓"}
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
