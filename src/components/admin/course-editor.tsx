"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  generateThumbnail,
  type BrandSettings,
  type ThumbnailOptions,
} from "@/lib/thumbnail-generator";

// ── Types ──────────────────────────────────────────────────────────
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

// ── Styles ─────────────────────────────────────────────────────────
const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 32,
  backdropFilter: "blur(20px)",
  marginBottom: 24,
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const selectS: React.CSSProperties = {
  ...inputS,
  appearance: "none" as const,
  cursor: "pointer",
};

const labelS: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "rgba(240,240,245,0.6)",
  marginBottom: 8,
  fontWeight: 500,
};

const btnP: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 12,
  border: "none",
  background: "#0000FF",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  
  transition: "all 0.2s",
};

const btnSec: React.CSSProperties = {
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
};

const btnSmall: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(240,240,245,0.5)",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnSmallDanger: React.CSSProperties = {
  ...btnSmall,
  border: "1px solid rgba(255,60,60,0.2)",
  background: "rgba(255,60,60,0.06)",
  color: "rgba(255,120,120,0.8)",
};

const tagPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: "rgba(0,0,255,0.12)",
  color: "rgba(140,140,255,1)",
  border: "1px solid rgba(0,0,255,0.2)",
};

// ── Helpers ────────────────────────────────────────────────────────
function makeLesson(num: number): Lesson {
  return {
    id: crypto.randomUUID(),
    number: num,
    title: "",
    videoUrl: "",
    duration: "",
    description: "",
    skills: [],
    hasAssignment: false,
    assignmentText: "",
    attachments: [],
    notes: "",
    thumbnailUrl: "",
  };
}

function makeChapter(num: number): Chapter {
  return {
    id: crypto.randomUUID(),
    number: num,
    title: "",
    lessons: [makeLesson(1)],
  };
}

function getBrand(): BrandSettings {
  let brand: BrandSettings = {
    brandName: "",
    primaryColor: "#1a1aff",
    secondaryColor: "#4444ff",
    accentColor: "#00ccff",
    logoUrl: "",
    logoColor: "#ffffff",
    gradientStartColor: "#1a1aff",
    gradientEndColor: "#4444ff",
    gradientDirection: "to right",
  };
  try {
    const stored = localStorage.getItem("bldr_brand_settings");
    if (stored) brand = JSON.parse(stored);
  } catch {}
  return brand;
}

function getDefaultThumbStyle(): ThumbnailOptions["style"] {
  try {
    const d = localStorage.getItem("bldr_thumb_defaults");
    if (d) {
      const parsed = JSON.parse(d);
      if (parsed.style) return parsed.style;
    }
  } catch {}
  return "Gradient";
}

function parseDuration(d: string): number {
  const parts = d.split(":");
  if (parts.length === 2) return parseInt(parts[0] || "0") * 60 + parseInt(parts[1] || "0");
  return 0;
}

function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Component ──────────────────────────────────────────────────────
export default function CourseEditor({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "coming_soon">("draft");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbStyle, setThumbStyle] = useState<ThumbnailOptions["style"]>("Gradient");
  const [chapters, setChapters] = useState<Chapter[]>([makeChapter(1)]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const [generatingLessonThumb, setGeneratingLessonThumb] = useState<string | null>(null);
  const [customThumbUrl, setCustomThumbUrl] = useState("");
  const existingIdRef = useRef<string | null>(null);
  const createdAtRef = useRef<string>(new Date().toISOString());

  // Load existing course
  useEffect(() => {
    if (!courseId) {
      setThumbStyle(getDefaultThumbStyle());
      return;
    }
    try {
      const stored = localStorage.getItem("bldr_courses");
      if (!stored) return;
      const courses: Course[] = JSON.parse(stored);
      const found = courses.find((c) => c.id === courseId);
      if (!found) return;
      existingIdRef.current = found.id;
      createdAtRef.current = found.createdAt;
      setTitle(found.title);
      setDescription(found.description);
      setStatus(found.status);
      setThumbnailUrl(found.thumbnailUrl);
      setChapters(found.chapters.length > 0 ? found.chapters : [makeChapter(1)]);
    } catch {}
    setThumbStyle(getDefaultThumbStyle());
  }, [courseId]);

  // ── Chapter ops ────────────────────────────────────────────────
  const addChapter = () => {
    setChapters((prev) => [...prev, makeChapter(prev.length + 1)]);
  };

  const removeChapter = (idx: number) => {
    setChapters((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((ch, i) => ({ ...ch, number: i + 1 }));
    });
  };

  const moveChapter = (idx: number, dir: -1 | 1) => {
    setChapters((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((ch, i) => ({ ...ch, number: i + 1 }));
    });
  };

  const updateChapterTitle = (idx: number, val: string) => {
    setChapters((prev) => prev.map((ch, i) => i === idx ? { ...ch, title: val } : ch));
  };

  // ── Lesson ops ─────────────────────────────────────────────────
  const addLesson = (chIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx ? { ...ch, lessons: [...ch.lessons, makeLesson(ch.lessons.length + 1)] } : ch
      )
    );
  };

  const removeLesson = (chIdx: number, lIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, ci) =>
        ci === chIdx
          ? { ...ch, lessons: ch.lessons.filter((_, li) => li !== lIdx).map((l, li) => ({ ...l, number: li + 1 })) }
          : ch
      )
    );
  };

  const moveLesson = (chIdx: number, lIdx: number, dir: -1 | 1) => {
    setChapters((prev) =>
      prev.map((ch, ci) => {
        if (ci !== chIdx) return ch;
        const lessons = [...ch.lessons];
        const target = lIdx + dir;
        if (target < 0 || target >= lessons.length) return ch;
        [lessons[lIdx], lessons[target]] = [lessons[target], lessons[lIdx]];
        return { ...ch, lessons: lessons.map((l, li) => ({ ...l, number: li + 1 })) };
      })
    );
  };

  const updateLesson = (chIdx: number, lIdx: number, updates: Partial<Lesson>) => {
    setChapters((prev) =>
      prev.map((ch, ci) =>
        ci === chIdx
          ? { ...ch, lessons: ch.lessons.map((l, li) => (li === lIdx ? { ...l, ...updates } : l)) }
          : ch
      )
    );
  };

  // ── Toggle helpers ─────────────────────────────────────────────
  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleLesson = (id: string) => {
    setExpandedLessons((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── Thumbnail generation ──────────────────────────────────────
  const [thumbError, setThumbError] = useState("");

  const getApiKey = (): string => {
    try {
      const keys = JSON.parse(localStorage.getItem("bldr_api_keys") || "[]");
      const nb = keys.find((k: { label: string; value: string }) => k.label.toLowerCase().includes("nano banana"));
      return nb?.value || "";
    } catch { return ""; }
  };

  const getThumbDefaults = () => {
    try {
      return JSON.parse(localStorage.getItem("bldr_thumb_defaults") || "{}");
    } catch { return {}; }
  };

  const generateCourseThumbnail = useCallback(async () => {
    if (!title.trim()) return;
    setGeneratingThumb(true);
    setThumbError("");

    const apiKey = getApiKey();
    const brand = getBrand();
    const thumbDefaults = getThumbDefaults();

    if (apiKey) {
      // Use API
      try {
        const res = await fetch("/api/generate-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            subtitle: description.slice(0, 80),
            style: thumbStyle,
            apiKey,
            brand,
            thumbDefaults,
          }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          setThumbnailUrl(data.imageUrl);
          setCustomThumbUrl("");
          setGeneratingThumb(false);
          return;
        }
        setThumbError(data.message || "שגיאה ביצירת התמונה");
      } catch {
        setThumbError("שגיאת רשת. נסה שוב.");
      }
    }

    // Fallback to canvas
    const url = generateThumbnail(brand, {
      title,
      subtitle: description.slice(0, 60),
      style: thumbStyle,
      size: "1280x720",
    });
    setThumbnailUrl(url);
    setCustomThumbUrl("");
    setGeneratingThumb(false);
    if (!apiKey) setThumbError("לא הוגדר מפתח API — נוצרה תמונה מקומית. הגדר מפתח Nano Banana 2 בהגדרות.");
  }, [title, description, thumbStyle]);

  const generateLessonThumbnail = async (chIdx: number, lIdx: number, lessonTitle: string) => {
    const lessonId = chapters[chIdx].lessons[lIdx].id;
    setGeneratingLessonThumb(lessonId);

    const apiKey = getApiKey();
    const brand = getBrand();
    const thumbDefaults = getThumbDefaults();

    if (apiKey) {
      try {
        const res = await fetch("/api/generate-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lessonTitle,
            subtitle: "",
            style: thumbStyle,
            apiKey,
            brand,
            thumbDefaults,
          }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          updateLesson(chIdx, lIdx, { thumbnailUrl: data.imageUrl });
          setGeneratingLessonThumb(null);
          return;
        }
      } catch {}
    }

    // Fallback to canvas
    const url = generateThumbnail(brand, {
      title: lessonTitle,
      subtitle: "",
      style: thumbStyle,
      size: "400x225",
    });
    updateLesson(chIdx, lIdx, { thumbnailUrl: url });
    setGeneratingLessonThumb(null);
  };

  // ── Save ──────────────────────────────────────────────────────
  const saveCourse = (publishStatus?: "active") => {
    const course: Course = {
      id: existingIdRef.current || crypto.randomUUID(),
      title,
      description,
      status: publishStatus || status,
      thumbnailUrl,
      createdAt: createdAtRef.current,
      updatedAt: new Date().toISOString(),
      chapters,
    };

    const stored = localStorage.getItem("bldr_courses");
    let courses: Course[] = stored ? JSON.parse(stored) : [];

    if (existingIdRef.current) {
      courses = courses.map((c) => (c.id === existingIdRef.current ? course : c));
    } else {
      existingIdRef.current = course.id;
      courses.push(course);
    }

    localStorage.setItem("bldr_courses", JSON.stringify(courses));
    setLastSaved(new Date().toLocaleTimeString());
    if (publishStatus) setStatus("active");
  };

  // ── Stats ─────────────────────────────────────────────────────
  const totalLessons = chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const totalDurationSec = chapters.reduce(
    (s, ch) => s + ch.lessons.reduce((ls, l) => ls + parseDuration(l.duration), 0),
    0
  );
  const totalAssignments = chapters.reduce(
    (s, ch) => s + ch.lessons.filter((l) => l.hasAssignment).length,
    0
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin/courses" style={{ fontSize: 13, color: "rgba(240,240,245,0.35)", textDecoration: "none" }}>
          קורסים
        </Link>
        <span style={{ color: "rgba(240,240,245,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,245,0.6)" }}>{courseId ? "עריכת קורס" : "קורס חדש"}</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 8 }}>
          {courseId ? "עריכת קורס" : "צור קורס חדש"}
        </h1>
      </div>

      {/* ── Section A: Course Info ─────────────────────────────── */}
      <div style={cardS}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 24 }}>
          פרטי הקורס
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelS}>שם הקורס *</label>
            <input style={inputS} placeholder="לדוגמה: מאסטר באוטומציית AI" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={labelS}>תיאור הקורס</label>
            <textarea style={{ ...inputS, minHeight: 100, resize: "vertical" }} placeholder="מה הסטודנטים ילמדו?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label style={labelS}>סטטוס</label>
            <select style={selectS} value={status} onChange={(e) => setStatus(e.target.value as Course["status"])}>
              <option value="draft">טיוטה</option>
              <option value="active">פעיל</option>
              <option value="coming_soon">בקרוב</option>
            </select>
          </div>

          {/* Thumbnail */}
          <div>
            <label style={labelS}>תמונה ממוזערת לקורס</label>
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelS, fontSize: 12 }}>סגנון</label>
                  <select style={selectS} value={thumbStyle} onChange={(e) => setThumbStyle(e.target.value as ThumbnailOptions["style"])}>
                    {(["Minimal", "Bold", "Cinematic", "Gradient"] as const).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  style={{ ...btnP, opacity: title.trim() ? 1 : 0.4, padding: "12px 20px" }}
                  disabled={!title.trim() || generatingThumb}
                  onClick={generateCourseThumbnail}
                >
                  {generatingThumb ? "יוצר..." : "צור תמונה ממוזערת"}
                </button>
              </div>

              {/* Status/Error */}
              {thumbError && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: thumbError.includes("מקומית") ? "rgba(255,179,0,0.08)" : "rgba(255,60,60,0.08)",
                  border: `1px solid ${thumbError.includes("מקומית") ? "rgba(255,179,0,0.2)" : "rgba(255,60,60,0.2)"}`,
                  marginBottom: 12,
                  fontSize: 12,
                  color: thumbError.includes("מקומית") ? "#FFB300" : "#FF3D00",
                  lineHeight: 1.5,
                }}>
                  {thumbError}
                </div>
              )}

              {generatingThumb && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{
                    width: 32, height: 32, margin: "0 auto 12px",
                    border: "3px solid rgba(0,0,255,0.15)", borderTopColor: "#0000FF",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 13 }}>יוצר תמונה ממוזערת...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {!generatingThumb && thumbnailUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl} alt="Thumbnail" style={{ width: "100%", borderRadius: 8, display: "block" }} />
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <p style={{ color: "rgba(240,240,245,0.25)", fontSize: 13 }}>
                    הזן כותרת ולחץ על צור כדי ליצור תמונה ממוזערת
                  </p>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelS, fontSize: 12 }}>או הדבק כתובת URL מותאמת</label>
                <input
                  style={inputS}
                  placeholder="https://..."
                  value={customThumbUrl}
                  onChange={(e) => {
                    setCustomThumbUrl(e.target.value);
                    if (e.target.value.trim()) setThumbnailUrl(e.target.value.trim());
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: Chapters & Lessons ──────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
          פרקים ושיעורים
        </h2>

        {chapters.map((ch, chIdx) => {
          const chExpanded = expandedChapters.has(ch.id);
          return (
            <div
              key={ch.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              {/* Chapter header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  userSelect: "none",
                  background: "rgba(255,255,255,0.02)",
                }}
                onClick={() => toggleChapter(ch.id)}
              >
                <span style={{
                  transform: chExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  display: "inline-block",
                  fontSize: 12,
                  color: "rgba(240,240,245,0.35)",
                }}>
                  ▶
                </span>
                <span style={{ color: "rgba(0,0,255,0.7)", fontSize: 12, fontWeight: 600 }}>
                  CH {ch.number}
                </span>
                <input
                  style={{
                    ...inputS,
                    flex: 1,
                    padding: "6px 12px",
                    fontSize: 14,
                    fontWeight: 600,
                    background: "transparent",
                    border: "1px solid transparent",
                  }}
                  placeholder="כותרת הפרק..."
                  value={ch.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateChapterTitle(chIdx, e.target.value)}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid transparent"; }}
                />
                <span style={{ fontSize: 11, color: "rgba(240,240,245,0.3)", whiteSpace: "nowrap" }}>
                  {ch.lessons.length} שיעורים
                </span>
                <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button style={btnSmall} onClick={() => moveChapter(chIdx, -1)} disabled={chIdx === 0} title="הזז למעלה">↑</button>
                  <button style={btnSmall} onClick={() => moveChapter(chIdx, 1)} disabled={chIdx === chapters.length - 1} title="הזז למטה">↓</button>
                  <button style={btnSmallDanger} onClick={() => removeChapter(chIdx)} title="מחק פרק">✕</button>
                </div>
              </div>

              {/* Lessons */}
              {chExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 16px 16px" }}>
                  {ch.lessons.map((lesson, lIdx) => {
                    const lExpanded = expandedLessons.has(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 10,
                          marginBottom: 8,
                          overflow: "hidden",
                          transition: "all 0.2s",
                        }}
                      >
                        {/* Lesson collapsed header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                          onClick={() => toggleLesson(lesson.id)}
                        >
                          <span style={{
                            transform: lExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            display: "inline-block",
                            fontSize: 10,
                            color: "rgba(240,240,245,0.3)",
                          }}>
                            ▶
                          </span>
                          <span style={{ color: "rgba(240,240,245,0.3)", fontSize: 11, fontWeight: 600, minWidth: 28 }}>
                            {ch.number}.{lesson.number}
                          </span>

                          {/* Small thumbnail preview */}
                          {lesson.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={lesson.thumbnailUrl} alt="" style={{ width: 40, height: 23, borderRadius: 4, objectFit: "cover" }} />
                          )}

                          <input
                            style={{
                              ...inputS,
                              flex: 1,
                              padding: "4px 10px",
                              fontSize: 13,
                              background: "transparent",
                              border: "1px solid transparent",
                            }}
                            placeholder="כותרת השיעור..."
                            value={lesson.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateLesson(chIdx, lIdx, { title: e.target.value })}
                            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.border = "1px solid transparent"; }}
                          />
                          <input
                            style={{
                              ...inputS,
                              width: 70,
                              padding: "4px 8px",
                              fontSize: 12,
                              textAlign: "center",
                              background: "transparent",
                              border: "1px solid transparent",
                            }}
                            placeholder="MM:SS"
                            value={lesson.duration}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateLesson(chIdx, lIdx, { duration: e.target.value })}
                            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.border = "1px solid transparent"; }}
                          />
                          <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button style={btnSmall} onClick={() => moveLesson(chIdx, lIdx, -1)} disabled={lIdx === 0}>↑</button>
                            <button style={btnSmall} onClick={() => moveLesson(chIdx, lIdx, 1)} disabled={lIdx === ch.lessons.length - 1}>↓</button>
                            <button style={btnSmallDanger} onClick={() => removeLesson(chIdx, lIdx)}>✕</button>
                          </div>
                        </div>

                        {/* Lesson expanded details */}
                        {lExpanded && (
                          <div style={{
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                            padding: "16px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                          }}>
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>כתובת וידאו</label>
                              <input style={inputS} placeholder="https://..." value={lesson.videoUrl} onChange={(e) => updateLesson(chIdx, lIdx, { videoUrl: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>תיאור</label>
                              <textarea style={{ ...inputS, minHeight: 60, resize: "vertical" }} placeholder="תיאור השיעור..." value={lesson.description} onChange={(e) => updateLesson(chIdx, lIdx, { description: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>כישורים / תגיות (מופרדים בפסיקים)</label>
                              <input
                                style={inputS}
                                placeholder="לדוגמה: AI, אוטומציה, claude"
                                value={lesson.skills.join(", ")}
                                onChange={(e) => updateLesson(chIdx, lIdx, { skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                              />
                              {lesson.skills.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                  {lesson.skills.map((s) => (
                                    <span key={s} style={tagPill}>{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <label style={{ ...labelS, fontSize: 12, marginBottom: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={lesson.hasAssignment}
                                  onChange={(e) => updateLesson(chIdx, lIdx, { hasAssignment: e.target.checked })}
                                  style={{ accentColor: "#0000FF" }}
                                />
                                כולל מטלה
                              </label>
                            </div>
                            {lesson.hasAssignment && (
                              <div>
                                <label style={{ ...labelS, fontSize: 12 }}>טקסט המטלה</label>
                                <textarea style={{ ...inputS, minHeight: 60, resize: "vertical" }} placeholder="תאר את המטלה..." value={lesson.assignmentText} onChange={(e) => updateLesson(chIdx, lIdx, { assignmentText: e.target.value })} />
                              </div>
                            )}
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>קבצים מצורפים (שמות מופרדים בפסיקים)</label>
                              <input style={inputS} placeholder="לדוגמה: slides.pdf, code.zip" value={lesson.attachments.join(", ")} onChange={(e) => updateLesson(chIdx, lIdx, { attachments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                            </div>
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>הערות</label>
                              <textarea style={{ ...inputS, minHeight: 60, resize: "vertical" }} placeholder="הערות פנימיות..." value={lesson.notes} onChange={(e) => updateLesson(chIdx, lIdx, { notes: e.target.value })} />
                            </div>

                            {/* Lesson Thumbnail */}
                            <div>
                              <label style={{ ...labelS, fontSize: 12 }}>תמונה ממוזערת לשיעור</label>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                  style={{ ...btnSmall, background: "rgba(0,0,255,0.1)", border: "1px solid rgba(0,0,255,0.2)", color: "rgba(140,140,255,1)" }}
                                  disabled={!lesson.title.trim() || generatingLessonThumb === lesson.id}
                                  onClick={() => generateLessonThumbnail(chIdx, lIdx, lesson.title)}
                                >
                                  {generatingLessonThumb === lesson.id ? "..." : "צור"}
                                </button>
                                <input
                                  style={{ ...inputS, flex: 1, padding: "6px 10px", fontSize: 12 }}
                                  placeholder="או הדבק כתובת URL..."
                                  value={lesson.thumbnailUrl.startsWith("data:") ? "" : lesson.thumbnailUrl}
                                  onChange={(e) => updateLesson(chIdx, lIdx, { thumbnailUrl: e.target.value })}
                                />
                              </div>
                              {lesson.thumbnailUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={lesson.thumbnailUrl} alt="" style={{ width: 200, borderRadius: 6, marginTop: 8, display: "block" }} />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    style={{ ...btnSmall, marginTop: 8, background: "rgba(0,0,255,0.06)", border: "1px solid rgba(0,0,255,0.15)", color: "rgba(140,140,255,0.8)" }}
                    onClick={() => addLesson(chIdx)}
                  >
                    + הוסף שיעור
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button style={{ ...btnSec, marginTop: 8 }} onClick={addChapter}>
          + הוסף פרק
        </button>
      </div>

      {/* ── Section C: Sticky bottom bar ───────────────────────── */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,10,26,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        padding: "14px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { label: "פרקים", value: chapters.length },
            { label: "שיעורים", value: totalLessons },
            { label: "משך", value: formatTotalDuration(totalDurationSec) },
            { label: "מטלות", value: totalAssignments },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(240,240,245,0.35)" }}>{s.label}</div>
            </div>
          ))}
          {lastSaved && (
            <span style={{ fontSize: 11, color: "rgba(240,240,245,0.25)", marginLeft: 8 }}>
              נשמר לאחרונה: {lastSaved}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ ...btnSec, padding: "10px 20px" }}
            onClick={() => router.push("/admin/courses")}
          >
            ביטול
          </button>
          <button
            style={{ ...btnSec, padding: "10px 20px" }}
            onClick={() => saveCourse()}
            disabled={!title.trim()}
          >
            שמור קורס
          </button>
          <button
            style={{ ...btnP, padding: "10px 20px", opacity: title.trim() ? 1 : 0.4 }}
            onClick={() => saveCourse("active")}
            disabled={!title.trim()}
          >
            שמור ופרסם
          </button>
        </div>
      </div>
    </div>
  );
}
