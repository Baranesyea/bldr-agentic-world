"use client";

import React, { useEffect, useState, useMemo } from "react";

interface CancellationRequest {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  priceAmount: number | null;
  billingCycle: string | null;
  subscriptionStartedAt: string | null;
  cancellationRequestedAt: string;
  cancellationEffectiveAt: string | null;
}

type Filter = "all" | "today" | "week";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isToday(d: string): boolean {
  const target = new Date(d);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

function isThisWeek(d: string): boolean {
  const target = new Date(d).getTime();
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return now - target <= weekMs;
}

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/cancellation-requests")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.requests)) setRequests(d.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "today") return requests.filter((r) => isToday(r.cancellationRequestedAt));
    if (filter === "week") return requests.filter((r) => isThisWeek(r.cancellationRequestedAt));
    return requests;
  }, [requests, filter]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 4,
    border: active ? "1px solid rgba(51,51,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(51,51,255,0.12)" : "rgba(255,255,255,0.03)",
    color: active ? "#8888ff" : "#aaa",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto", direction: "rtl" }}>
      <h1 style={{ fontSize: 28, color: "#fff", margin: "0 0 8px" }}>בקשות לביטול</h1>
      <p style={{ color: "#aaa", marginBottom: 24 }}>
        משתמשים שביקשו לבטל מנוי. מיון לפי הקרוב לרחוק.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(filter === "all")} onClick={() => setFilter("all")}>
          הכל ({requests.length})
        </button>
        <button style={tabStyle(filter === "today")} onClick={() => setFilter("today")}>
          היום ({requests.filter((r) => isToday(r.cancellationRequestedAt)).length})
        </button>
        <button style={tabStyle(filter === "week")} onClick={() => setFilter("week")}>
          השבוע ({requests.filter((r) => isThisWeek(r.cancellationRequestedAt)).length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#888" }}>טוען...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#888" }}>אין בקשות בטווח הזה.</p>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>שם</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>מייל</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>טלפון</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>סכום</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>מתי התחיל</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>מתי ביקש לבטל</th>
                <th style={{ padding: "12px 16px", textAlign: "start", color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>סיום גישה</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "12px 16px", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.fullName}</td>
                  <td style={{ padding: "12px 16px", color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.04)", direction: "ltr", textAlign: "start" }}>{r.email}</td>
                  <td style={{ padding: "12px 16px", color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.04)", direction: "ltr", textAlign: "start" }}>{r.phone ?? "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.priceAmount ?? 0} ₪</td>
                  <td style={{ padding: "12px 16px", color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{formatDate(r.subscriptionStartedAt)}</td>
                  <td style={{ padding: "12px 16px", color: "#fca5a5", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{formatDate(r.cancellationRequestedAt)}</td>
                  <td style={{ padding: "12px 16px", color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{formatDate(r.cancellationEffectiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
