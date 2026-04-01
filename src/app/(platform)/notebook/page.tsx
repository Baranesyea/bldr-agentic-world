"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NotebookIcon } from "@/components/ui/icons";

interface LessonNote {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseName: string;
  content: string;
  timestamp: string;
  videoTimestamp?: string;
  createdAt: string;
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    try {
      const all: LessonNote[] = JSON.parse(localStorage.getItem("bldr_notes") || "[]");
      setNotes(all);
    } catch {}
  }, []);

  const courses = Array.from(new Set(notes.map((n) => n.courseName)));

  const filtered = notes.filter((n) => {
    const matchesSearch =
      !search ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.lessonTitle.toLowerCase().includes(search.toLowerCase()) ||
      n.courseName.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = filter === "all" || n.courseName === filter;
    return matchesSearch && matchesCourse;
  });

  const deleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    localStorage.setItem("bldr_notes", JSON.stringify(updated));
    setNotes(updated);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "היום";
    if (diff === 1) return "אתמול";
    if (diff < 7) return `לפני ${diff} ימים`;
    if (diff < 30) return `לפני ${Math.floor(diff / 7)} שבועות`;
    return d.toLocaleDateString("he-IL");
  };

  // Group by course
  const grouped = filtered.reduce<Record<string, LessonNote[]>>((acc, n) => {
    if (!acc[n.courseName]) acc[n.courseName] = [];
    acc[n.courseName].push(n);
    return acc;
  }, {});

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>המחברת שלי</h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "24px", fontSize: "14px" }}>
        כל ההערות שלך ממקום אחד · {notes.length} הערות
      </p>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          placeholder="חפש בהערות..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }}
        />
        {courses.length > 1 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none", appearance: "none" as const, minWidth: "180px" }}
          >
            <option value="all">כל הקורסים</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ marginBottom: "16px", opacity: 0.3, display: "flex", justifyContent: "center" }}><NotebookIcon size={48} /></div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "rgba(240,240,245,0.7)", marginBottom: "8px" }}>אין הערות עדיין</h2>
          <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", marginBottom: "20px" }}>
            הוסף הערות מתוך שיעורים ותראה אותן כאן
          </p>
          <Link href="/courses" style={{ color: "#f0f0f5", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            עבור לקורסים →
          </Link>
        </div>
      )}

      {/* Notes grouped by course */}
      {filtered.length > 0 && Object.entries(grouped).map(([courseName, courseNotes]) => (
        <div key={courseName} style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "rgba(240,240,245,0.7)", marginBottom: "12px" }}>
            {courseName}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {courseNotes.map((note) => (
              <div key={note.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <Link
                      href={`/courses/${note.courseId}/lessons/${note.lessonId}`}
                      style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5", textDecoration: "none" }}
                    >
                      {note.lessonTitle}
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      {note.videoTimestamp && (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#f0f0f5", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "6px", fontFamily: "var(--font-merriweather)" }}>
                          {note.videoTimestamp}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Link
                      href={`/courses/${note.courseId}/lessons/${note.lessonId}${note.videoTimestamp ? `?t=${note.videoTimestamp}` : ""}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "11px", color: "#f0f0f5", textDecoration: "none",
                        padding: "4px 10px", borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      קח אותי לשם
                    </Link>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{ background: "none", border: "none", color: "rgba(240,240,245,0.7)", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.6 }}>{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* No results for search */}
      {notes.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(240,240,245,0.7)" }}>
          <p>לא נמצאו הערות עבור &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
