"use client";

import React, { useState, useEffect } from "react";

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  padding: "28px",
  marginBottom: 24,
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4,
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

export default function FloginAdminPage() {
  const [enabled, setEnabled] = useState(false);
  const [accessDays, setAccessDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/flogin/settings")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled || false);
        setAccessDays(data.accessDays || 7);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/flogin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, accessDays }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("נשמר!");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const appUrl = "https://app.bldr.co.il";

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ color: "rgba(240,240,245,0.5)", textAlign: "center", padding: 60 }}>
          טוען...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        הרשמה חופשית
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: 32, fontSize: 14 }}>
        ניהול עמוד ההרשמה החופשית (flogin).
        {" "}
        משתמשים שנרשמים דרך העמוד הזה מקבלים גישה מוגבלת בזמן.
      </p>

      {msg && (
        <div style={{
          background: "rgba(0,200,83,0.1)",
          border: "1px solid rgba(0,200,83,0.3)",
          borderRadius: 4,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#00C853",
        }}>
          {msg}
        </div>
      )}

      <div style={CARD}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 20px" }}>
          הגדרות
        </h3>

        {/* Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5" }}>
              עמוד פעיל
            </div>
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 4 }}>
              {enabled ? "העמוד פתוח להרשמות" : "העמוד סגור"}
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 52,
              height: 28,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              background: enabled ? "#00C853" : "rgba(255,255,255,0.1)",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              right: enabled ? 3 : 27,
              transition: "right 0.2s",
            }} />
          </button>
        </div>

        {/* Access days */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
            משך גישה (ימים)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={accessDays}
            onChange={(e) => setAccessDays(parseInt(e.target.value) || 7)}
            style={{ ...INPUT, width: 120 }}
          />
          <p style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 4 }}>
            כל משתמש שנרשם דרך העמוד יקבל גישה ל-{accessDays} ימים מרגע ההרשמה
          </p>
        </div>

        {/* Link */}
        <div style={{
          padding: "16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
          marginBottom: 24,
        }}>
          <label style={{ fontSize: 12, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>
            קישור לעמוד ההרשמה
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <code style={{
              flex: 1,
              fontSize: 14,
              color: enabled ? "#4488FF" : "rgba(240,240,245,0.3)",
              direction: "ltr",
              textAlign: "left",
            }}>
              {appUrl}/flogin
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`${appUrl}/flogin`)}
              style={{
                ...BTN,
                background: "rgba(255,255,255,0.06)",
                padding: "6px 14px",
                fontSize: 12,
              }}
            >
              העתק
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={BTN}>
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
      </div>
    </div>
  );
}
