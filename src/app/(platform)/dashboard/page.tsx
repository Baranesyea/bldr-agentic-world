"use client";

import React from "react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
        שלום, ערן 👋
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "32px" }}>מה תלמד היום?</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "שיעורים שהושלמו", value: "21", emoji: "📖" },
          { label: "רצף ימים", value: "7", emoji: "🔥" },
          { label: "נקודות מוניטין", value: "450", emoji: "🏆" },
          { label: "התראות חדשות", value: "3", emoji: "🔔" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "24px", marginBottom: "4px" }}>{stat.emoji}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginBottom: "16px" }}>עדכונים</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { title: "שיעור חדש זמין", body: "איך לכתוב CLAUDE.md — קורס Mastering Claude Code", time: "לפני 2 שעות", isNew: true },
          { title: "אירוע חדש", body: "Office Hours — יום שלישי, 19:00", time: "לפני 5 שעות", isNew: true },
          { title: "תשובה חדשה ב-KB", body: "איך להשתמש ב-MCP Servers בצורה נכונה", time: "אתמול", isNew: false },
        ].map((item) => (
          <div key={item.title} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5" }}>{item.title}</span>
              {item.isNew && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0000FF", display: "inline-block" }} />}
            </div>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "8px" }}>{item.body}</p>
            <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{item.time}</span>
          </div>
        ))}
      </div>

      {/* Active Courses */}
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginBottom: "16px" }}>הקורסים שלי</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {[
          { title: "Mastering Claude Code", progress: 65, completed: 16, total: 24, next: "Advanced Prompting Techniques" },
          { title: "Vibe Coding Fundamentals", progress: 30, completed: 5, total: 18, next: "Building Your First App" },
        ].map((course) => (
          <Link key={course.title} href="/courses" style={{ textDecoration: "none" }}>
            <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5" }}>{course.title}</h3>
                  <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>{course.completed} / {course.total} שיעורים</p>
                </div>
                <span style={{ background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>{course.progress}%</span>
              </div>
              <div style={{ background: "#12122a", borderRadius: "6px", height: "6px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ width: `${course.progress}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "6px" }} />
              </div>
              <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)" }}>הבא: {course.next}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
