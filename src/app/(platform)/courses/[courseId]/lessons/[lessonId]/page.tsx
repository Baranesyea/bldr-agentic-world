"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const lessonData = {
  id: "l6",
  title: "עבודה עם MCP Servers",
  description: "למד איך לחבר כלים חיצוניים ל-Claude Code באמצעות Model Context Protocol.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  duration: "30:00",
  courseName: "Mastering Claude Code",
  courseId: "1",
  chapterName: "שבוע 2: טכניקות מתקדמות",
  hasAssignment: true,
  assignment: {
    instructions: "בנה MCP Server פשוט שמתחבר ל-API חיצוני. שלח קישור ל-GitHub repo.",
  },
  attachments: [
    { name: "MCP Cheat Sheet.pdf", size: "2.1 MB" },
    { name: "starter-template.zip", size: "450 KB" },
  ],
  completed: false,
  nextLessonId: "l7",
  prevLessonId: "l5",
};

export default function LessonViewPage() {
  const params = useParams();
  const [isCompleted, setIsCompleted] = useState(lessonData.completed);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(240,240,245,0.35)", marginBottom: "20px" }}>
        <Link href="/courses" style={{ color: "inherit", textDecoration: "none" }}>קורסים</Link>
        <span>/</span>
        <Link href={`/courses/${params.courseId}`} style={{ color: "inherit", textDecoration: "none" }}>{lessonData.courseName}</Link>
        <span>/</span>
        <span style={{ color: "rgba(240,240,245,0.6)" }}>{lessonData.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main - Video + Content */}
        <div>
          {/* Video */}
          <div style={{ background: "#000", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%" }}>
              <iframe
                src={lessonData.videoUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Title + Actions */}
          <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0f0f5" }}>{lessonData.title}</h1>
              <button
                onClick={() => setIsCompleted(!isCompleted)}
                style={{ background: isCompleted ? "rgba(0,200,83,0.15)" : "#12122a", color: isCompleted ? "#00C853" : "rgba(240,240,245,0.6)", padding: "8px 16px", borderRadius: "10px", border: `1px solid ${isCompleted ? "rgba(0,200,83,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                {isCompleted ? "✓ הושלם" : "סמן כהושלם"}
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)", lineHeight: 1.6, marginBottom: "16px" }}>{lessonData.description}</p>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              {!showNote ? (
                <button onClick={() => setShowNote(true)} style={{ background: "none", border: "none", color: "rgba(240,240,245,0.5)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  📝 הוסף הערה למחברת
                </button>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="כתוב הערה... (חותמת זמן תישמר אוטומטית)" autoFocus style={{ flex: 1, background: "#12122a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px", color: "#f0f0f5", fontSize: "13px", outline: "none" }} />
                  <button onClick={() => { setNoteText(""); setShowNote(false); }} style={{ background: "#0000FF", color: "white", width: "36px", height: "36px", borderRadius: "8px", border: "none", cursor: "pointer" }}>→</button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {lessonData.prevLessonId ? (
              <Link href={`/courses/${params.courseId}/lessons/${lessonData.prevLessonId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.06)" }}>
                → שיעור קודם
              </Link>
            ) : <div />}
            {lessonData.nextLessonId && (
              <Link href={`/courses/${params.courseId}/lessons/${lessonData.nextLessonId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#0000FF", color: "white", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", textDecoration: "none", fontWeight: 600, boxShadow: "0 0 15px rgba(0,0,255,0.2)" }}>
                שיעור הבא ←
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Assignment */}
          {lessonData.hasAssignment && (
            <div style={{ background: "#0a0a1a", border: "1px solid rgba(0,0,255,0.15)", borderRadius: "16px", padding: "20px", boxShadow: "0 0 20px rgba(0,0,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span>📋</span>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>מטלה</h3>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>{lessonData.assignment.instructions}</p>
              <input placeholder="הדבק קישור כאן..." style={{ width: "100%", background: "#12122a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 12px", color: "#f0f0f5", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }} />
              <button style={{ width: "100%", background: "#0000FF", color: "white", padding: "10px", borderRadius: "10px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>הגש מטלה</button>
            </div>
          )}

          {/* Attachments */}
          <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", marginBottom: "12px" }}>📎 קבצים מצורפים</h3>
            {lessonData.attachments.map((file) => (
              <div key={file.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px" }}>
                <span>⬇️</span>
                <div>
                  <p style={{ fontSize: "13px", color: "#f0f0f5" }}>{file.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{file.size}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Discussion */}
          <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px" }}>
            <button style={{ width: "100%", background: "transparent", color: "rgba(240,240,245,0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              💬 דיון בפורום על השיעור הזה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
