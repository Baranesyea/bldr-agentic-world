"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const courseData = {
  id: "1",
  title: "Mastering Claude Code",
  description: "למד לבנות עם Claude Code — מ-CLAUDE.md ועד סוכנים מלאים. הקורס המקיף ביותר בעברית.",
  progress: 65,
  totalLessons: 10,
  completedLessons: 5,
  chapters: [
    {
      id: "ch1",
      title: "שבוע 1: יסודות",
      isLocked: false,
      lessons: [
        { id: "l1", title: "מה זה Claude Code?", duration: "12:30", completed: true, hasAssignment: false },
        { id: "l2", title: "התקנה והגדרות", duration: "18:45", completed: true, hasAssignment: false },
        { id: "l3", title: "איך לכתוב CLAUDE.md", duration: "25:10", completed: true, hasAssignment: true },
        { id: "l4", title: "פקודות בסיסיות", duration: "20:00", completed: true, hasAssignment: false },
      ],
    },
    {
      id: "ch2",
      title: "שבוע 2: טכניקות מתקדמות",
      isLocked: false,
      lessons: [
        { id: "l5", title: "Advanced Prompting", duration: "22:15", completed: true, hasAssignment: true },
        { id: "l6", title: "עבודה עם MCP Servers", duration: "30:00", completed: false, hasAssignment: true },
        { id: "l7", title: "Hooks ו-Automations", duration: "28:30", completed: false, hasAssignment: false },
      ],
    },
    {
      id: "ch3",
      title: "שבוע 3: בניית סוכנים",
      isLocked: true,
      lessons: [
        { id: "l8", title: "Agent SDK — יסודות", duration: "35:00", completed: false, hasAssignment: true },
        { id: "l9", title: "Multi-Agent Systems", duration: "40:00", completed: false, hasAssignment: true },
        { id: "l10", title: "פרויקט סיום", duration: "45:00", completed: false, hasAssignment: true },
      ],
    },
  ],
};

export default function CourseViewPage() {
  const params = useParams();
  const [openChapters, setOpenChapters] = useState<string[]>(["ch1", "ch2"]);

  const toggle = (id: string) => {
    setOpenChapters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #050510, #080820 30%, #050510)" }}>
      {/* Hero Header */}
      <div style={{ position: "relative", padding: "48px", paddingBottom: "32px", background: "linear-gradient(135deg, #050510 0%, #0a0a2a 50%, #000033 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%, rgba(0,0,255,0.1) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/courses" style={{ fontSize: "13px", color: "rgba(240,240,245,0.35)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
            ← חזרה לקורסים
          </Link>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", marginBottom: "8px" }}>{courseData.title}</h1>
          <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.6 }}>{courseData.description}</p>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1, maxWidth: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)" }}>{courseData.completedLessons} / {courseData.totalLessons} שיעורים</span>
                <span style={{ fontSize: "12px", color: "#3333FF", fontWeight: 600 }}>{courseData.progress}%</span>
              </div>
              <div style={{ background: "#12122a", borderRadius: "6px", height: "6px", overflow: "hidden" }}>
                <div style={{ width: `${courseData.progress}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "6px", boxShadow: "0 0 12px rgba(0,0,255,0.4)" }} />
              </div>
            </div>
            <Link href={`/courses/${params.courseId}/lessons/l6`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", textDecoration: "none", boxShadow: "0 0 20px rgba(0,0,255,0.3)" }}>
              ▶ המשך מאיפה שהפסקת
            </Link>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {courseData.chapters.map((chapter) => {
            const isOpen = openChapters.includes(chapter.id);
            const done = chapter.lessons.filter((l) => l.completed).length;

            return (
              <div key={chapter.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden", opacity: chapter.isLocked ? 0.5 : 1 }}>
                {/* Chapter Header */}
                <button
                  onClick={() => !chapter.isLocked && toggle(chapter.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "none", border: "none", cursor: chapter.isLocked ? "default" : "pointer", textAlign: "right" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "16px", color: "rgba(240,240,245,0.35)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      {chapter.isLocked ? "🔒" : "▾"}
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f5" }}>{chapter.title}</span>
                  </div>
                  <span style={{ background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    {done}/{chapter.lessons.length}
                  </span>
                </button>

                {/* Lessons */}
                {isOpen && !chapter.isLocked && (
                  <div style={{ padding: "0 16px 16px" }}>
                    {chapter.lessons.map((lesson, i) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${params.courseId}/lessons/${lesson.id}`}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 12px", borderRadius: "12px", textDecoration: "none", transition: "background 0.15s", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(18,18,42,0.5)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Status Icon */}
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: lesson.completed ? "rgba(0,200,83,0.15)" : "rgba(0,0,255,0.1)", flexShrink: 0 }}>
                          <span style={{ fontSize: "14px" }}>{lesson.completed ? "✓" : "▶"}</span>
                        </div>

                        {/* Title */}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "14px", fontWeight: lesson.completed ? 400 : 600, color: lesson.completed ? "rgba(240,240,245,0.5)" : "#f0f0f5" }}>{lesson.title}</p>
                        </div>

                        {/* Meta */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          {lesson.hasAssignment && <span style={{ fontSize: "11px", color: "#FFB300", background: "rgba(255,179,0,0.1)", padding: "2px 6px", borderRadius: "4px" }}>מטלה</span>}
                          <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>⏱ {lesson.duration}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
