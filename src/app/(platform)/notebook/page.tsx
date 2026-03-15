"use client";

import React from "react";

const notes = [
  { id: "1", lesson: "MCP Servers — הגדרה ראשונה", course: "Mastering Claude Code", timestamp: "03:24", content: "צריך לוודא שה-MCP Server רץ לפני שמפעילים את Claude Code", createdAt: "לפני יומיים" },
  { id: "2", lesson: "CLAUDE.md Best Practices", course: "Mastering Claude Code", timestamp: "07:15", content: "CLAUDE.md צריך להכיל: stack, conventions, ומה לא לעשות. לא יותר מדי ארוך.", createdAt: "לפני 3 ימים" },
  { id: "3", lesson: "מבוא ל-Vibe Coding", course: "Vibe Coding Fundamentals", timestamp: "12:00", content: "Vibe Coding = לתאר מה אתה רוצה ולתת ל-AI לכתוב. המפתח הוא prompts טובים.", createdAt: "לפני שבוע" },
  { id: "4", lesson: "Agent SDK — Quick Start", course: "Building AI Agents", timestamp: "05:30", content: "Agent SDK תומך ב-tools, memory, ו-multi-turn conversations מהקופסה", createdAt: "לפני שבוע" },
];

export default function NotebookPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>📒 המחברת שלי</h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "24px", fontSize: "14px" }}>כל ההערות שלך ממוקם אחד</p>

      <div style={{ marginBottom: "24px" }}>
        <input placeholder="חפש בהערות..." style={{ width: "100%", maxWidth: "400px", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notes.map((note) => (
          <div key={note.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5" }}>{note.lesson}</h3>
                <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>{note.course} · ⏱ {note.timestamp}</p>
              </div>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{note.createdAt}</span>
            </div>
            <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)", lineHeight: 1.6 }}>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
