"use client";

import React, { useRef } from "react";
import Link from "next/link";

const cardStyle: React.CSSProperties = {
  flex: "0 0 220px",
  background: "#0a0a1a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  overflow: "hidden",
  cursor: "pointer",
};

const thumbStyle: React.CSSProperties = {
  width: "100%",
  height: "124px",
  background: "linear-gradient(135deg, #0a0a2a, #000044)",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const continueWatching = [
  { id: "l1", title: "MCP Servers — הגדרה ראשונה", course: "Mastering Claude Code", duration: "12:30", progress: 45 },
  { id: "l2", title: "CLAUDE.md Best Practices", course: "Mastering Claude Code", duration: "18:20", progress: 70 },
  { id: "l3", title: "מבוא ל-Vibe Coding", course: "Vibe Coding Fundamentals", duration: "15:00", progress: 20 },
  { id: "l4", title: "Agent SDK — Quick Start", course: "Building AI Agents", duration: "22:10", progress: 10 },
  { id: "l5", title: "n8n Workflows למתקדמים", course: "Automation Mastery", duration: "25:00", progress: 55 },
];

const trending = [
  { id: "l6", title: "Claude 4 — מה חדש?", course: "AI Updates Weekly", duration: "10:15", likes: 142 },
  { id: "l7", title: "בניית Chatbot ב-30 דקות", course: "Vibe Coding Fundamentals", duration: "30:00", likes: 98 },
  { id: "l8", title: "Cursor vs Claude Code", course: "Tool Comparisons", duration: "20:45", likes: 87 },
  { id: "l9", title: "Prompt Engineering Pro", course: "Mastering Claude Code", duration: "16:30", likes: 76 },
  { id: "l10", title: "Make.com — אוטומציה מלאה", course: "Automation Mastery", duration: "28:00", likes: 65 },
];

const popular = [
  { id: "l11", title: "איך לבנות SaaS עם AI", course: "Vibe Coding Fundamentals", duration: "35:00", rating: 4.9, reviews: 58 },
  { id: "l12", title: "Context Window — טיפים", course: "Mastering Claude Code", duration: "14:20", rating: 4.8, reviews: 45 },
  { id: "l13", title: "Webhooks & APIs", course: "Automation Mastery", duration: "22:00", rating: 4.8, reviews: 39 },
  { id: "l14", title: "RAG — מדריך מעשי", course: "Building AI Agents", duration: "26:15", rating: 4.7, reviews: 34 },
  { id: "l15", title: "TypeScript for AI Devs", course: "Vibe Coding Fundamentals", duration: "19:40", rating: 4.7, reviews: 31 },
];

const allCourses = [
  { id: "c1", title: "Mastering Claude Code", lessons: 24, students: 180, status: "active" },
  { id: "c2", title: "Vibe Coding Fundamentals", lessons: 18, students: 145, status: "active" },
  { id: "c3", title: "Building AI Agents", lessons: 20, students: 120, status: "active" },
  { id: "c4", title: "Automation Mastery", lessons: 16, students: 95, status: "active" },
  { id: "c5", title: "AI Product Management", lessons: 12, students: 0, status: "coming_soon" },
  { id: "c6", title: "Advanced Prompt Engineering", lessons: 15, students: 0, status: "coming_soon" },
];

function ScrollRow({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "0 48px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5" }}>{title}</h2>
        {badge && <span style={{ background: "rgba(0,0,255,0.15)", color: "#3333FF", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={() => scroll(-1)} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(10,10,26,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "36px", height: "36px", color: "#f0f0f5", cursor: "pointer", fontSize: "18px" }}>›</button>
        <button onClick={() => scroll(1)} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(10,10,26,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "36px", height: "36px", color: "#f0f0f5", cursor: "pointer", fontSize: "18px" }}>‹</button>
        <div ref={ref} style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "0 48px", scrollbarWidth: "none" }}>{children}</div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div style={{ background: "linear-gradient(180deg, #050510 0%, #080820 50%, #050510 100%)", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "70vh", minHeight: "500px", background: "linear-gradient(135deg, #050510 0%, #0a0a2a 40%, #000033 70%, #050510 100%)", display: "flex", alignItems: "flex-end", padding: "48px", marginBottom: "32px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 60%, rgba(0,0,255,0.12) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, #050510, transparent)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <span style={{ background: "rgba(0,0,255,0.2)", color: "#3333FF", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "inline-block", marginBottom: "12px" }}>ממשיך מאיפה שהפסקת</span>
          <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "12px" }}>Mastering Claude Code</h1>
          <p style={{ fontSize: "16px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>למד איך להשתמש ב-Claude Code כמו מקצוען — MCP Servers, CLAUDE.md, Agent SDK ועוד</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <div style={{ background: "#12122a", borderRadius: "6px", height: "4px", width: "200px", overflow: "hidden" }}>
              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)" }} />
            </div>
            <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>65% הושלם</span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/courses/mastering-claude-code" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", textDecoration: "none", boxShadow: "0 0 20px rgba(0,0,255,0.3)" }}>▶ המשך לצפות</Link>
            <button style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f5", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>מידע נוסף</button>
          </div>
        </div>
      </div>

      <ScrollRow title="המשך לצפות" badge={`${continueWatching.length} שיעורים`}>
        {continueWatching.map((l) => (
          <div key={l.id} style={cardStyle}>
            <div style={thumbStyle}>
              <span style={{ fontSize: "32px", opacity: 0.3 }}>▶</span>
              <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#f0f0f5", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{l.duration}</span>
            </div>
            <div style={{ padding: "12px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{l.title}</h3>
              <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "8px" }}>{l.course}</p>
              <div style={{ background: "#12122a", borderRadius: "4px", height: "3px", overflow: "hidden" }}>
                <div style={{ width: `${l.progress}%`, height: "100%", background: "#0000FF" }} />
              </div>
            </div>
          </div>
        ))}
      </ScrollRow>

      <ScrollRow title="🔥 הכי חם עכשיו">
        {trending.map((l) => (
          <div key={l.id} style={cardStyle}>
            <div style={thumbStyle}>
              <span style={{ fontSize: "32px", opacity: 0.3 }}>▶</span>
              <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#f0f0f5", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{l.duration}</span>
            </div>
            <div style={{ padding: "12px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{l.title}</h3>
              <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "8px" }}>{l.course}</p>
              <span style={{ fontSize: "11px", color: "#FF3D00" }}>❤️ {l.likes}</span>
            </div>
          </div>
        ))}
      </ScrollRow>

      <div style={{ margin: "0 48px 40px", background: "linear-gradient(135deg, rgba(0,0,255,0.08), rgba(0,0,255,0.02))", border: "1px solid rgba(0,0,255,0.15)", borderRadius: "16px", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", marginBottom: "4px" }}>🚀 Building AI Agents — קורס חדש!</h3>
          <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)" }}>למד לבנות סוכני AI עם Claude Agent SDK</p>
        </div>
        <button style={{ background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 0 20px rgba(0,0,255,0.3)" }}>הירשם עכשיו</button>
      </div>

      <ScrollRow title="⭐ הסטודנטים הכי אוהבים">
        {popular.map((l) => (
          <div key={l.id} style={cardStyle}>
            <div style={thumbStyle}>
              <span style={{ fontSize: "32px", opacity: 0.3 }}>▶</span>
              <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#f0f0f5", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{l.duration}</span>
            </div>
            <div style={{ padding: "12px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{l.title}</h3>
              <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "8px" }}>{l.course}</p>
              <span style={{ fontSize: "11px", color: "#FFB300" }}>⭐ {l.rating} ({l.reviews})</span>
            </div>
          </div>
        ))}
      </ScrollRow>

      <div style={{ padding: "0 48px", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>כל הקורסים</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {allCourses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ height: "140px", background: "linear-gradient(135deg, #0a0a2a, #000044)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(240,240,245,0.15)" }}>{c.title}</span>
                  {c.status === "coming_soon" && <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,179,0,0.2)", color: "#FFB300", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>בקרוב</span>}
                </div>
                <div style={{ padding: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5", marginBottom: "8px" }}>{c.title}</h3>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>
                    <span>{c.lessons} שיעורים</span>
                    {c.students > 0 && <span>{c.students} סטודנטים</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
