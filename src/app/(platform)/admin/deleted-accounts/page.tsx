"use client";

import { useState, useEffect } from "react";

interface DeletedAccount {
  id: string;
  date: string;
  time: string;
  userType: "tourist" | "member" | "admin";
  name: string;
  email: string;
}

const USER_TYPE_LABELS: Record<string, string> = {
  tourist: "תייר",
  member: "חבר",
  admin: "מנהל",
};

const USER_TYPE_COLORS: Record<string, string> = {
  tourist: "#FFB300",
  member: "#22c55e",
  admin: "#0000FF",
};

export default function DeletedAccountsPage() {
  const [accounts, setAccounts] = useState<DeletedAccount[]>([]);
  const [filter, setFilter] = useState<"all" | "tourist" | "member">("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bldr_deleted_accounts");
      if (stored) setAccounts(JSON.parse(stored));
    } catch {}
  }, []);

  const clearAll = () => {
    if (!confirm("האם אתה בטוח שאתה רוצה לנקות את כל הדו\"ח?")) return;
    localStorage.removeItem("bldr_deleted_accounts");
    setAccounts([]);
  };

  const filtered = filter === "all" ? accounts : accounts.filter(a => a.userType === filter);

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "24px",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>חשבונות מחוקים</h1>
        {accounts.length > 0 && (
          <button onClick={clearAll} style={{
            padding: "8px 16px", borderRadius: "4px",
            border: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}>
            נקה דו&quot;ח
          </button>
        )}
      </div>
      <p style={{ color: "rgba(240,240,245,0.6)", fontSize: "14px", marginBottom: "28px" }}>
        דו&quot;ח של חשבונות שנמחקו ידנית על ידי המשתמשים
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "סה\"כ מחוקים", value: accounts.length, color: "#fff" },
          { label: "תיירים", value: accounts.filter(a => a.userType === "tourist").length, color: "#FFB300" },
          { label: "חברים", value: accounts.filter(a => a.userType === "member").length, color: "#22c55e" },
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, padding: "16px 20px" }}>
            <p style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", marginTop: "4px" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["all", "tourist", "member"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: "4px",
              border: filter === f ? "1px solid rgba(0,0,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              background: filter === f ? "rgba(0,0,255,0.12)" : "transparent",
              color: filter === f ? "#fff" : "rgba(240,240,245,0.5)",
              fontSize: "13px", cursor: "pointer",
            }}
          >
            {f === "all" ? "הכל" : USER_TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      <div style={cardStyle}>
        {filtered.length === 0 ? (
          <p style={{ color: "rgba(240,240,245,0.35)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
            אין חשבונות מחוקים{filter !== "all" ? " בקטגוריה זו" : ""} עדיין.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["תאריך", "שעה", "סוג משתמש", "שם", "אימייל"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "right", color: "rgba(240,240,245,0.35)", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(account => (
                  <tr key={account.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)" }}>{account.date}</td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)" }}>{account.time}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "6px",
                        fontSize: "11px", fontWeight: 600,
                        background: `${USER_TYPE_COLORS[account.userType]}20`,
                        color: USER_TYPE_COLORS[account.userType],
                      }}>
                        {USER_TYPE_LABELS[account.userType] || account.userType}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#fff" }}>{account.name}</td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)" }}>{account.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
