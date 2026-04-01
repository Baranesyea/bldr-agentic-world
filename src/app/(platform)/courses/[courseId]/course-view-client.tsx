"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlayIcon, LockIcon, CheckIcon, ChevronDownIcon, ClockIcon, ArrowLeftIcon } from "@/components/ui/icons";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { resolveImageUrl } from "@/lib/image-store";

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

const MOCK_STUDENTS = [
  { id: 1, name: "שירה כהן", designation: "סטודנטית", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face" },
  { id: 2, name: "דניאל לוי", designation: "מפתח", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face" },
  { id: 3, name: "נועה ברק", designation: "מעצבת UX", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
  { id: 4, name: "יונתן אברהם", designation: "יזם", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { id: 5, name: "מיכל רוזן", designation: "מנהלת מוצר", image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face" },
  { id: 6, name: "אורי גולן", designation: "מהנדס תוכנה", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face" },
];

interface Lesson {
  id: string;
  slug?: string;
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
  slug?: string;
  title: string;
  description: string;
  status: string;
  thumbnailUrl: string;
  chapters: Chapter[];
}

export default function CourseViewClient({ course }: { course: Course }) {
  const courseId = course.id;
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    // Open first chapter by default
    if (course.chapters?.[0]) setOpenChapters([course.chapters[0].id]);
    try {
      setCompletedLessons(JSON.parse(localStorage.getItem("bldr_completed_lessons") || "[]"));
    } catch {}
  }, [course]);

  const toggle = (id: string) => {
    setOpenChapters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const allLessons = course.chapters?.flatMap((ch) => ch.lessons) || [];
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const firstUnwatched = allLessons.find((l) => !completedLessons.includes(l.id) && !l.completed);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #050510, #080820 30%, #050510)" }}>
      {/* Hero Header */}
      <div style={{
        position: "relative", minHeight: "420px", overflow: "hidden",
        display: "flex", alignItems: "flex-end", padding: "48px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Background thumbnail — full width */}
        {course.thumbnailUrl ? (
          <>
            <ResolvedImg src={course.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Bottom gradient */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80%", background: "linear-gradient(to top, #050510 15%, rgba(5,5,16,0.85) 50%, transparent 100%)" }} />
            {/* Right gradient — strong for text readability (RTL) */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, #050510 0%, rgba(5,5,16,0.9) 25%, rgba(5,5,16,0.6) 45%, transparent 70%)" }} />
          </>
        ) : (
          <>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #050510 0%, #0a0a2a 40%, #000044 70%, #050510 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 60%, rgba(0,0,255,0.12) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, #050510, transparent)" }} />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <Link href="/dashboard" style={{ fontSize: "13px", color: "rgba(240,240,245,0.35)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
            <ArrowLeftIcon size={14} /> חזרה לדשבורד
          </Link>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "8px" }}>{course.title}</h1>
          {course.description && (
            <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "20px", lineHeight: 1.6 }}>{course.description}</p>
          )}

          {/* Progress bar */}
          <div style={{ maxWidth: "350px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)" }}>{doneLessons} / {totalLessons} שיעורים</span>
              <span style={{ fontSize: "12px", color: "#3333FF", fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div style={{ background: "#12122a", borderRadius: "6px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "6px", boxShadow: "0 0 12px rgba(0,0,255,0.4)", transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Animated tooltip avatars */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ width: "fit-content", marginRight: "20px" }}>
              <AnimatedTooltip items={MOCK_STUDENTS} />
            </div>
            <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", display: "block", marginTop: "8px" }}>32 סטודנטים לומדים עכשיו</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            {firstUnwatched && (
              <Link href={`/courses/${course.id}/lessons/${firstUnwatched.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "4px", fontWeight: 600, fontSize: "15px", textDecoration: "none", boxShadow: "0 0 30px rgba(0,0,255,0.35)" }}>
                <PlayIcon size={16} /> {doneLessons > 0 ? "המשך מאיפה שהפסקת" : "התחל לצפות"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(() => {
            const singleChapter = course.chapters?.length === 1;

            const renderLessons = (chLessons: typeof course.chapters[0]["lessons"]) =>
              chLessons.map((lesson) => {
                const isDone = completedLessons.includes(lesson.id) || lesson.completed;
                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "4px", textDecoration: "none", transition: "background 0.15s" }}
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
                      {lesson.duration && !/^[—–\-]+$/.test(lesson.duration.trim()) && lesson.duration.trim() !== "" && (
                        <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)", display: "inline-flex", alignItems: "center", gap: "4px" }}><ClockIcon size={12} /> {lesson.duration}</span>
                      )}
                    </div>
                  </Link>
                );
              });

            if (singleChapter) {
              const chapter = course.chapters[0];
              return (
                <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", padding: "8px 16px" }}>
                  {renderLessons(chapter.lessons || [])}
                </div>
              );
            }

            return course.chapters?.map((chapter, chIdx) => {
              const isOpen = openChapters.includes(chapter.id);
              const chLessons = chapter.lessons || [];
              const done = chLessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;

              return (
                <div key={chapter.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", opacity: chapter.isLocked ? 0.5 : 1 }}>
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
                    <span style={{ background: "#12122a", color: "rgba(240,240,245,0.6)", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                      {done}/{chLessons.length}
                    </span>
                  </button>

                  {/* Lessons */}
                  {isOpen && !chapter.isLocked && (
                    <div style={{ padding: "0 16px 16px" }}>
                      {renderLessons(chLessons)}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
