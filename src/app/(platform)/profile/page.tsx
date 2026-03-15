"use client";

import React from "react";

export default function ProfilePage() {
  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Avatar & Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0000FF, #3333FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: 700, color: "white" }}>ע</div>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5" }}>ערן בראון</h1>
          <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)" }}>eran@bldr.co.il</p>
          <span style={{ fontSize: "12px", color: "#3333FF", background: "rgba(0,0,255,0.15)", padding: "2px 10px", borderRadius: "8px", display: "inline-block", marginTop: "4px" }}>Architect</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
        {[
          { label: "נקודות מוניטין", value: "450", emoji: "🏆" },
          { label: "שיעורים שהושלמו", value: "21", emoji: "📖" },
          { label: "רצף ימים", value: "7", emoji: "🔥" },
          { label: "הערות", value: "12", emoji: "📝" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.emoji}</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginBottom: "16px" }}>תגים</h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
        {["Early Adopter", "Course Completer", "7-Day Streak", "Community Helper"].map((badge) => (
          <span key={badge} style={{ background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", border: "1px solid rgba(255,255,255,0.06)" }}>{badge}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button style={{ background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer" }}>ערוך פרופיל</button>
        <button style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f5", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>הורד אווטאר</button>
      </div>
    </div>
  );
}
