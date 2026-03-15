"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Lesson {
  id: string;
  number: number;
  title: string;
  videoUrl: string;
  duration: string;
  description: string;
  skills: string[];
  hasAssignment: boolean;
  assignmentText: string;
  attachments: string[];
  notes: string;
  thumbnailUrl: string;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "coming_soon";
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  overflow: "hidden",
  transition: "border-color 0.2s, box-shadow 0.2s",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 12,
  border: "none",
  background: "#0000FF",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  
  transition: "all 0.2s",
  textDecoration: "none",
  display: "inline-block",
};

const btnSecondary: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(240,240,245,0.6)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.2s",
  textDecoration: "none",
  display: "inline-block",
};

const statusColors: Record<string, { bg: string; color: string; border: string; label: string }> = {
  draft: { bg: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.6)", border: "rgba(255,255,255,0.1)", label: "טיוטה" },
  active: { bg: "rgba(0,200,100,0.12)", color: "rgba(100,255,180,1)", border: "rgba(0,200,100,0.2)", label: "פעיל" },
  coming_soon: { bg: "rgba(255,179,0,0.12)", color: "#FFB300", border: "rgba(255,179,0,0.2)", label: "בקרוב" },
};

export default function CourseManagerPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bldr_courses");
      if (stored) setCourses(JSON.parse(stored));
    } catch {}
  }, []);

  const deleteCourse = (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הקורס?")) return;
    const updated = courses.filter((c) => c.id !== id);
    setCourses(updated);
    localStorage.setItem("bldr_courses", JSON.stringify(updated));
  };

  const duplicateCourse = (course: Course) => {
    const dup: Course = {
      ...JSON.parse(JSON.stringify(course)),
      id: crypto.randomUUID(),
      title: course.title + " (עותק)",
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // regenerate IDs
    dup.chapters = dup.chapters.map((ch: Chapter) => ({
      ...ch,
      id: crypto.randomUUID(),
      lessons: ch.lessons.map((l: Lesson) => ({ ...l, id: crypto.randomUUID() })),
    }));
    const updated = [...courses, dup];
    setCourses(updated);
    localStorage.setItem("bldr_courses", JSON.stringify(updated));
  };

  const totalLessons = (c: Course) => c.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "rgba(240,240,245,0.35)", textDecoration: "none" }}>
          ניהול
        </Link>
        <span style={{ color: "rgba(240,240,245,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,245,0.6)" }}>קורסים</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 8 }}>
          ניהול קורסים
        </h1>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", marginTop: 4 }}>
          צור, ערוך ונהל את הקורסים שלך
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <Link href="/admin/courses/new" style={btnPrimary}>צור קורס חדש</Link>
        <Link href="/admin/import-course" style={btnSecondary}>ייבוא מאקסל</Link>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: "80px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📚</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            אין קורסים עדיין
          </h2>
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.4)", marginBottom: 24 }}>
            צור את הקורס הראשון שלך או ייבא אחד מגיליון אלקטרוני
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/admin/courses/new" style={btnPrimary}>צור קורס חדש</Link>
            <Link href="/admin/import-course" style={btnSecondary}>ייבוא מאקסל</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {courses.map((course) => {
            const st = statusColors[course.status] || statusColors.draft;
            const lessons = totalLessons(course);
            return (
              <div
                key={course.id}
                style={card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 24px rgba(0,0,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 160,
                  background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #0a0a2a, #000044)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                  {!course.thumbnailUrl && (
                    <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(240,240,245,0.15)" }}>
                      {course.title}
                    </span>
                  )}
                  <span style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.border}`,
                  }}>
                    {st.label}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                    {course.title}
                  </h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(240,240,245,0.4)", marginBottom: 12 }}>
                    <span>{course.chapters.length} פרקים</span>
                    <span>{lessons} שיעורים</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(240,240,245,0.25)", marginBottom: 16 }}>
                    נוצר {new Date(course.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(240,240,245,0.6)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "none",
                        textAlign: "center",
                        display: "block",
                      }}
                    >
                      עריכה
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateCourse(course); }}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(240,240,245,0.6)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      שכפול
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: "1px solid rgba(255,60,60,0.2)",
                        background: "rgba(255,60,60,0.06)",
                        color: "rgba(255,120,120,0.8)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
