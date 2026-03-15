"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckIcon,
  NotebookIcon,
  AssignmentIcon,
  AttachmentIcon,
  DownloadIcon,
  ChevronDownIcon,
  ClockIcon,
  PlayIcon,
  LockIcon,
} from "@/components/ui/icons";

// ── Full course data ──
const courseData = {
  id: "1",
  title: "Mastering Claude Code",
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

// Flatten lessons for navigation
const allLessons = courseData.chapters.flatMap((ch) => ch.lessons);

const lessonDetails: Record<string, { description: string; videoUrl: string; assignment?: { instructions: string }; attachments: { name: string; size: string }[] }> = {
  l1: { description: "מבוא ל-Claude Code — מה הכלי, למי הוא מיועד ואיך הוא משנה את צורת העבודה.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", attachments: [] },
  l2: { description: "התקנה צעד אחר צעד, הגדרות ראשוניות וקונפיגורציה.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", attachments: [{ name: "Installation Guide.pdf", size: "1.2 MB" }] },
  l3: { description: "למד לכתוב CLAUDE.md אפקטיבי שמכוון את הסוכן לעבודה מדויקת.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "כתוב CLAUDE.md לפרויקט אישי שלך. שלח קישור ל-GitHub repo." }, attachments: [{ name: "CLAUDE.md Template.md", size: "15 KB" }] },
  l4: { description: "פקודות בסיסיות לעבודה יומיומית עם Claude Code.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", attachments: [{ name: "Commands Cheat Sheet.pdf", size: "800 KB" }] },
  l5: { description: "טכניקות מתקדמות לכתיבת Prompts שמייצרים תוצאות מדויקות.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "כתוב 5 prompts מתקדמים לתרחישים שונים. שלח כקובץ." }, attachments: [{ name: "Prompting Guide.pdf", size: "1.8 MB" }] },
  l6: { description: "למד איך לחבר כלים חיצוניים ל-Claude Code באמצעות Model Context Protocol.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "בנה MCP Server פשוט שמתחבר ל-API חיצוני. שלח קישור ל-GitHub repo." }, attachments: [{ name: "MCP Cheat Sheet.pdf", size: "2.1 MB" }, { name: "starter-template.zip", size: "450 KB" }] },
  l7: { description: "אוטומציות והוקים — איך לבנות תהליכים אוטומטיים עם Claude Code.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", attachments: [{ name: "Hooks Examples.zip", size: "320 KB" }] },
  l8: { description: "מבוא ל-Agent SDK — בניית סוכנים חכמים מאפס.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "בנה סוכן פשוט עם Agent SDK. שלח קישור לקוד." }, attachments: [{ name: "Agent SDK Docs.pdf", size: "3.5 MB" }] },
  l9: { description: "מערכות מרובות סוכנים — ארכיטקטורה, תקשורת וניהול.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "בנה מערכת של 2 סוכנים שעובדים יחד. שלח קישור." }, attachments: [{ name: "Multi-Agent Patterns.pdf", size: "2.8 MB" }] },
  l10: { description: "פרויקט סיום — בנה מערכת שלמה עם כל מה שלמדת בקורס.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", assignment: { instructions: "בנה פרויקט סיום שמשלב Claude Code, MCP, Hooks וסוכנים. הגש עד סוף השבוע." }, attachments: [{ name: "Final Project Brief.pdf", size: "500 KB" }] },
};

function formatTimestamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface LessonNote {
  id: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseName: string;
  content: string;
  timestamp: string;
  videoTimestamp: string;
  createdAt: string;
}

export default function LessonViewPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const courseId = params.courseId as string;

  // Find current lesson
  const currentLesson = allLessons.find((l) => l.id === lessonId) || allLessons[0];
  const details = lessonDetails[currentLesson.id] || lessonDetails.l6;
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Find which chapter the current lesson belongs to
  const currentChapterId = courseData.chapters.find((ch) => ch.lessons.some((l) => l.id === currentLesson.id))?.id || "ch1";

  // State
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [openChapters, setOpenChapters] = useState<string[]>([currentChapterId]);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
  const [videoTimer, setVideoTimer] = useState(0);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [fadeIn, setFadeIn] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Load completed lessons + notes + settings from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bldr_completed_lessons") || "[]");
      setCompletedLessons(stored);
    } catch {}
    try {
      const all: LessonNote[] = JSON.parse(localStorage.getItem("bldr_notes") || "[]");
      setSavedNotes(all.filter((n) => n.lessonId === currentLesson.id));
    } catch {}
    try {
      const settings = JSON.parse(localStorage.getItem("bldr_user_settings") || "{}");
      if (typeof settings.autoPlayNext === "boolean") setAutoPlayNext(settings.autoPlayNext);
    } catch {}
    // Reset timers on lesson change
    setVideoTimer(0);
    setAutoCompleted(false);
    setShowToast(false);
    setShowCountdown(false);
    setCountdown(5);
    setFadeIn(true);
    const t = setTimeout(() => setFadeIn(false), 600);
    return () => clearTimeout(t);
  }, [currentLesson.id]);

  // Video timestamp timer — only runs when user clicks play (isPlaying)
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setVideoTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [currentLesson.id, isPlaying]);

  const isLessonCompleted = useCallback(
    (id: string) => completedLessons.includes(id),
    [completedLessons]
  );

  const markCompleted = useCallback(
    (id: string) => {
      setCompletedLessons((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        localStorage.setItem("bldr_completed_lessons", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const toggleCompleted = useCallback(
    (id: string) => {
      setCompletedLessons((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem("bldr_completed_lessons", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // Auto-complete after 30 seconds of playback (demo)
  useEffect(() => {
    if (!isPlaying || autoCompleted || isLessonCompleted(currentLesson.id)) return;
    if (videoTimer >= 30) {
      markCompleted(currentLesson.id);
      setAutoCompleted(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [videoTimer, autoCompleted, currentLesson.id, isLessonCompleted, markCompleted]);

  // Auto-play next countdown
  useEffect(() => {
    if (!autoCompleted || !autoPlayNext || !nextLesson || showCountdown) return;
    if (isLessonCompleted(currentLesson.id) && autoCompleted) {
      const t = setTimeout(() => setShowCountdown(true), 500);
      return () => clearTimeout(t);
    }
  }, [autoCompleted, autoPlayNext, nextLesson, showCountdown, currentLesson.id, isLessonCompleted]);

  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0 && nextLesson) {
      router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showCountdown, countdown, nextLesson, courseId, router]);

  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    const note: LessonNote = {
      id: crypto.randomUUID(),
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      courseId: courseData.id,
      courseName: courseData.title,
      content: noteText.trim(),
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      videoTimestamp: formatTimestamp(videoTimer),
      createdAt: new Date().toISOString(),
    };
    const all: LessonNote[] = JSON.parse(localStorage.getItem("bldr_notes") || "[]");
    all.unshift(note);
    localStorage.setItem("bldr_notes", JSON.stringify(all));
    setSavedNotes((prev) => [note, ...prev]);
    setNoteText("");
  };

  const deleteNote = (noteId: string) => {
    const all: LessonNote[] = JSON.parse(localStorage.getItem("bldr_notes") || "[]");
    const filtered = all.filter((n) => n.id !== noteId);
    localStorage.setItem("bldr_notes", JSON.stringify(filtered));
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Compute progress
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;
  const progressPct = Math.round((doneLessons / totalLessons) * 100);

  const isCurrentCompleted = isLessonCompleted(currentLesson.id) || currentLesson.completed;

  return (
    <>
      <style>{`
        @keyframes bldrFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bldrCountdownRing {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 283; }
        }
        @keyframes bldrToastIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "flex",
        minHeight: "calc(100vh - 60px)",
        animation: fadeIn ? "bldrFadeIn 0.5s ease-out" : undefined,
      }}>
        {/* ── RIGHT SIDEBAR: Course Nav ── */}
        <div style={{
          width: "280px",
          minWidth: "280px",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a1a",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Progress header */}
          <div style={{ padding: "16px 16px 12px" }}>
            <Link href={`/courses/${courseId}`} style={{ textDecoration: "none" }}>
              <h3 style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#f0f0f5",
                marginBottom: "4px",
                fontFamily: "var(--font-heading-en)",
                cursor: "pointer",
              }}>
                {courseData.title}
              </h3>
            </Link>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.5)" }}>{doneLessons} / {totalLessons} שיעורים</span>
              <span style={{ fontSize: "11px", color: "#3333FF", fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Chapters */}
          <div style={{ flex: 1, padding: "0 8px 16px" }}>
            {courseData.chapters.map((chapter) => {
              const isOpen = openChapters.includes(chapter.id);
              const chDone = chapter.lessons.filter((l) => completedLessons.includes(l.id) || l.completed).length;

              return (
                <div key={chapter.id} style={{ marginBottom: "4px" }}>
                  <button
                    onClick={() => !chapter.isLocked && toggleChapter(chapter.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 8px",
                      background: "none",
                      border: "none",
                      cursor: chapter.isLocked ? "default" : "pointer",
                      textAlign: "right",
                      borderRadius: "8px",
                      opacity: chapter.isLocked ? 0.4 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "rgba(240,240,245,0.35)", display: "flex", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        {chapter.isLocked ? <LockIcon size={13} /> : <ChevronDownIcon size={13} />}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(240,240,245,0.8)" }}>{chapter.title}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.35)" }}>{chDone}/{chapter.lessons.length}</span>
                  </button>

                  {isOpen && !chapter.isLocked && (
                    <div style={{ padding: "0 4px 4px" }}>
                      {chapter.lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const isDone = completedLessons.includes(lesson.id) || lesson.completed;
                        return (
                          <Link
                            key={lesson.id}
                            href={`/courses/${courseId}/lessons/${lesson.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              textDecoration: "none",
                              background: isCurrent ? "rgba(0,0,255,0.15)" : "transparent",
                              borderRight: isCurrent ? "3px solid #0000FF" : "3px solid transparent",
                              transition: "background 0.15s",
                            }}
                          >
                            {/* Status */}
                            <div style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isDone ? "rgba(0,200,83,0.15)" : isCurrent ? "rgba(0,0,255,0.2)" : "rgba(255,255,255,0.04)",
                              flexShrink: 0,
                            }}>
                              {isDone ? (
                                <CheckIcon size={10} color="#00C853" />
                              ) : isCurrent ? (
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0000FF" }} />
                              ) : (
                                <PlayIcon size={8} color="rgba(240,240,245,0.3)" />
                              )}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <p style={{
                                fontSize: "12px",
                                fontWeight: isCurrent ? 600 : 400,
                                color: isCurrent ? "#f0f0f5" : isDone ? "rgba(240,240,245,0.4)" : "rgba(240,240,245,0.7)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}>{lesson.title}</p>
                            </div>

                            <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.3)", flexShrink: 0 }}>{lesson.duration}</span>
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

        {/* ── CENTER: Video + Info ── */}
        <div style={{
          flex: 1,
          padding: "24px 32px",
          position: "relative",
          minWidth: 0,
        }}>
          {/* Video */}
          <div style={{ background: "#000", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%" }}>
              <iframe
                src={details.videoUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* Play overlay — click to start timer */}
              {!isPlaying && (
                <div
                  onClick={() => setIsPlaying(true)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 5,
                    transition: "opacity 0.3s",
                  }}
                >
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(0,0,255,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 30px rgba(0,0,255,0.4)",
                  }}>
                    <PlayIcon size={28} color="white" />
                  </div>
                </div>
              )}

              {/* Countdown overlay */}
              {showCountdown && nextLesson && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  zIndex: 10,
                }}>
                  {/* Ring */}
                  <div style={{ position: "relative", width: "80px", height: "80px" }}>
                    <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <circle
                        cx="50" cy="50" r="45" fill="none" stroke="#0000FF" strokeWidth="4"
                        strokeDasharray="283"
                        style={{ animation: "bldrCountdownRing 5s linear forwards" }}
                      />
                    </svg>
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#f0f0f5",
                    }}>{countdown}</span>
                  </div>
                  <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.8)" }}>
                    השיעור הבא מתחיל בעוד {countdown} שניות...
                  </p>
                  <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>{nextLesson.title}</p>
                  <button
                    onClick={() => { setShowCountdown(false); setAutoCompleted(false); }}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(240,240,245,0.8)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      padding: "8px 20px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title + Mark Complete */}
          <div style={{
            background: "#0a0a1a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0f0f5" }}>{currentLesson.title}</h1>
              <button
                onClick={() => toggleCompleted(currentLesson.id)}
                style={{
                  background: isCurrentCompleted ? "rgba(0,200,83,0.15)" : "#12122a",
                  color: isCurrentCompleted ? "#00C853" : "rgba(240,240,245,0.6)",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: `1px solid ${isCurrentCompleted ? "rgba(0,200,83,0.3)" : "rgba(255,255,255,0.06)"}`,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                {isCurrentCompleted ? <><CheckIcon size={14} /> הושלם</> : "סמן כהושלם"}
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.6)", lineHeight: 1.6 }}>{details.description}</p>
          </div>

          {/* Assignment */}
          {details.assignment && (
            <div style={{
              background: "#0a0a1a",
              border: "1px solid rgba(0,0,255,0.15)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 0 20px rgba(0,0,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <AssignmentIcon size={16} />
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>מטלה</h3>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>
                {details.assignment.instructions}
              </p>
              <input
                placeholder="הדבק קישור כאן..."
                style={{
                  width: "100%",
                  background: "#12122a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#f0f0f5",
                  fontSize: "13px",
                  outline: "none",
                  marginBottom: "8px",
                  boxSizing: "border-box",
                }}
              />
              <button style={{
                width: "100%",
                background: "#0000FF",
                color: "white",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}>
                הגש מטלה
              </button>
            </div>
          )}

          {/* Attachments */}
          {details.attachments.length > 0 && (
            <div style={{
              background: "#0a0a1a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AttachmentIcon size={14} /> קבצים מצורפים
              </h3>
              {details.attachments.map((file) => (
                <div key={file.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px" }}>
                  <DownloadIcon size={16} />
                  <div>
                    <p style={{ fontSize: "13px", color: "#f0f0f5" }}>{file.name}</p>
                    <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#12122a",
                  color: "rgba(240,240,245,0.6)",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                שיעור קודם
              </Link>
            ) : <div />}
            {nextLesson && (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#0000FF",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  textDecoration: "none",
                  fontWeight: 600,
                  boxShadow: "0 0 15px rgba(0,0,255,0.2)",
                }}
              >
                שיעור הבא
              </Link>
            )}
          </div>
        </div>

        {/* ── LEFT SIDEBAR: Notes ── */}
        <div style={{
          width: "300px",
          minWidth: "300px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a1a",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <NotebookIcon size={16} color="rgba(240,240,245,0.6)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>הערות</h3>
            <span style={{
              fontSize: "11px",
              color: "rgba(240,240,245,0.35)",
              background: "rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: "8px",
            }}>
              {savedNotes.length}
            </span>
          </div>

          {/* Add note area */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Timestamp display */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              background: "rgba(0,0,255,0.08)",
              padding: "6px 10px",
              borderRadius: "8px",
              width: "fit-content",
            }}>
              <ClockIcon size={12} color="#3333FF" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#3333FF", fontFamily: "var(--font-heading-en)" }}>
                {formatTimestamp(videoTimer)}
              </span>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } }}
              placeholder="כתוב הערה..."
              style={{
                width: "100%",
                background: "#12122a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#f0f0f5",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                minHeight: "60px",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={saveNote}
              disabled={!noteText.trim()}
              style={{
                width: "100%",
                marginTop: "8px",
                background: noteText.trim() ? "#0000FF" : "rgba(0,0,255,0.3)",
                color: "white",
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: noteText.trim() ? "pointer" : "default",
              }}
            >
              שמור הערה
            </button>
          </div>

          {/* Notes list */}
          <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {savedNotes.length === 0 && (
              <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.25)", textAlign: "center", marginTop: "24px" }}>
                אין הערות עדיין לשיעור הזה
              </p>
            )}
            {savedNotes.map((note) => (
              <div key={note.id} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#3333FF",
                    background: "rgba(0,0,255,0.1)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontFamily: "var(--font-heading-en)",
                  }}>
                    {note.videoTimestamp || note.timestamp}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(240,240,245,0.2)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 4px",
                    }}
                  >
                    x
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>{note.content}</p>
                <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.2)", marginTop: "4px", display: "block" }}>
                  {new Date(note.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,200,83,0.15)",
          border: "1px solid rgba(0,200,83,0.3)",
          color: "#00C853",
          padding: "10px 20px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          zIndex: 1000,
          animation: "bldrToastIn 0.3s ease-out",
          backdropFilter: "blur(10px)",
        }}>
          השיעור סומן כהושלם ✓
        </div>
      )}
    </>
  );
}
