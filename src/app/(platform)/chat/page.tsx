"use client";

import React, { useState } from "react";

const channels = [
  { id: "general", name: "כללי", unread: 3 },
  { id: "claude-code", name: "Claude Code", unread: 0 },
  { id: "water-cooler", name: "מסביב לקפה", unread: 1 },
];

const messages = [
  { id: "m1", user: "דני כהן", content: "מישהו ניסה את ה-Agent SDK החדש?", time: "10:32" },
  { id: "m2", user: "מיכל לוי", content: "כן! זה מטורף. בניתי סוכן שעונה על שאלות מ-docs שלי.", time: "10:35" },
  { id: "m3", user: "ערן בראון", content: "שתפו פרויקטים ב-Show Your Work 🔥", time: "10:40", isAdmin: true },
  { id: "m4", user: "יוסי אברהם", content: "מישהו יודע איך לעשות streaming עם Agent SDK?", time: "10:45" },
  { id: "m5", user: "רונית שמש", content: "הנה דוגמה שעבדה לי: https://docs.anthropic.com/...", time: "10:48" },
];

const online = ["ערן בראון", "דני כהן", "מיכל לוי", "יוסי אברהם"];

export default function ChatPage() {
  const [active, setActive] = useState("general");
  const [msg, setMsg] = useState("");

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
      {/* Channels */}
      <div style={{ width: "220px", borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,26,0.3)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>ערוצים</h2>
        </div>
        <div style={{ flex: 1, padding: "8px" }}>
          {channels.map((ch) => (
            <button key={ch.id} onClick={() => setActive(ch.id)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", background: active === ch.id ? "rgba(0,0,255,0.12)" : "transparent", color: active === ch.id ? "white" : "rgba(240,240,245,0.6)", fontWeight: active === ch.id ? 700 : 400, fontSize: "13px", textAlign: "right" }}>
              <span style={{ color: "rgba(240,240,245,0.35)" }}>#</span>
              <span style={{ flex: 1, textAlign: "right" }}>{ch.name}</span>
              {ch.unread > 0 && <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0000FF", color: "white", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>{ch.unread}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "8px" }}>מחוברים ({online.length})</p>
          {online.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C853" }} />
              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: "56px", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "rgba(240,240,245,0.35)" }}>#</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>{channels.find((c) => c.id === active)?.name}</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#12122a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "rgba(240,240,245,0.6)", flexShrink: 0 }}>{m.user[0]}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: m.isAdmin ? "#3333FF" : "#f0f0f5" }}>{m.user}</span>
                  <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{m.time}</span>
                </div>
                <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)", marginTop: "2px" }}>{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="כתוב הודעה..." style={{ flex: 1, background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }} />
          <button style={{ background: "#0000FF", color: "white", width: "40px", height: "40px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "16px" }}>→</button>
        </div>
      </div>
    </div>
  );
}
