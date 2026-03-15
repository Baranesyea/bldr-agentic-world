"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlayIcon, LockIcon, CheckIcon, ChevronDownIcon, ClockIcon, ArrowLeftIcon } from "@/components/ui/icons";

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  duration?: string;
  number?: number;
  completed?: boolean;
  hasAssignment?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  number?: number;
  isLocked?: boolean;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  thumbnailUrl: string;
  chapters: Chapter[];
}

export default function CourseViewPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    // Load course from localStorage
    try {
      const courses: Course[] = JSON.parse(localStorage.getItem("bldr_courses") || "[]");
      const found = courses.find((c) => c.id === courseId);
      if (found) {
        setCourse(found);
        // Open first chapter by default
        if (found.chapters?.[0]) setOpenChapters([found.chapters[0].id]);
      }
    } catch {}
    try {
      setCompletedLessons(JSON.parse(localStorage.getItem("bldr_completed_lessons") || "[]"));
    } catch {}
  }, [courseId]);

  const toggle = (id: string) => {
    setOpenChapters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  if (!course) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "rgba(240,240,245,0.5)" }}>הקורס לא נמצא</h1>
        <Link href="/dashboard" style={{ color: "#3333FF", textDecoration: "none", fontSize: "14px" }}>חזרה לדשבורד</Link>
      </div>
    );
  }

  const allLessons = course.chapters?.flatMap((ch) => ch.lessons) || [];
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const firstUnwatched = allLessons.find((l) => !completedLessons.includes(l.id) && !l.completed);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #050510, #080820 30%, #050510)" }}>
      {/* Hero Header */}
      <div style={{ position: "relative", padding: "48px", paddingBottom: "32px", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Background thumbnail */}
        {course.thumbnailUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, #050510 20%, rgba(5,5,16,0.9) 60%, transparent 100%)" }} />
          </>
        )}
        {!course.thumbnailUrl && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #050510 0%, #0a0a2a 50%, #000033 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%, rgba(0,0,255,0.1) 0%, transparent 50%)" }} />
          </>
        )}

        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "rgba(240,240,245,0.35)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
            <ArrowLeftIcon size={14} /> חזרה לדשבורד
          </Link>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", marginBottom: "8px" }}>{course.title}</h1>
          {course.description && (
            <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "20px", maxWidth: "600px", lineHeight: 1.6 }}>{course.description}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1, maxWidth: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)" }}>{doneLessons} / {totalLessons} שיעורים</span>
                <span style={{ fontSize: "12px", color: "#3333FF", fontWeight: 600 }}>{progressPct}%</span>
              </div>
              <div style={{ background: "#12122a", borderRadius: "6px", height: "6px", overflow: "hidden" }}>
                <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "6px", boxShadow: "0 0 12px rgba(0,0,255,0.4)", transition: "width 0.3s" }} />
              </div>
            </div>
            {firstUnwatched && (
              <Link href={`/courses/${courseId}/lessons/${firstUnwatched.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", textDecoration: "none", boxShadow: "0 0 20px rgba(0,0,255,0.3)" }}>
                <PlayIcon size={14} /> {doneLessons > 0 ? "המשך מאיפה שהפסקת" : "התחל לצפות"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {course.chapters?.map((chapter, chIdx) => {
            const isOpen = openChapters.includes(chapter.id);
            const chLessons = chapter.lessons || [];
            const done = chLessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;

            return (
              <div key={chapter.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden", opacity: chapter.isLocked ? 0.5 : 1 }}>
                {/* Chapter Header */}
                <button
                  onClick={() => !chapter.isLocked && toggle(chapter.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "none", border: "none", cursor: chapter.isLocked ? "default" : "pointer", textAlign: "right" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: "rgba(240,240,245,0.35)", display: "flex", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      {chapter.isLocked ? <LockIcon size={16} /> : <ChevronDownIcon size={16} />}
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f5" }}>{chapter.title || `נושא ${chIdx + 1}`}</span>
                  </div>
                  <span style={{ background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    {done}/{chLessons.length}
                  </span>
                </button>

                {/* Lessons */}
                {isOpen && !chapter.isLocked && (
                  <div style={{ padding: "0 16px 16px" }}>
                    {chLessons.map((lesson) => {
                      const isDone = completedLessons.includes(lesson.id) || lesson.completed;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", textDecoration: "none", transition: "background 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(18,18,42,0.5)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "rgba(0,200,83,0.15)" : "rgba(0,0,255,0.1)", flexShrink: 0 }}>
                            {isDone ? <CheckIcon size={14} color="#00C853" /> : <PlayIcon size={14} color="#3333FF" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "14px", fontWeight: isDone ? 400 : 600, color: isDone ? "rgba(240,240,245,0.5)" : "#f0f0f5" }}>{lesson.title}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            {lesson.hasAssignment && <span style={{ fontSize: "11px", color: "#FFB300", background: "rgba(255,179,0,0.1)", padding: "2px 6px", borderRadius: "4px" }}>מטלה</span>}
                            {lesson.duration && lesson.duration !== "—" && (
                              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)", display: "inline-flex", alignItems: "center", gap: "4px" }}><ClockIcon size={12} /> {lesson.duration}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
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
