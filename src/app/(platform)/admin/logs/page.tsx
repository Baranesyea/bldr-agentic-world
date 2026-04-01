"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPromptLogs, seedSampleLogs, PromptLogEntry } from "@/lib/prompt-logger";
import { CopyIcon, SearchIcon, ChevronDownIcon } from "@/components/ui/icons";

type DateRange = "today" | "week" | "month" | "all";
type TypeFilter = "all" | "avatar" | "thumbnail" | "other";
type StatusFilter = "all" | "success" | "error" | "fallback";

const TYPE_LABELS: Record<string, string> = {
  all: "הכל",
  avatar: "אווטאר",
  thumbnail: "תמונה ממוזערת",
  other: "אחר",
};

const STATUS_LABELS: Record<string, string> = {
  all: "הכל",
  success: "הצלחה",
  error: "שגיאה",
  fallback: "fallback",
};

const DATE_LABELS: Record<string, string> = {
  today: "היום",
  week: "השבוע",
  month: "החודש",
  all: "הכל",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  avatar: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
  thumbnail: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  other: { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  success: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", glow: "0 0 8px rgba(34,197,94,0.3)" },
  error: { bg: "rgba(239,68,68,0.12)", text: "#f87171", glow: "0 0 8px rgba(239,68,68,0.3)" },
  fallback: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", glow: "0 0 8px rgba(245,158,11,0.3)" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function isImageUrl(s: string): boolean {
  return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|svg)/i.test(s.trim());
}

function isInDateRange(iso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date("2026-03-15T23:59:59.000Z");
  if (range === "today") {
    return d.toDateString() === now.toDateString();
  }
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }
  if (range === "month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

function Badge({ children, bg, color, glow }: { children: React.ReactNode; bg: string; color: string; glow?: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 600,
      background: bg,
      color,
      boxShadow: glow || "none",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Record<string, string> }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          color: "#f0f0f5",
          padding: "8px 32px 8px 12px",
          fontSize: "13px",
          cursor: "pointer",
          outline: "none",
          minWidth: "120px",
        }}
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k} style={{ background: "#1a1a2e" }}>{v}</option>
        ))}
      </select>
      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(240,240,245,0.7)" }}>
        <ChevronDownIcon size={14} />
      </span>
    </div>
  );
}

export default function PromptLogsPage() {
  const [logs, setLogs] = useState<PromptLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    seedSampleLogs();
    setLogs(getPromptLogs());
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!isInDateRange(l.timestamp, dateRange)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.userName.toLowerCase().includes(q) && !l.prompt.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, typeFilter, statusFilter, dateRange]);

  const stats = useMemo(() => ({
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    error: logs.filter((l) => l.status === "error").length,
    fallback: logs.filter((l) => l.status === "fallback").length,
  }), [logs]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const statCards: { label: string; value: number; color: string }[] = [
    { label: "סה״כ פרומפטים", value: stats.total, color: "#60a5fa" },
    { label: "הצלחות", value: stats.success, color: "#4ade80" },
    { label: "שגיאות", value: stats.error, color: "#f87171" },
    { label: "fallback", value: stats.fallback, color: "#fbbf24" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
        לוג פרומפטים
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "24px", fontSize: "14px" }}>
        כל הפרומפטים שיצאו מהמערכת ומה חזר
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "16px 20px",
          }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "320px" }}>
          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,245,0.7)", pointerEvents: "none" }}>
            <SearchIcon size={15} />
          </span>
          <input
            type="text"
            placeholder="חיפוש לפי שם משתמש או טקסט..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              color: "#f0f0f5",
              padding: "8px 36px 8px 12px",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
        <Select value={typeFilter} onChange={(v) => setTypeFilter(v as TypeFilter)} options={TYPE_LABELS} />
        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} options={STATUS_LABELS} />
        <Select value={dateRange} onChange={(v) => setDateRange(v as DateRange)} options={DATE_LABELS} />
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "140px 90px 80px 130px 1fr 1fr 70px 120px",
          gap: "8px",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: "11px",
          fontWeight: 600,
          color: "rgba(240,240,245,0.7)",
        }}>
          <span>זמן</span>
          <span>סוג</span>
          <span>סטטוס</span>
          <span>משתמש</span>
          <span>פרומפט</span>
          <span>תגובה</span>
          <span>זמן (ms)</span>
          <span>ספק API</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(240,240,245,0.7)", fontSize: "14px" }}>
            אין תוצאות
          </div>
        )}

        {filtered.map((entry, i) => {
          const expanded = expandedId === entry.id;
          const tc = TYPE_COLORS[entry.type];
          const sc = STATUS_COLORS[entry.status];
          const rowBg = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";

          return (
            <div key={entry.id}>
              <div
                onClick={() => setExpandedId(expanded ? null : entry.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 90px 80px 130px 1fr 1fr 70px 120px",
                  gap: "8px",
                  padding: "12px 16px",
                  background: expanded ? "rgba(0,0,255,0.04)" : rowBg,
                  borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "rgba(240,240,245,0.8)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = rowBg; }}
              >
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
                  <div>{formatDate(entry.timestamp)}</div>
                  <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)" }}>{formatTime(entry.timestamp)}</div>
                </span>
                <span><Badge bg={tc.bg} color={tc.text}>{TYPE_LABELS[entry.type]}</Badge></span>
                <span><Badge bg={sc.bg} color={sc.text} glow={sc.glow}>{STATUS_LABELS[entry.status]}</Badge></span>
                <span>
                  <div style={{ fontSize: "12px" }}>{entry.userName}</div>
                  <div style={{ fontSize: "10px", color: "rgba(240,240,245,0.7)" }}>{entry.userEmail}</div>
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
                  {entry.prompt}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {isImageUrl(entry.response) ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.response} alt="" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover", background: "rgba(255,255,255,0.05)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span style={{ color: "rgba(240,240,245,0.7)" }}>תמונה</span>
                    </>
                  ) : (
                    <span style={{ color: entry.status === "error" ? "#f87171" : "rgba(240,240,245,0.5)" }}>{entry.response}</span>
                  )}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", fontFamily: "monospace" }}>{entry.duration.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)" }}>{entry.apiProvider}</span>
              </div>

              {/* Expanded view */}
              {expanded && (
                <div style={{
                  padding: "16px 24px 20px",
                  background: "rgba(0,0,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Prompt */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(240,240,245,0.7)" }}>פרומפט</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(entry.prompt, "prompt-" + entry.id); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px", padding: "4px 8px", cursor: "pointer",
                            color: copied === "prompt-" + entry.id ? "#4ade80" : "rgba(240,240,245,0.5)",
                            fontSize: "11px",
                          }}
                        >
                          <CopyIcon size={12} />
                          {copied === "prompt-" + entry.id ? "הועתק!" : "העתק"}
                        </button>
                      </div>
                      <pre style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                        padding: "14px",
                        color: "rgba(240,240,245,0.8)",
                        fontSize: "12px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        fontFamily: "monospace",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}>
                        {entry.prompt}
                      </pre>
                    </div>

                    {/* Response */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(240,240,245,0.7)" }}>תגובה</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(entry.response, "response-" + entry.id); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px", padding: "4px 8px", cursor: "pointer",
                            color: copied === "response-" + entry.id ? "#4ade80" : "rgba(240,240,245,0.5)",
                            fontSize: "11px",
                          }}
                        >
                          <CopyIcon size={12} />
                          {copied === "response-" + entry.id ? "הועתק!" : "העתק"}
                        </button>
                      </div>
                      {isImageUrl(entry.response) ? (
                        <div style={{
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px",
                          padding: "14px",
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entry.response}
                            alt="response preview"
                            style={{ width: "60px", height: "60px", borderRadius: "6px", objectFit: "cover", background: "rgba(255,255,255,0.05)", marginBottom: "8px" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)", wordBreak: "break-all", fontFamily: "monospace" }}>{entry.response}</div>
                        </div>
                      ) : (
                        <pre style={{
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px",
                          padding: "14px",
                          color: entry.status === "error" ? "#f87171" : "rgba(240,240,245,0.8)",
                          fontSize: "12px",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                          fontFamily: "monospace",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}>
                          {entry.response}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
