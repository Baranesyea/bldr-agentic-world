"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { PlayIcon, HeartIcon, StarIcon, FireIcon, RocketIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

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

function ScrollRow({ title, titleIcon, badge, children }: { title: string; titleIcon?: React.ReactNode; badge?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "0 48px" }}>
        {titleIcon && <span style={{ display: "flex", alignItems: "center" }}>{titleIcon}</span>}
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5" }}>{title}</h2>
        {badge && <span style={{ background: "rgba(0,0,255,0.15)", color: "#3333FF", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={() => scroll(-1)} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(10,10,26,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "36px", height: "36px", color: "#f0f0f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRightIcon size={18} /></button>
        <button onClick={() => scroll(1)} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(10,10,26,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "36px", height: "36px", color: "#f0f0f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={18} /></button>
        <div ref={ref} style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "0 48px", scrollbarWidth: "none" }}>{children}</div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  // Consistent course card with 16:9 thumbnail
  const CourseCard = ({ c, isComingSoon }: { c: typeof allCourses[0]; isComingSoon?: boolean }) => {
    const inner = (
      <div style={{
        background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px", overflow: "hidden",
        transition: "transform 0.25s, border-color 0.25s, box-shadow 0.25s",
        opacity: isComingSoon ? 0.7 : 1,
        cursor: isComingSoon ? "default" : "pointer",
      }}
        onMouseEnter={(e) => { if (!isComingSoon) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,255,0.15)"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {/* Thumbnail — 16:9 */}
        <div style={{
          position: "relative", paddingBottom: "56.25%",
          background: `linear-gradient(135deg, #0a0a2a 0%, #000044 50%, #0a0a2a 100%)`,
        }}>
          {/* Course title watermark */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}>
            <span style={{ fontSize: "22px", fontWeight: 900, color: "rgba(240,240,245,0.08)", fontFamily: "var(--font-heading-en)", textAlign: "center", lineHeight: 1.2 }}>{c.title}</span>
          </div>
          {/* Play button overlay */}
          {!isComingSoon && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "rgba(0,0,255,0.6)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0.7,
              }}>
                <PlayIcon size={22} color="white" />
              </div>
            </div>
          )}
          {/* Coming soon badge */}
          {isComingSoon && (
            <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,179,0,0.25)", color: "#FFB300", padding: "4px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>בקרוב</span>
          )}
          {/* Bottom gradient */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to top, #0a0a1a, transparent)" }} />
        </div>
        {/* Info */}
        <div style={{ padding: "14px 16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: isComingSoon ? "rgba(240,240,245,0.5)" : "#f0f0f5", marginBottom: "6px", fontFamily: "var(--font-heading-en)" }}>{c.title}</h3>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>
            <span>{c.lessons} שיעורים</span>
            {c.students > 0 && <span>{c.students} סטודנטים</span>}
          </div>
        </div>
      </div>
    );
    if (isComingSoon) return <div key={c.id}>{inner}</div>;
    return <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>{inner}</Link>;
  };

  return (
    <div style={{ background: "linear-gradient(180deg, #050510 0%, #080820 50%, #050510 100%)", minHeight: "100vh" }}>
      {/* Hero — Featured Course */}
      <div style={{ position: "relative", height: "50vh", minHeight: "380px", background: "linear-gradient(135deg, #050510 0%, #0a0a2a 40%, #000044 70%, #050510 100%)", display: "flex", alignItems: "flex-end", padding: "48px", marginBottom: "32px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 60%, rgba(0,0,255,0.12) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, #050510, transparent)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "550px" }}>
          <span style={{ background: "rgba(0,0,255,0.2)", color: "#3333FF", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "inline-block", marginBottom: "12px" }}>ממשיך מאיפה שהפסקת</span>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "12px", fontFamily: "var(--font-heading-en)" }}>Mastering Claude Code</h1>
          <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>למד איך להשתמש ב-Claude Code כמו מקצוען — MCP Servers, CLAUDE.md, Agent SDK ועוד</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ background: "#12122a", borderRadius: "6px", height: "4px", width: "200px", overflow: "hidden" }}>
              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)" }} />
            </div>
            <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>65% הושלם</span>
          </div>
          <Link href="/courses/c1/lessons/l6" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", textDecoration: "none", boxShadow: "0 0 20px rgba(0,0,255,0.3)" }}><PlayIcon size={14} /> המשך לצפות</Link>
        </div>
      </div>

      {/* Continue Watching — Lesson cards */}
      <ScrollRow title="המשך לצפות" badge={`${continueWatching.length} שיעורים`}>
        {continueWatching.map((l) => (
          <div key={l.id} style={cardStyle}>
            <div style={thumbStyle}>
              <span style={{ opacity: 0.3, display: "flex", alignItems: "center" }}><PlayIcon size={32} /></span>
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

      {/* All Courses — Uniform cards */}
      <div style={{ padding: "0 48px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>כל הקורסים</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {allCourses.filter((c) => c.status === "active").map((c) => (
            <CourseCard key={c.id} c={c} />
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      {allCourses.some((c) => c.status === "coming_soon") && (
        <div style={{ padding: "0 48px", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            עולה בקרוב
            <span style={{ background: "rgba(255,179,0,0.15)", color: "#FFB300", padding: "2px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>{allCourses.filter((c) => c.status === "coming_soon").length}</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {allCourses.filter((c) => c.status === "coming_soon").map((c) => (
              <CourseCard key={c.id} c={c} isComingSoon />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
