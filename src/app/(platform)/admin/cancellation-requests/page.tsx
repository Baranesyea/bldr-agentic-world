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
  cancellationCompletedAt: string | null;
}

type Tab = "requested" | "completed";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("requested");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/cancellation-requests");
    const d = await r.json();
    if (Array.isArray(d.requests)) setRequests(d.requests);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const requested = useMemo(() => requests.filter((r) => !r.cancellationCompletedAt), [requests]);
  const completed = useMemo(() => requests.filter((r) => !!r.cancellationCompletedAt), [requests]);

  const visible = tab === "requested" ? requested : completed;

  async function move(id: string, action: "complete" | "uncomplete") {
    setBusyId(id);
    try {
      const res = await fetch("/api/cancellation-requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 18px",
    borderRadius: 4,
    border: active ? "1px solid rgba(51,51,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(51,51,255,0.12)" : "rgba(255,255,255,0.03)",
    color: active ? "#8888ff" : "#aaa",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  });

  const cellStyle: React.CSSProperties = {
    padding: "12px 16px",
    color: "#ccc",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
      <h1 style={{ fontSize: 28, color: "#fff", margin: "0 0 8px" }}>בקשות לביטול</h1>
      <p style={{ color: "#aaa", marginBottom: 24 }}>
        כשמשתמש מבקש לבטל הוא מופיע כאן. אחרי שביצעת את הביטול בפועל במערכת התשלומים — העבר אותו לטאב &quot;בוטלו&quot; כדי לסמן ולשלוח לו הודעת וואצאפ.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(tab === "requested")} onClick={() => setTab("requested")}>
          ביקשו לבטל ({requested.length})
        </button>
        <button style={tabStyle(tab === "completed")} onClick={() => setTab("completed")}>
          בוטלו ({completed.length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#888" }}>טוען...</p>
      ) : visible.length === 0 ? (
        <p style={{ color: "#888" }}>אין בקשות בטאב הזה.</p>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>שם</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>מייל</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>טלפון</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>סכום</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>הצטרף</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>ביקש לבטל</th>
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>סיום גישה</th>
                {tab === "completed" && (
                  <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>בוטל בפועל</th>
                )}
                <th style={{ ...cellStyle, color: "#888", textAlign: "start" }}>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...cellStyle, color: "#fff" }}>{r.fullName}</td>
                  <td style={{ ...cellStyle, direction: "ltr", textAlign: "start" }}>{r.email}</td>
                  <td style={{ ...cellStyle, direction: "ltr", textAlign: "start" }}>{r.phone ?? "—"}</td>
                  <td style={cellStyle}>{r.priceAmount ?? 0} ₪</td>
                  <td style={cellStyle}>{formatDate(r.subscriptionStartedAt)}</td>
                  <td style={{ ...cellStyle, color: "#fca5a5" }}>{formatDate(r.cancellationRequestedAt)}</td>
                  <td style={cellStyle}>{formatDate(r.cancellationEffectiveAt)}</td>
                  {tab === "completed" && (
                    <td style={{ ...cellStyle, color: "#86efac" }}>{formatDate(r.cancellationCompletedAt)}</td>
                  )}
                  <td style={cellStyle}>
                    {tab === "requested" ? (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => move(r.id, "complete")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid rgba(239,68,68,0.4)",
                          background: "rgba(239,68,68,0.12)",
                          color: "#fca5a5",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: busyId === r.id ? "wait" : "pointer",
                        }}
                      >
                        {busyId === r.id ? "..." : "סמן כבוטל"}
                      </button>
                    ) : (
                      <button
                        disabled={busyId === r.id}
                        onClick={() => move(r.id, "uncomplete")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#ccc",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: busyId === r.id ? "wait" : "pointer",
                        }}
                      >
                        {busyId === r.id ? "..." : "החזר לבקשות"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
