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

export default function UpdateVideoPage() {
  const [enabled, setEnabled] = useState(false);
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [delaySec, setDelaySec] = useState(3);
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/update-video")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled || false);
        setVimeoUrl(data.vimeoUrl || "");
        setDelaySec(data.delaySec ?? 3);
        setVersion(data.version || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Generate new version on save so all users see the new video
    const newVersion = new Date().toISOString();
    const res = await fetch("/api/update-video", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, vimeoUrl, delaySec, version: newVersion }),
    });
    setSaving(false);
    if (res.ok) {
      setVersion(newVersion);
      setMsg("נשמר! הוידאו יוצג לכל המשתמשים בכניסה הבאה שלהם.");
      setTimeout(() => setMsg(""), 5000);
    }
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ color: "rgba(240,240,245,0.5)", textAlign: "center", padding: 60 }}>טוען...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        וידאו עדכון
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: 32, fontSize: 14 }}>
        וידאו שקופץ למשתמשים חוזרים בכניסה למערכת.
        מתאים לעדכונים על תכנים חדשים, שינויים ופיצ׳רים.
        <br />
        <strong style={{ color: "rgba(240,240,245,0.9)" }}>לא מוצג בהתחברות ראשונה</strong> — רק למשתמשים שכבר סיימו את הסיור.
      </p>

      {msg && (
        <div style={{
          background: "rgba(0,200,83,0.1)",
          border: "1px solid rgba(0,200,83,0.3)",
          borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00C853",
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5" }}>פעיל</div>
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 4 }}>
              {enabled ? "הוידאו יוצג למשתמשים חוזרים" : "הוידאו מושבת"}
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: enabled ? "#00C853" : "rgba(255,255,255,0.1)",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3,
              right: enabled ? 3 : 27, transition: "right 0.2s",
            }} />
          </button>
        </div>

        {/* Vimeo URL */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
            קישור Vimeo
          </label>
          <input
            style={{ ...INPUT, direction: "ltr" }}
            value={vimeoUrl}
            onChange={(e) => setVimeoUrl(e.target.value)}
            placeholder="https://vimeo.com/123456789"
          />
        </div>

        {/* Delay */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
            השהיה אחרי כניסה (שניות)
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={delaySec}
            onChange={(e) => setDelaySec(parseInt(e.target.value) || 0)}
            style={{ ...INPUT, width: 120 }}
          />
        </div>

        {/* Current version info */}
        {version && (
          <div style={{
            background: "rgba(100,100,255,0.05)", border: "1px solid rgba(100,100,255,0.15)",
            borderRadius: 4, padding: "10px 14px", marginBottom: 20, fontSize: 12,
            color: "rgba(240,240,245,0.6)",
          }}>
            גרסה נוכחית: {new Date(version).toLocaleString("he-IL")}
            <br />
            כשתשמור — גרסה חדשה תיווצר וכל המשתמשים יראו את הוידאו שוב.
          </div>
        )}

        {/* Preview */}
        {vimeoUrl && getVimeoId(vimeoUrl) && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
              תצוגה מקדימה
            </label>
            <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
              <iframe
                src={`https://player.vimeo.com/video/${getVimeoId(vimeoUrl)}?badge=0&autopause=0`}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={BTN}>
          {saving ? "שומר..." : "שמור ופרסם עדכון"}
        </button>
      </div>
    </div>
  );
}
