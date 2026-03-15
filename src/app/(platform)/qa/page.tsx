"use client";

import React from "react";
import { QuestionIcon } from "@/components/ui/icons";

const questions = [
  { id: "q1", title: "איך להשתמש ב-MCP Servers?", desc: "אני מנסה לחבר MCP Server ל-Claude Code אבל מקבל שגיאה בהתחברות...", status: "answered", tags: ["claude-code", "mcp"], time: "לפני 2 ימים" },
  { id: "q2", title: "איך לכתוב CLAUDE.md נכון?", desc: "מה בדיוק צריך לשים בקובץ CLAUDE.md? יש template?", status: "answered", tags: ["claude-code", "basics"], time: "לפני 3 ימים" },
  { id: "q3", title: "Vibe Coding — איפה מתחילים?", desc: "אני חדש לגמרי בתחום, מאיפה הכי כדאי להתחיל?", status: "pending", tags: ["vibe-coding", "beginner"], time: "לפני שעה" },
  { id: "q4", title: "איך לחבר n8n ל-Claude?", desc: "רוצה לבנות workflow שמעביר מידע מ-n8n ל-Claude API", status: "pending", tags: ["automation", "n8n"], time: "לפני 3 שעות" },
];

export default function QAPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}><QuestionIcon size={24} /> שאלות ותשובות</h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "24px", fontSize: "14px" }}>שאל, קבל תשובות, ותרום ל-Knowledge Base</p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input placeholder="חפש שאלות..." style={{ flex: 1, background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }} />
        <button style={{ background: "#0000FF", color: "white", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>שאל שאלה</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {questions.map((q) => (
          <div key={q.id} style={{ background: "#0a0a1a", border: `1px solid ${q.status === "pending" ? "rgba(255,179,0,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5" }}>{q.title}</h3>
              <span style={{ background: q.status === "answered" ? "rgba(0,200,83,0.15)" : "rgba(255,179,0,0.15)", color: q.status === "answered" ? "#00C853" : "#FFB300", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>{q.status === "answered" ? "נענתה" : "ממתינה"}</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "8px" }}>{q.desc}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {q.tags.map((tag) => (
                <span key={tag} style={{ background: "#12122a", color: "rgba(240,240,245,0.5)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px" }}>{tag}</span>
              ))}
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginRight: "auto" }}>{q.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
