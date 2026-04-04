"use client";

import { useState, useEffect } from "react";

interface DeletedAccount {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  deleted_by: string;
  deleted_at: string;
}

const DELETED_BY_LABELS: Record<string, string> = {
  user: "המשתמש",
  admin: "מנהל",
};

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "user" | "admin">("all");

  useEffect(() => {
    fetch("/api/account/deleted")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAccounts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? accounts : accounts.filter((a) => a.deleted_by === filter);

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "24px",
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString("he-IL") + " " + date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return d;
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", color: "rgba(240,240,245,0.7)", textAlign: "center" }}>טוען...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
        חשבונות שנמחקו
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.5)", marginBottom: "24px" }}>
        {accounts.length} חשבונות נמחקו
      </p>

      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { key: "all", label: "הכל" },
          { key: "user", label: "נמחקו ע״י המשתמש" },
          { key: "admin", label: "נמחקו ע״י מנהל" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: filter === f.key ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.03)",
              color: filter === f.key ? "#f0f0f5" : "rgba(240,240,245,0.5)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "rgba(240,240,245,0.5)", padding: "60px" }}>
          אין חשבונות שנמחקו
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["שם", "אימייל", "סוג", "נמחק ע״י", "תאריך ושעה"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      color: "rgba(240,240,245,0.7)",
                      fontWeight: 500,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 500 }}>
                    {a.full_name || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right" }}>
                    {a.email}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: `${USER_TYPE_COLORS[a.user_type] || "rgba(255,255,255,0.1)"}20`,
                        color: USER_TYPE_COLORS[a.user_type] || "rgba(240,240,245,0.5)",
                      }}
                    >
                      {USER_TYPE_LABELS[a.user_type] || a.user_type}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)" }}>
                    {DELETED_BY_LABELS[a.deleted_by] || a.deleted_by}
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", fontSize: "13px" }}>
                    {formatDate(a.deleted_at)}
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
