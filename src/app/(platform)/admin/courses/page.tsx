"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-store";
import { ShareButton } from "@/components/ui/share-button";

/** Image component that resolves idb:// URLs from IndexedDB */
function ResolvedImg({ src, alt, style }: { src: string; alt: string; style: React.CSSProperties }) {
  const [resolved, setResolved] = React.useState("");
  React.useEffect(() => {
    if (!src) return;
    if (src.startsWith("idb://")) {
      resolveImageUrl(src).then(setResolved);
    } else {
      setResolved(src);
    }
  }, [src]);
  if (!resolved) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt} style={style} />;
}

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
  featured?: boolean;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  overflow: "hidden",
  transition: "border-color 0.2s, box-shadow 0.2s",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 4,
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
  borderRadius: 4,
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

const DEMO_IDS = ["demo-c1", "demo-c2", "demo-c3", "demo-c4", "demo-c5", "demo-c6"];

function getDemoCourses(): Course[] {
  return [
    { id: "demo-c1", title: "Mastering Claude Code", description: "למד איך להשתמש ב-Claude Code כמו מקצוען", status: "active", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [{ id: "ch1", number: 1, title: "יסודות", lessons: Array.from({ length: 8 }, (_, i) => ({ id: `dl${i}`, number: i + 1, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—", description: "", skills: [], hasAssignment: false, assignmentText: "", attachments: [], notes: "", thumbnailUrl: "" })) }] },
    { id: "demo-c2", title: "Vibe Coding Fundamentals", description: "למד לבנות אפליקציות עם AI", status: "active", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [{ id: "ch1", number: 1, title: "מבוא", lessons: Array.from({ length: 6 }, (_, i) => ({ id: `dl${i}`, number: i + 1, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—", description: "", skills: [], hasAssignment: false, assignmentText: "", attachments: [], notes: "", thumbnailUrl: "" })) }] },
    { id: "demo-c3", title: "Building AI Agents", description: "בנה סוכני AI חכמים", status: "active", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [{ id: "ch1", number: 1, title: "יסודות", lessons: Array.from({ length: 5 }, (_, i) => ({ id: `dl${i}`, number: i + 1, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—", description: "", skills: [], hasAssignment: false, assignmentText: "", attachments: [], notes: "", thumbnailUrl: "" })) }] },
    { id: "demo-c4", title: "Automation Mastery", description: "אוטומציות חכמות לעסקים", status: "active", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [{ id: "ch1", number: 1, title: "מבוא", lessons: Array.from({ length: 4 }, (_, i) => ({ id: `dl${i}`, number: i + 1, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—", description: "", skills: [], hasAssignment: false, assignmentText: "", attachments: [], notes: "", thumbnailUrl: "" })) }] },
    { id: "demo-c5", title: "AI Product Management", description: "ניהול מוצר בעולם ה-AI", status: "coming_soon", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [] },
    { id: "demo-c6", title: "Advanced Prompt Engineering", description: "טכניקות מתקדמות לכתיבת פרומפטים", status: "coming_soon", featured: false, thumbnailUrl: "", createdAt: "", updatedAt: "", chapters: [] },
  ];
}

export default function CourseManagerPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "order">("grid");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored: Course[] = JSON.parse(localStorage.getItem("bldr_courses") || "[]");
      // Merge with demo courses that haven't been deleted
      const userIds = new Set(stored.map((c) => c.id));
      const deletedDemos: string[] = JSON.parse(localStorage.getItem("bldr_deleted_demos") || "[]");
      const deletedSet = new Set(deletedDemos);
      const demos = getDemoCourses().filter((d) => !userIds.has(d.id) && !deletedSet.has(d.id));
      const merged = [...stored, ...demos];
      // Apply saved order
      const orderStr = localStorage.getItem("bldr_course_order");
      if (orderStr) {
        const order: string[] = JSON.parse(orderStr);
        setCourses(sortByOrder(merged, order));
      } else {
        setCourses(merged);
      }
    } catch {}
  }, []);

  const sortByOrder = (list: Course[], order: string[]): Course[] => {
    const orderMap = new Map(order.map((id, i) => [id, i]));
    return [...list].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      return ai - bi;
    });
  };

  const saveOrder = useCallback((newCourses: Course[]) => {
    const ids = newCourses.map((c) => c.id);
    localStorage.setItem("bldr_course_order", JSON.stringify(ids));
    localStorage.setItem("bldr_courses", JSON.stringify(newCourses));
  }, []);

  const deleteCourse = (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הקורס?")) return;
    // If it's a demo course, track it in deleted list
    if (DEMO_IDS.includes(id)) {
      const deleted: string[] = JSON.parse(localStorage.getItem("bldr_deleted_demos") || "[]");
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem("bldr_deleted_demos", JSON.stringify(deleted));
      }
    }
    const updated = courses.filter((c) => c.id !== id);
    setCourses(updated);
    const realCourses = updated.filter((c) => !DEMO_IDS.includes(c.id));
    localStorage.setItem("bldr_courses", JSON.stringify(realCourses));
    const ids = updated.map((c) => c.id);
    localStorage.setItem("bldr_course_order", JSON.stringify(ids));
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
    dup.chapters = dup.chapters.map((ch: Chapter) => ({
      ...ch,
      id: crypto.randomUUID(),
      lessons: ch.lessons.map((l: Lesson) => ({ ...l, id: crypto.randomUUID() })),
    }));
    const updated = [...courses, dup];
    setCourses(updated);
    localStorage.setItem("bldr_courses", JSON.stringify(updated));
    const ids = updated.map((c) => c.id);
    localStorage.setItem("bldr_course_order", JSON.stringify(ids));
  };

  const totalLessons = (c: Course) => c.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex === null || dragIndex === index) {
      setDropIndex(null);
      return;
    }
    // Determine if we should show indicator above or below
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const targetIdx = e.clientY < midY ? index : index + 1;
    if (targetIdx !== dragIndex && targetIdx !== dragIndex + 1) {
      setDropIndex(targetIdx);
    } else {
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dropIndex === null) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    const newCourses = [...courses];
    const [moved] = newCourses.splice(dragIndex, 1);
    const insertAt = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
    newCourses.splice(insertAt, 0, moved);
    setCourses(newCourses);
    saveOrder(newCourses);
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

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
      <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/admin/courses/new" style={btnPrimary}>צור קורס חדש</Link>
          <Link href="/admin/import-course" style={btnSecondary}>ייבוא מאקסל</Link>
        </div>
        {courses.length > 0 && (
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "7px 16px", borderRadius: 4, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                background: viewMode === "grid" ? "rgba(0,0,255,0.2)" : "transparent",
                color: viewMode === "grid" ? "#5555FF" : "rgba(240,240,245,0.4)",
                transition: "all 0.2s",
              }}
            >
              תצוגת כרטיסים
            </button>
            <button
              onClick={() => setViewMode("order")}
              style={{
                padding: "7px 16px", borderRadius: 4, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                background: viewMode === "order" ? "rgba(0,0,255,0.2)" : "transparent",
                color: viewMode === "order" ? "#5555FF" : "rgba(240,240,245,0.4)",
                transition: "all 0.2s",
              }}
            >
              סדר תכנים
            </button>
          </div>
        )}
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
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
      ) : viewMode === "grid" ? (
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
                  background: "linear-gradient(135deg, #0a0a2a, #000044)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {course.thumbnailUrl ? (
                    <ResolvedImg src={course.thumbnailUrl} alt={course.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(240,240,245,0.6)", fontSize: 12, fontWeight: 500,
                        cursor: "pointer", textDecoration: "none", textAlign: "center", display: "block",
                      }}
                    >
                      עריכה
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateCourse(course); }}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(240,240,245,0.6)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      שכפול
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 4,
                        border: "1px solid rgba(255,60,60,0.2)",
                        background: "rgba(255,60,60,0.06)",
                        color: "rgba(255,120,120,0.8)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      מחיקה
                    </button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ShareButton
                      type="course"
                      name={course.title}
                      courseId={course.id}
                      courseTitle={course.title}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Order Mode ── */
        <div>
          <div style={{
            background: "rgba(0,0,255,0.06)", border: "1px solid rgba(0,0,255,0.15)",
            borderRadius: 4, padding: "12px 16px", marginBottom: 20,
            fontSize: 13, color: "rgba(240,240,245,0.5)", lineHeight: 1.6,
          }}>
            גרור את הקורסים כדי לשנות את סדר ההצגה בדשבורד. הקורס המומלץ (Hero) נקבע בעריכת הקורס ולא מושפע מהסדר.
          </div>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {courses.map((course, index) => {
              const st = statusColors[course.status] || statusColors.draft;
              const lessons = totalLessons(course);
              const isDragging = dragIndex === index;
              const showDropAbove = dropIndex === index;
              const showDropBelow = dropIndex === courses.length && index === courses.length - 1;

              return (
                <div key={course.id} style={{ position: "relative" }}>
                  {/* Drop indicator above */}
                  {showDropAbove && (
                    <div style={{
                      height: 2, background: "#0000FF",
                      borderRadius: 1, margin: "0 16px",
                      boxShadow: "0 0 8px rgba(0,0,255,0.5)",
                    }} />
                  )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px",
                      background: isDragging ? "rgba(0,0,255,0.08)" : "rgba(255,255,255,0.03)",
                      border: isDragging ? "1px solid rgba(0,0,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4,
                      marginBottom: 6,
                      opacity: isDragging ? 0.5 : 1,
                      transform: isDragging ? "scale(1.02)" : "scale(1)",
                      transition: "opacity 0.2s, transform 0.2s, background 0.2s, border-color 0.2s",
                      cursor: "grab",
                    }}
                  >
                    {/* Drag handle — right side in RTL */}
                    <div
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        width: 24, minWidth: 24, height: 36,
                        color: "rgba(240,240,245,0.2)", fontSize: 16, letterSpacing: 2,
                        cursor: "grab", userSelect: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(240,240,245,0.5)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(240,240,245,0.2)"; }}
                    >
                      <span style={{ lineHeight: 0.7 }}>⋮⋮</span>
                    </div>

                    {/* Thumbnail */}
                    <div style={{
                      width: 60, height: 40, borderRadius: 6, flexShrink: 0, overflow: "hidden",
                      background: "linear-gradient(135deg, #0a0a2a, #000044)",
                      position: "relative",
                    }}>
                      {course.thumbnailUrl && (
                        <ResolvedImg src={course.thumbnailUrl} alt={course.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.title}
                        </span>
                        {course.featured && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6,
                            background: "rgba(0,0,255,0.15)", color: "#5555FF", whiteSpace: "nowrap",
                          }}>
                            מומלץ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {st.label}
                    </span>

                    {/* Lesson count */}
                    <span style={{ fontSize: 12, color: "rgba(240,240,245,0.35)", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {lessons} שיעורים
                    </span>
                  </div>
                  {/* Drop indicator below last item */}
                  {showDropBelow && (
                    <div style={{
                      height: 2, background: "#0000FF",
                      borderRadius: 1, margin: "0 16px",
                      boxShadow: "0 0 8px rgba(0,0,255,0.5)",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
