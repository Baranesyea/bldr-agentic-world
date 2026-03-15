"use client";

import React from "react";
import Link from "next/link";
import { BookIcon, FireIcon, TrophyIcon, PlayIcon } from "@/components/ui/icons";

const continueWatching = [
  { id: "l6", title: "עבודה עם MCP Servers", course: "Mastering Claude Code", courseId: "c1", duration: "30:00", progress: 45 },
  { id: "l3", title: "איך לכתוב CLAUDE.md", course: "Mastering Claude Code", courseId: "c1", duration: "25:10", progress: 70 },
  { id: "l1", title: "מבוא ל-Vibe Coding", course: "Vibe Coding Fundamentals", courseId: "c2", duration: "15:00", progress: 20 },
];

const recommended = [
  { id: "c1", title: "Mastering Claude Code", lessons: 24, thumb: "linear-gradient(135deg, #0a0a2a, #000066)" },
  { id: "c2", title: "Vibe Coding Fundamentals", lessons: 18, thumb: "linear-gradient(135deg, #0a0a2a, #002244)" },
  { id: "c3", title: "Building AI Agents", lessons: 20, thumb: "linear-gradient(135deg, #0a0a2a, #220044)" },
  { id: "c4", title: "Automation Mastery", lessons: 16, thumb: "linear-gradient(135deg, #0a0a2a, #003322)" },
];

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050510" }}>
      {/* ── Stats Bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(10,10,26,0.6)",
        backdropFilter: "blur(12px)",
      }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5" }}>שלום, ערן</span>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { icon: <BookIcon size={14} />, value: "21", label: "שיעורים" },
            { icon: <FireIcon size={14} />, value: "7", label: "רצף" },
            { icon: <TrophyIcon size={14} />, value: "450", label: "נקודות" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "rgba(240,240,245,0.4)", display: "flex" }}>{s.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>{s.value}</span>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero — Continue Watching ── */}
      <div style={{
        position: "relative",
        height: "65vh",
        minHeight: "420px",
        background: "linear-gradient(135deg, #050510 0%, #0a0a2a 40%, #000044 70%, #050510 100%)",
        display: "flex",
        alignItems: "flex-end",
        padding: "48px",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 60%, rgba(0,0,255,0.12) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, #050510, transparent)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "550px" }}>
          <span style={{ background: "rgba(0,0,255,0.2)", color: "#3333FF", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "inline-block", marginBottom: "12px" }}>
            ממשיך מאיפה שהפסקת
          </span>
          <h1 style={{ fontSize: "38px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "12px", fontFamily: "var(--font-heading-en)" }}>
            Mastering Claude Code
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>
            למד איך להשתמש ב-Claude Code כמו מקצוען — MCP Servers, CLAUDE.md, Agent SDK ועוד
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <div style={{ background: "#12122a", borderRadius: "6px", height: "4px", width: "200px", overflow: "hidden" }}>
              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)" }} />
            </div>
            <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>65% הושלם</span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/courses/c1/lessons/l6" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "12px",
              fontWeight: 600, fontSize: "15px", textDecoration: "none",
              boxShadow: "0 0 30px rgba(0,0,255,0.35)",
            }}>
              <PlayIcon size={16} /> המשך לצפות
            </Link>
            <Link href="/courses/c1" style={{
              background: "rgba(255,255,255,0.08)", color: "#f0f0f5", padding: "12px 28px",
              borderRadius: "12px", fontWeight: 600, fontSize: "15px",
              border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none",
            }}>
              פרטי הקורס
            </Link>
          </div>
        </div>
      </div>

      {/* ── Continue Watching Row ── */}
      <div style={{ padding: "32px 48px 0" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>המשך לצפות</h2>
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
          {continueWatching.map((l) => (
            <Link key={l.id} href={`/courses/${l.courseId}/lessons/${l.id}`} style={{ textDecoration: "none", flex: "0 0 280px" }}>
              <div style={{
                background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
              >
                <div style={{
                  height: "140px", background: "linear-gradient(135deg, #0a0a2a, #000044)",
                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                }}>
                  <span style={{ opacity: 0.3, display: "flex" }}><PlayIcon size={36} /></span>
                  <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#f0f0f5", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>{l.duration}</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{l.title}</h3>
                  <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)", marginBottom: "8px", fontFamily: "var(--font-heading-en)" }}>{l.course}</p>
                  <div style={{ background: "#12122a", borderRadius: "4px", height: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${l.progress}%`, height: "100%", background: "#0000FF" }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── All Courses ── */}
      <div style={{ padding: "32px 48px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5" }}>כל הקורסים</h2>
          <Link href="/courses" style={{ color: "#3333FF", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            לכל הקורסים →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {recommended.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", overflow: "hidden", transition: "transform 0.2s, border-color 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={{ height: "120px", background: c.thumb, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(240,240,245,0.12)", fontFamily: "var(--font-heading-en)" }}>{c.title}</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px", fontFamily: "var(--font-heading-en)" }}>{c.title}</h3>
                  <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>{c.lessons} שיעורים</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
