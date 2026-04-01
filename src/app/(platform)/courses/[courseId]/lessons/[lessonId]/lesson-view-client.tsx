"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LessonDiscussion } from "@/components/course/lesson-discussion";
import {
  CheckIcon,
  NotebookIcon,
  AssignmentIcon,
  AttachmentIcon,
  DownloadIcon,
  ChevronDownIcon,
  ClockIcon,
} from "@/components/ui/icons";
import VideoPlayer from "@/components/ui/video-player";
import { ShareButton } from "@/components/ui/share-button";
import { useAnalytics } from "@/hooks/useAnalytics";

// ── Types ──
interface CourseLesson {
  id: string;
  slug?: string;
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

interface CourseChapter {
  id: string;
  number: number;
  title: string;
  lessons: CourseLesson[];
}

interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  chapters: CourseChapter[];
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function convertToEmbedUrl(url: string, autoplay = false): string {
  if (!url) return "";
  const ap = autoplay ? 1 : 0;
  if (url.includes("player.vimeo.com")) {
    return autoplay ? url.replace("autoplay=0", "autoplay=1") : url;
  }
  if (url.includes("/embed/")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${ap}&title=0&byline=0&portrait=0&share=0&watchlater=0&like=0`;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=${ap}&rel=0&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=${ap}&rel=0&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`;
  const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}

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

export default function LessonViewClient({ course, lessonId }: { course: Course; lessonId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = course.id;
  const { trackEvent, trackVideoProgress } = useAnalytics();
  const videoProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTrackedPlayRef = useRef(false);

  // Flatten all lessons for navigation
  const allLessons = useMemo(() => {
    return course.chapters.flatMap((ch) => ch.lessons);
  }, [course]);

  // Find current lesson
  const currentLesson = useMemo(() => allLessons.find((l) => l.id === lessonId) || null, [allLessons, lessonId]);
  const currentIndex = useMemo(() => (currentLesson ? allLessons.findIndex((l) => l.id === currentLesson.id) : -1), [allLessons, currentLesson]);
  const lessonNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    allLessons.forEach((l, i) => map.set(l.id, i + 1));
    return map;
  }, [allLessons]);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Find which chapter the current lesson belongs to
  const currentChapterId = useMemo(() => {
    if (!currentLesson) return "";
    return course.chapters.find((ch) => ch.lessons.some((l) => l.id === currentLesson.id))?.id || "";
  }, [course, currentLesson]);

  // State
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
  const [videoTimer, setVideoTimer] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [fadeIn, setFadeIn] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [notesCollapsed, setNotesCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bldr_notes_collapsed") === "true";
    }
    return false;
  });
  const [lessonsCollapsed, setLessonsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bldr_lessons_collapsed") === "true";
    }
    return false;
  });

  // Open current chapter when it's known
  useEffect(() => {
    if (currentChapterId) {
      setOpenChapters((prev) => prev.includes(currentChapterId) ? prev : [...prev, currentChapterId]);
    }
  }, [currentChapterId]);

  // Load completed lessons + notes + settings from localStorage
  useEffect(() => {
    if (!currentLesson) return;
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
    setVideoTimer(0);
    setAutoCompleted(false);
    setNavigatingTo(null);
    setShowToast(false);
    setShowCountdown(false);
    setCountdown(5);
    setIsPlaying(false);
    setFadeIn(true);
    const t = setTimeout(() => setFadeIn(false), 600);
    return () => clearTimeout(t);
  }, [currentLesson?.id]);

  // Track video_play when playback starts
  useEffect(() => {
    if (isPlaying && currentLesson && !hasTrackedPlayRef.current) {
      hasTrackedPlayRef.current = true;
      trackEvent("video_play", { lessonId: currentLesson.id, courseId, lessonTitle: currentLesson.title });
    }
  }, [isPlaying, currentLesson, courseId, trackEvent]);

  // Reset play tracking when lesson changes
  useEffect(() => {
    hasTrackedPlayRef.current = false;
  }, [currentLesson?.id]);

  // Track video_progress every 30 seconds while playing
  useEffect(() => {
    if (!isPlaying || !currentLesson) {
      if (videoProgressIntervalRef.current) {
        clearInterval(videoProgressIntervalRef.current);
        videoProgressIntervalRef.current = null;
      }
      return;
    }
    videoProgressIntervalRef.current = setInterval(() => {
      trackVideoProgress(currentLesson.id, courseId, videoTimer, 0);
    }, 30000);
    return () => {
      if (videoProgressIntervalRef.current) clearInterval(videoProgressIntervalRef.current);
    };
  }, [isPlaying, currentLesson?.id, courseId, videoTimer, trackVideoProgress]);

  // Video timestamp — poll real position from Vimeo/YouTube iframe
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const src = iframe.src || "";
      if (src.includes("vimeo")) {
        iframe.contentWindow.postMessage('{"method":"getCurrentTime"}', "*");
      } else if (src.includes("youtube")) {
        iframe.contentWindow.postMessage('{"event":"listening"}', "*");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Listen for video end events from Vimeo/YouTube iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);
          if (data.event === "ended" || data.event === "finish") {
            handleVideoEnded();
          }
          if (data.event === "play" || data.event === "playProgress") {
            if (!isPlaying) setIsPlaying(true);
            if (data.data?.seconds != null) setVideoTimer(Math.floor(data.data.seconds));
          }
          if (data.event === "pause") {
            setIsPlaying(false);
            if (data.data?.seconds != null) setVideoTimer(Math.floor(data.data.seconds));
          }
          // Vimeo getCurrentTime response
          if (data.method === "getCurrentTime" && data.value != null) {
            setVideoTimer(Math.floor(data.value));
          }
        }
        if (typeof event.data === "object" && event.data?.event === "onStateChange") {
          if (event.data.info === 0) handleVideoEnded();
          if (event.data.info === 1 && !isPlaying) setIsPlaying(true);
          if (event.data.info === 2) setIsPlaying(false);
        }
        if (typeof event.data === "object" && event.data?.event === "infoDelivery" && event.data?.info?.currentTime != null) {
          setVideoTimer(Math.floor(event.data.info.currentTime));
        }
      } catch {}
    };

    const handleVideoEnded = () => {
      if (currentLesson && !isLessonCompleted(currentLesson.id)) {
        markCompleted(currentLesson.id);
        setAutoCompleted(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      if (autoPlayNext && nextLesson) {
        setShowCountdown(true);
      }
    };

    window.addEventListener("message", handleMessage);

    const iframe = iframeRef.current;
    if (iframe?.contentWindow && iframe.src?.includes("vimeo")) {
      setTimeout(() => {
        iframe.contentWindow?.postMessage('{"method":"addEventListener","value":"ended"}', "*");
        iframe.contentWindow?.postMessage('{"method":"addEventListener","value":"play"}', "*");
        iframe.contentWindow?.postMessage('{"method":"addEventListener","value":"pause"}', "*");
        iframe.contentWindow?.postMessage('{"method":"addEventListener","value":"playProgress"}', "*");

        // Seek to timestamp from URL ?t=MM:SS or ?t=HH:MM:SS
        const tParam = searchParams.get("t");
        if (tParam) {
          const parts = tParam.split(":").map(Number);
          const seconds = parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts.length === 2 ? parts[0]*60+parts[1] : 0;
          if (seconds > 0) {
            iframe.contentWindow?.postMessage(`{"method":"setCurrentTime","value":${seconds}}`, "*");
          }
        }
      }, 1500);
    }
    if (iframe?.contentWindow && iframe.src?.includes("youtube")) {
      setTimeout(() => {
        const tParam = searchParams.get("t");
        if (tParam) {
          const parts = tParam.split(":").map(Number);
          const seconds = parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts.length === 2 ? parts[0]*60+parts[1] : 0;
          if (seconds > 0) {
            iframe.contentWindow?.postMessage(JSON.stringify({event:"command",func:"seekTo",args:[seconds,true]}), "*");
          }
        }
      }, 1500);
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [currentLesson?.id, isPlaying, autoPlayNext, nextLesson]);

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

  // Auto-complete after 30 seconds for direct video files
  useEffect(() => {
    if (!currentLesson || !isPlaying || autoCompleted || isLessonCompleted(currentLesson.id)) return;
    if (!isDirectVideoUrl(currentLesson.videoUrl)) return;
    if (videoTimer >= 30) {
      markCompleted(currentLesson.id);
      setAutoCompleted(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [videoTimer, autoCompleted, currentLesson?.id, isLessonCompleted, markCompleted, isPlaying]);

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
    if (!noteText.trim() || !currentLesson) return;
    const note: LessonNote = {
      id: crypto.randomUUID(),
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      courseId: course.id,
      courseName: course.title,
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
    trackEvent("note_created", { lessonId: currentLesson.id, courseId });
  };

  const deleteNote = (noteId: string) => {
    const all: LessonNote[] = JSON.parse(localStorage.getItem("bldr_notes") || "[]");
    const filtered = all.filter((n) => n.id !== noteId);
    localStorage.setItem("bldr_notes", JSON.stringify(filtered));
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Not found state (shouldn't happen since server validates, but just in case)
  if (!currentLesson) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", gap: "16px" }}>
        <p style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5" }}>לא נמצא</p>
        <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)" }}>הקורס או השיעור שביקשת לא נמצאו.</p>
        <Link href="/dashboard" style={{ background: "#0000FF", color: "white", padding: "10px 24px", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
          חזרה לדאשבורד
        </Link>
      </div>
    );
  }

  // Compute progress
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => completedLessons.includes(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const isCurrentCompleted = isLessonCompleted(currentLesson.id);
  const embedUrl = convertToEmbedUrl(currentLesson.videoUrl, true);

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
          width: lessonsCollapsed ? "50px" : "280px",
          minWidth: lessonsCollapsed ? "50px" : "280px",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a1a",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s, min-width 0.3s",
        }}>
          {/* Collapse toggle */}
          <button
            onClick={() => {
              const next = !lessonsCollapsed;
              setLessonsCollapsed(next);
              localStorage.setItem("bldr_lessons_collapsed", String(next));
            }}
            title={lessonsCollapsed ? "הצג שיעורים" : "הסתר שיעורים"}
            style={{
              position: "absolute",
              top: 12,
              right: lessonsCollapsed ? "50%" : 12,
              transform: lessonsCollapsed ? "translateX(50%)" : "none",
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "4px",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#f0f0f5",
              fontSize: 14,
              zIndex: 2,
              transition: "right 0.3s",
            }}
          >
            {lessonsCollapsed ? "▶" : "◀"}
          </button>

          {lessonsCollapsed ? (
            /* Collapsed view: just lesson number circles */
            <div style={{ paddingTop: "44px", overflowY: "auto", flex: 1 }}>
              {allLessons.map((lesson) => {
                const isCurrent = lesson.id === currentLesson.id;
                const isDone = completedLessons.includes(lesson.id);
                const num = lessonNumberMap.get(lesson.id) || 0;
                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                    title={lesson.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 0",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDone ? "rgba(0,200,83,0.15)" : isCurrent ? "rgba(0,0,255,0.2)" : "rgba(255,255,255,0.04)",
                      border: isCurrent ? "2px solid #0000FF" : "2px solid transparent",
                      flexShrink: 0,
                    }}>
                      {isDone ? (
                        <CheckIcon size={12} color="#00C853" />
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: isCurrent ? "#0000FF" : "rgba(240,240,245,0.7)" }}>{num}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
          <>
          {/* Progress header */}
          <div style={{ padding: "16px 16px 12px 16px" }}>
            <Link href={`/courses/${courseId}`} style={{ textDecoration: "none" }}>
              <h3 style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#f0f0f5",
                marginBottom: "4px",
                cursor: "pointer",
              }}>
                {course.title}
              </h3>
            </Link>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)" }}>{doneLessons} / {totalLessons} שיעורים</span>
              <span style={{ fontSize: "11px", color: "#7777FF", fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #0000FF, #3333FF)", borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Chapters */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
            {((): React.ReactNode => {
              const singleChapter = course.chapters.length === 1;

              const renderLessonItems = (lessons: typeof course.chapters[0]["lessons"]) =>
                lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const isNavigating = navigatingTo === lesson.id;
                        const isDone = completedLessons.includes(lesson.id);
                        const num = lessonNumberMap.get(lesson.id) || 0;
                        const hasDuration = lesson.duration && !/^[—–\-]+$/.test(lesson.duration.trim()) && lesson.duration.trim() !== "";
                        return (
                          <Link
                            key={lesson.id}
                            href={`/courses/${courseId}/lessons/${lesson.id}`}
                            onClick={() => { if (!isCurrent) setNavigatingTo(lesson.id); }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "4px",
                              textDecoration: "none",
                              background: isNavigating ? "rgba(0,0,255,0.25)" : isCurrent ? "rgba(0,0,255,0.15)" : "transparent",
                              borderRight: isNavigating || isCurrent ? "3px solid #0000FF" : "3px solid transparent",
                              opacity: navigatingTo && !isNavigating && !isCurrent ? 0.4 : 1,
                              transition: "all 0.15s",
                            }}
                          >
                            {hasDuration && (
                              <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.7)", flexShrink: 0, minWidth: "32px" }}>{lesson.duration}</span>
                            )}

                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <p style={{
                                fontSize: "12px",
                                fontWeight: isCurrent || isNavigating ? 600 : 400,
                                color: isNavigating ? "#f0f0f5" : isCurrent ? "#f0f0f5" : isDone ? "rgba(240,240,245,0.7)" : "rgba(240,240,245,0.7)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}>{lesson.title}{isNavigating ? " ..." : ""}</p>
                            </div>

                            <div style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isDone ? "rgba(0,200,83,0.15)" : isCurrent ? "rgba(0,0,255,0.2)" : "rgba(255,255,255,0.06)",
                              flexShrink: 0,
                            }}>
                              {isDone ? (
                                <CheckIcon size={10} color="#00C853" />
                              ) : (
                                <span style={{ fontSize: "10px", fontWeight: 600, color: isCurrent ? "#0000FF" : "rgba(240,240,245,0.7)" }}>{num}</span>
                              )}
                            </div>
                          </Link>
                        );
                      });

              if (singleChapter) {
                return (
                  <div key="single" style={{ padding: "0 4px 4px" }}>
                    {renderLessonItems(course.chapters[0].lessons)}
                  </div>
                );
              }

              return course.chapters.map((chapter) => {
                const isOpen = openChapters.includes(chapter.id);
                const chDone = chapter.lessons.filter((l) => completedLessons.includes(l.id)).length;

                return (
                  <div key={chapter.id} style={{ marginBottom: "4px" }}>
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "right",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "rgba(240,240,245,0.7)", display: "flex", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          <ChevronDownIcon size={13} />
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(240,240,245,0.8)" }}>{chapter.title}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.7)" }}>{chDone}/{chapter.lessons.length}</span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 4px 4px" }}>
                        {renderLessonItems(chapter.lessons)}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          </>
          )}
        </div>

        {/* ── CENTER: Video + Info ── */}
        <div style={{
          flex: 1,
          padding: "24px 32px",
          position: "relative",
          minWidth: 0,
        }}>
          {/* Video */}
          <div style={{ background: "#000", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
            {isDirectVideoUrl(currentLesson.videoUrl) ? (
              <VideoPlayer src={currentLesson.videoUrl} />
            ) : (
            <div style={{ position: "relative", paddingBottom: "56.25%" }}>
              {embedUrl ? (
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,240,245,0.7)", fontSize: "14px" }}>
                  לא הוגדר סרטון לשיעור הזה
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
                  <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)" }}>{nextLesson.title}</p>
                  <button
                    onClick={() => { setShowCountdown(false); setAutoCompleted(false); }}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(240,240,245,0.8)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      padding: "8px 20px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Title + Mark Complete */}
          <div style={{
            background: "#0a0a1a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "20px",
            marginBottom: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f0f0f5" }}>{currentLesson.title}</h1>
                <ShareButton
                  type="lesson"
                  name={currentLesson.title}
                  courseId={courseId}
                  lessonId={currentLesson.id}
                  lessonTitle={currentLesson.title}
                  videoUrl={currentLesson.videoUrl}
                />
              </div>
              <button
                onClick={() => toggleCompleted(currentLesson.id)}
                style={{
                  background: isCurrentCompleted ? "rgba(0,200,83,0.15)" : "#12122a",
                  color: isCurrentCompleted ? "#00C853" : "rgba(240,240,245,0.6)",
                  padding: "8px 16px",
                  borderRadius: "4px",
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
            <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.6 }}>{currentLesson.description}</p>
          </div>

          {/* Assignment */}
          {currentLesson.hasAssignment && currentLesson.assignmentText && (
            <div style={{
              background: "#0a0a1a",
              border: "1px solid rgba(0,0,255,0.15)",
              borderRadius: "4px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 0 20px rgba(0,0,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <AssignmentIcon size={16} />
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>מטלה</h3>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "16px", lineHeight: 1.6 }}>
                {currentLesson.assignmentText}
              </p>
              <input
                placeholder="הדבק קישור כאן..."
                style={{
                  width: "100%",
                  background: "#12122a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
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
                borderRadius: "4px",
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
          {currentLesson.attachments.length > 0 && (
            <div style={{
              background: "#0a0a1a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "4px",
              padding: "20px",
              marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AttachmentIcon size={14} /> קבצים מצורפים
              </h3>
              {currentLesson.attachments.map((fileName) => (
                <div key={fileName} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "4px", cursor: "pointer", marginBottom: "4px" }}>
                  <DownloadIcon size={16} />
                  <div>
                    <p style={{ fontSize: "13px", color: "#f0f0f5" }}>{fileName}</p>
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
                  color: "rgba(240,240,245,0.7)",
                  padding: "8px 16px",
                  borderRadius: "4px",
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
                  borderRadius: "4px",
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

        {/* ── LEFT SIDEBAR: Notes + Discussion ── */}
        <div style={{
          width: notesCollapsed ? "40px" : "300px",
          minWidth: notesCollapsed ? "40px" : "300px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a1a",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: notesCollapsed ? "hidden" : "auto",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s, min-width 0.3s",
        }}>
          {/* Collapse/Expand toggle */}
          <button
            onClick={() => {
              const next = !notesCollapsed;
              setNotesCollapsed(next);
              localStorage.setItem("bldr_notes_collapsed", String(next));
            }}
            title={notesCollapsed ? "הצג הערות" : "הסתר הערות"}
            style={{
              position: "absolute",
              top: 12,
              left: notesCollapsed ? "50%" : 12,
              transform: notesCollapsed ? "translateX(-50%)" : "none",
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "4px",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#f0f0f5",
              fontSize: 14,
              zIndex: 2,
              transition: "left 0.3s",
            }}
          >
            {notesCollapsed ? "◀" : "▶"}
          </button>
          {!notesCollapsed && (
          <>
          {/* Header */}
          <div style={{ padding: "16px 16px 0 40px", display: "flex", alignItems: "center", gap: "8px" }}>
            <NotebookIcon size={16} color="rgba(240,240,245,0.6)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>הערות</h3>
            <span style={{
              fontSize: "11px",
              color: "rgba(240,240,245,0.7)",
              background: "rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: "4px",
            }}>
              {savedNotes.length}
            </span>
          </div>

          {/* Add note area */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              background: "rgba(0,0,255,0.08)",
              padding: "6px 10px",
              borderRadius: "4px",
              width: "fit-content",
            }}>
              <ClockIcon size={12} color="rgba(240,240,245,0.7)" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", fontFamily: "var(--font-merriweather)" }}>
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
                borderRadius: "4px",
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
                borderRadius: "4px",
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
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {savedNotes.length === 0 && (
              <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", textAlign: "center", marginTop: "24px" }}>
                אין הערות עדיין לשיעור הזה
              </p>
            )}
            {savedNotes.map((note) => (
              <div key={note.id} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "4px",
                padding: "10px 12px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#f0f0f5",
                    background: "rgba(255,255,255,0.08)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontFamily: "var(--font-merriweather)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const iframe = iframeRef.current;
                    if (!iframe?.contentWindow) return;
                    const ts = note.videoTimestamp || "";
                    const parts = ts.split(":").map(Number);
                    const seconds = parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts.length === 2 ? parts[0]*60+parts[1] : 0;
                    if (iframe.src?.includes("vimeo")) {
                      iframe.contentWindow.postMessage(`{"method":"setCurrentTime","value":${seconds}}`, "*");
                    } else if (iframe.src?.includes("youtube")) {
                      iframe.contentWindow.postMessage(JSON.stringify({event:"command",func:"seekTo",args:[seconds,true]}), "*");
                    }
                  }}
                  >
                    {note.videoTimestamp || note.timestamp}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(240,240,245,0.7)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 4px",
                    }}
                  >
                    x
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>{note.content}</p>
                <span style={{ fontSize: "10px", color: "rgba(240,240,245,0.7)", marginTop: "4px", display: "block" }}>
                  {new Date(note.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
            ))}
          </div>

          {/* Discussion / Q&A */}
          {currentLesson && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "8px" }}>
              <LessonDiscussion
                courseId={courseId}
                lessonId={currentLesson.id}
                lessonTitle={currentLesson.title}
                courseName={course.title}
              />
            </div>
          )}
          </>
          )}

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
          borderRadius: "4px",
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
