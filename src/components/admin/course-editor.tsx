"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  generateThumbnail,
  type BrandSettings,
  type ThumbnailOptions,
} from "@/lib/thumbnail-generator";
import { storeImageIfDataUrl, resolveImageUrl, saveImage, getImage } from "@/lib/image-store";

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
  featured: boolean;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

// ── Styles ─────────────────────────────────────────────────────────
const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  padding: 32,
  backdropFilter: "blur(20px)",
  marginBottom: 24,
};

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 4,
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
  borderRadius: 4,
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
  borderRadius: 4,
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
  borderRadius: 4,
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

// ── Table cell input (borderless spreadsheet feel) ─────────────────
const cellInputS: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid transparent",
  background: "transparent",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const cellFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
};
const cellBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "transparent";
  e.currentTarget.style.background = "transparent";
};

const iconBtnS: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "transparent",
  color: "rgba(240,240,245,0.35)",
  fontSize: 11,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  transition: "all 0.15s",
  padding: 0,
};

// ── Helpers ────────────────────────────────────────────────────────
function makeLesson(num: number): Lesson {
  return {
    id: crypto.randomUUID(),
    number: num,
    title: "",
    videoUrl: "",
    duration: "—",
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
  if (!d || d === "—") return 0;
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

// ── SkillsPills sub-component ──────────────────────────────────────
function SkillsPills({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addSkill = (raw: string) => {
    const val = raw.trim();
    if (!val || skills.length >= 3 || skills.includes(val)) return;
    onChange([...skills, val]);
  };

  const removeSkill = (idx: number) => {
    onChange(skills.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // split by comma in case they pasted multiple
      const parts = inputVal.split(",").map((s) => s.trim()).filter(Boolean);
      let current = [...skills];
      for (const p of parts) {
        if (current.length >= 3) break;
        if (!current.includes(p)) current.push(p);
      }
      onChange(current);
      setInputVal("");
    } else if (e.key === "Backspace" && inputVal === "" && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
        minHeight: 28,
        cursor: "text",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((s, i) => (
        <span key={s + i} style={{ ...tagPill, fontSize: 10, padding: "1px 8px" }}>
          {s}
          <button
            onClick={(e) => { e.stopPropagation(); removeSkill(i); }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(140,140,255,0.6)",
              cursor: "pointer",
              fontSize: 10,
              padding: "0 0 0 2px",
              lineHeight: 1,
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </span>
      ))}
      {skills.length < 3 && (
        <input
          ref={inputRef}
          style={{
            ...cellInputS,
            width: skills.length > 0 ? 80 : "100%",
            flex: skills.length > 0 ? "1 1 60px" : undefined,
            fontSize: 11,
            padding: "3px 4px",
          }}
          placeholder={skills.length === 0 ? "הוסף תגית..." : ""}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={cellFocus}
          onBlur={(e) => {
            cellBlur(e);
            // commit on blur if there's text
            if (inputVal.trim()) {
              addSkill(inputVal);
              setInputVal("");
            }
          }}
        />
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────
export default function CourseEditor({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "coming_soon">("draft");
  const [featured, setFeatured] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbStyle, setThumbStyle] = useState<ThumbnailOptions["style"]>("Gradient");
  const [chapters, setChapters] = useState<Chapter[]>([makeChapter(1)]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const [customThumbUrl, setCustomThumbUrl] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const [displayThumbUrl, setDisplayThumbUrl] = useState("");
  const existingIdRef = useRef<string | null>(null);
  const createdAtRef = useRef<string>(new Date().toISOString());
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ id: string; label: string; key: string; src: string }[]>([]);

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
      setFeatured(found.featured || false);
      setThumbnailUrl(found.thumbnailUrl);
      setChapters(found.chapters.length > 0 ? found.chapters : [makeChapter(1)]);
    } catch {}
    setThumbStyle(getDefaultThumbStyle());
  }, [courseId]);

  // Resolve idb:// thumbnail URLs for display
  useEffect(() => {
    if (thumbnailUrl.startsWith("idb://")) {
      resolveImageUrl(thumbnailUrl).then((resolved) => setDisplayThumbUrl(resolved));
    } else {
      setDisplayThumbUrl(thumbnailUrl);
    }
  }, [thumbnailUrl]);

  // ── Media picker helpers ──────────────────────────────────────
  const openMediaPicker = async () => {
    try {
      const registry: { id: string; label: string; key: string }[] = JSON.parse(localStorage.getItem("bldr_media_registry") || "[]");
      const items = await Promise.all(
        registry.map(async (item) => {
          const data = await getImage(item.key);
          return { ...item, src: data || "" };
        })
      );
      setMediaItems(items.filter((i) => i.src));
      setShowMediaPicker(true);
    } catch {
      setMediaItems([]);
      setShowMediaPicker(true);
    }
  };

  const selectMediaItem = (item: { key: string }) => {
    setThumbnailUrl(`idb://${item.key}`);
    setCustomThumbUrl("");
    setShowMediaPicker(false);
  };

  const registerThumbInMedia = (idbRef: string, label: string) => {
    try {
      const key = idbRef.startsWith("idb://") ? idbRef.slice(6) : idbRef;
      const registry: { id: string; label: string; key: string; createdAt: number }[] = JSON.parse(localStorage.getItem("bldr_media_registry") || "[]");
      if (registry.some((r) => r.key === key)) return;
      registry.unshift({ id: `media_${Date.now()}`, label, key, createdAt: Date.now() });
      localStorage.setItem("bldr_media_registry", JSON.stringify(registry));
    } catch {}
  };

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
    setChapters((prev) => prev.map((ch, i) => (i === idx ? { ...ch, title: val } : ch)));
  };

  // ── Lesson ops ─────────────────────────────────────────────────
  const addLesson = (chIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? { ...ch, lessons: [...ch.lessons, makeLesson(ch.lessons.length + 1)] }
          : ch
      )
    );
  };

  const removeLesson = (chIdx: number, lIdx: number) => {
    setChapters((prev) =>
      prev.map((ch, ci) =>
        ci === chIdx
          ? {
              ...ch,
              lessons: ch.lessons
                .filter((_, li) => li !== lIdx)
                .map((l, li) => ({ ...l, number: li + 1 })),
            }
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

  // ── Quick-add row handler ─────────────────────────────────────
  const handleQuickAdd = (chIdx: number, value: string) => {
    if (!value.trim()) return;
    setChapters((prev) =>
      prev.map((ch, ci) => {
        if (ci !== chIdx) return ch;
        const newNum = ch.lessons.length + 1;
        const newLesson = { ...makeLesson(newNum), title: value.trim() };
        return { ...ch, lessons: [...ch.lessons, newLesson] };
      })
    );
  };

  // ── Thumbnail generation ──────────────────────────────────────
  const [thumbError, setThumbError] = useState("");

  const getApiKey = (): string => {
    try {
      const keys = JSON.parse(localStorage.getItem("bldr_api_keys") || "[]");
      const nb = keys.find(
        (k: { label: string; value: string }) => k.label.toLowerCase().includes("nano banana")
      );
      return nb?.value || "";
    } catch {
      return "";
    }
  };

  const getThumbDefaults = () => {
    try {
      return JSON.parse(localStorage.getItem("bldr_thumb_defaults") || "{}");
    } catch {
      return {};
    }
  };

  const generateCourseThumbnail = useCallback(async () => {
    if (!title.trim()) return;
    setGeneratingThumb(true);
    setThumbError("");

    const apiKey = getApiKey();
    const brand = getBrand();
    const thumbDefaults = getThumbDefaults();

    if (apiKey) {
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

    // Fallback to canvas — store in IndexedDB, not localStorage
    const dataUrl = generateThumbnail(brand, {
      title,
      subtitle: description.slice(0, 60),
      style: thumbStyle,
      size: "1280x720",
    });
    const storedRef = await storeImageIfDataUrl(dataUrl, "thumb");
    setThumbnailUrl(storedRef);
    setCustomThumbUrl("");
    setGeneratingThumb(false);
    if (!apiKey)
      setThumbError(
        "לא הוגדר מפתח API — נוצרה תמונה מקומית. הגדר מפתח Nano Banana 2 בהגדרות."
      );
  }, [title, description, thumbStyle]);

  // ── Save ──────────────────────────────────────────────────────
  const saveCourse = (publishStatus?: "active") => {
    const course: Course = {
      id: existingIdRef.current || crypto.randomUUID(),
      title,
      description,
      status: publishStatus || status,
      featured,
      thumbnailUrl,
      createdAt: createdAtRef.current,
      updatedAt: new Date().toISOString(),
      chapters,
    };

    const stored = localStorage.getItem("bldr_courses");
    let courses: Course[] = stored ? JSON.parse(stored) : [];

    // If this course is featured, unfeatured all others
    if (featured) {
      courses = courses.map((c) => ({ ...c, featured: false }));
    }

    if (existingIdRef.current) {
      courses = courses.map((c) => (c.id === existingIdRef.current ? course : c));
    } else {
      existingIdRef.current = course.id;
      courses.push(course);
    }

    try {
      localStorage.setItem("bldr_courses", JSON.stringify(courses));
    } catch (e) {
      // localStorage quota exceeded — try to save without thumbnails
      const stripped = courses.map((c) => ({
        ...c,
        thumbnailUrl: c.thumbnailUrl?.startsWith("data:") ? "" : c.thumbnailUrl,
        chapters: c.chapters.map((ch) => ({
          ...ch,
          lessons: ch.lessons.map((l) => ({
            ...l,
            thumbnailUrl: l.thumbnailUrl?.startsWith("data:") ? "" : (l.thumbnailUrl || ""),
          })),
        })),
      }));
      try {
        localStorage.setItem("bldr_courses", JSON.stringify(stripped));
        setThumbError("האחסון המקומי מלא — התמונות הממוזערות הוסרו. שקול להשתמש בכתובות URL חיצוניות.");
      } catch {
        setThumbError("האחסון המקומי מלא לחלוטין. נסה למחוק קורסים ישנים מעמוד ניהול הקורסים.");
        return;
      }
    }
    setLastSaved(new Date().toLocaleTimeString());
    if (publishStatus) {
      setStatus(publishStatus);
      router.push("/admin/courses");
    } else {
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const totalLessons = chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const totalDurationSec = chapters.reduce(
    (s, ch) => s + ch.lessons.reduce((ls, l) => ls + parseDuration(l.duration), 0),
    0
  );

  // ── QuickAddRow sub-component ─────────────────────────────────
  function QuickAddRow({ chIdx, chNumber, lessonCount }: { chIdx: number; chNumber: number; lessonCount: number }) {
    const [val, setVal] = useState("");
    return (
      <tr style={{ background: "transparent" }}>
        <td style={{ padding: "4px 8px", fontSize: 11, color: "rgba(240,240,245,0.15)", textAlign: "center" }}>
          {chNumber}.{lessonCount + 1}
        </td>
        <td style={{ padding: "4px 0" }}>
          <input
            style={{ ...cellInputS, fontSize: 12, color: "rgba(240,240,245,0.3)" }}
            placeholder="הקלד שם שיעור ולחץ Enter..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && val.trim()) {
                handleQuickAdd(chIdx, val);
                setVal("");
              }
            }}
            onFocus={cellFocus}
            onBlur={cellBlur}
          />
        </td>
        <td />
        <td />
        <td />
      </tr>
    );
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/admin/courses"
          style={{ fontSize: 13, color: "rgba(240,240,245,0.35)", textDecoration: "none" }}
        >
          קורסים
        </Link>
        <span style={{ color: "rgba(240,240,245,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,245,0.6)" }}>
          {courseId ? "עריכת קורס" : "קורס חדש"}
        </span>
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
            <input
              style={inputS}
              placeholder="לדוגמה: מאסטר באוטומציית AI"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label style={labelS}>תיאור הקורס</label>
            <textarea
              style={{ ...inputS, minHeight: 100, resize: "vertical" }}
              placeholder="מה הסטודנטים ילמדו?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label style={labelS}>סטטוס</label>
            <select
              style={selectS}
              value={status}
              onChange={(e) => setStatus(e.target.value as Course["status"])}
            >
              <option value="draft">טיוטה</option>
              <option value="active">פעיל</option>
              <option value="coming_soon">בקרוב</option>
            </select>
          </div>

          {/* Featured toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 4, background: featured ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${featured ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)"}` }}>
            <div>
              <p style={{ fontSize: 14, color: "#f0f0f5", marginBottom: 2 }}>קורס מומלץ (Hero)</p>
              <p style={{ fontSize: 12, color: "rgba(240,240,245,0.35)" }}>יופיע בראש הדשבורד כקורס ראשי</p>
            </div>
            <button
              onClick={() => setFeatured(!featured)}
              style={{
                width: 44, height: 24, borderRadius: 4, border: "none", cursor: "pointer",
                position: "relative", background: featured ? "#0000FF" : "rgba(255,255,255,0.1)", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, transition: "left 0.2s", ...(featured ? { left: 3 } : { left: 23 }) }} />
            </button>
          </div>

          {/* Thumbnail */}
          <div>
            <label style={labelS}>תמונה ממוזערת לקורס</label>
            <div
              style={{
                padding: 20,
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelS, fontSize: 12 }}>סגנון</label>
                  <select
                    style={selectS}
                    value={thumbStyle}
                    onChange={(e) => setThumbStyle(e.target.value as ThumbnailOptions["style"])}
                  >
                    {(["Minimal", "Bold", "Cinematic", "Gradient"] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
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

              {thumbError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 4,
                    background: thumbError.includes("מקומית")
                      ? "rgba(255,179,0,0.08)"
                      : "rgba(255,60,60,0.08)",
                    border: `1px solid ${
                      thumbError.includes("מקומית")
                        ? "rgba(255,179,0,0.2)"
                        : "rgba(255,60,60,0.2)"
                    }`,
                    marginBottom: 12,
                    fontSize: 12,
                    color: thumbError.includes("מקומית") ? "#FFB300" : "#FF3D00",
                    lineHeight: 1.5,
                  }}
                >
                  {thumbError}
                </div>
              )}

              {generatingThumb && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      margin: "0 auto 12px",
                      border: "3px solid rgba(0,0,255,0.15)",
                      borderTopColor: "#0000FF",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 13 }}>
                    יוצר תמונה ממוזערת...
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {!generatingThumb && displayThumbUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayThumbUrl}
                    alt="Thumbnail"
                    style={{ width: "100%", borderRadius: 4, display: "block" }}
                  />
                </div>
              ) : (
                !generatingThumb && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <p style={{ color: "rgba(240,240,245,0.25)", fontSize: 13 }}>
                      הזן כותרת ולחץ על צור כדי ליצור תמונה ממוזערת
                    </p>
                  </div>
                )
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelS, fontSize: 12 }}>או הדבק כתובת URL</label>
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
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="thumb-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !file.type.startsWith("image/")) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const ref = await storeImageIfDataUrl(reader.result as string, "thumb-upload");
                        setThumbnailUrl(ref);
                        setCustomThumbUrl("");
                        registerThumbInMedia(ref, file.name || "Course Thumbnail");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label htmlFor="thumb-upload" style={{
                    ...btnSec,
                    padding: "10px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    העלה תמונה
                  </label>
                </div>
                <button
                  type="button"
                  onClick={openMediaPicker}
                  style={{
                    ...btnSec,
                    padding: "10px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  בחר מספריית מדיה
                </button>
              </div>

              {/* Media Picker Modal */}
              {showMediaPicker && (
                <div
                  onClick={() => setShowMediaPicker(false)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    direction: "rtl",
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "90%", maxWidth: 700, maxHeight: "80vh",
                      background: "rgba(10,10,26,0.97)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, padding: 0,
                      boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                      overflow: "hidden", display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>בחר תמונה מהספרייה</h3>
                      <button
                        onClick={() => setShowMediaPicker(false)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(240,240,245,0.5)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                      {mediaItems.length === 0 ? (
                        <p style={{ textAlign: "center", color: "rgba(240,240,245,0.3)", fontSize: 14, padding: "40px 0" }}>אין תמונות בספרייה</p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                          {mediaItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => selectMediaItem(item)}
                              style={{
                                cursor: "pointer", borderRadius: 4, overflow: "hidden",
                                border: "2px solid rgba(255,255,255,0.06)",
                                transition: "border-color 0.2s, transform 0.2s",
                                background: "rgba(255,255,255,0.02)",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,255,0.5)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "scale(1)"; }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.src} alt={item.label} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                              <div style={{ padding: "6px 8px", fontSize: 11, color: "rgba(240,240,245,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: Table-based Chapters & Lessons ─────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
          נושאים ושיעורים
        </h2>

        {chapters.map((ch, chIdx) => (
          <div
            key={ch.id}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 4,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            {/* Chapter header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.04)",
                borderRight: "3px solid rgba(0,0,255,0.6)",
              }}
            >
              <span
                style={{
                  color: "rgba(0,0,255,0.8)",
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 48,
                  textAlign: "center",
                }}
              >
                נושא {ch.number}
              </span>
              <input
                style={{
                  ...cellInputS,
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 10px",
                }}
                placeholder="כותרת הנושא..."
                value={ch.title}
                onChange={(e) => updateChapterTitle(chIdx, e.target.value)}
                onFocus={cellFocus}
                onBlur={cellBlur}
              />
              <button
                style={{
                  ...btnSmall,
                  background: "rgba(0,0,255,0.06)",
                  border: "1px solid rgba(0,0,255,0.15)",
                  color: "rgba(140,140,255,0.8)",
                  fontSize: 11,
                  padding: "5px 10px",
                }}
                onClick={() => addLesson(chIdx)}
              >
                + הוסף שיעור
              </button>
              <div style={{ display: "flex", gap: 3 }}>
                <button
                  style={iconBtnS}
                  onClick={() => moveChapter(chIdx, -1)}
                  disabled={chIdx === 0}
                  title="הזז למעלה"
                >
                  ↑
                </button>
                <button
                  style={iconBtnS}
                  onClick={() => moveChapter(chIdx, 1)}
                  disabled={chIdx === chapters.length - 1}
                  title="הזז למטה"
                >
                  ↓
                </button>
                <button
                  style={{
                    ...iconBtnS,
                    border: "1px solid rgba(255,60,60,0.15)",
                    color: "rgba(255,120,120,0.6)",
                  }}
                  onClick={() => removeChapter(chIdx)}
                  title="מחק נושא"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lessons table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              {/* Column header */}
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <th
                    style={{
                      width: 48,
                      padding: "6px 8px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(240,240,245,0.25)",
                      textAlign: "center",
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: "6px 8px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(240,240,245,0.25)",
                      textAlign: "right",
                    }}
                  >
                    שם השיעור
                  </th>
                  <th
                    style={{
                      width: "28%",
                      padding: "6px 8px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(240,240,245,0.25)",
                      textAlign: "right",
                    }}
                  >
                    כתובת URL
                  </th>
                  <th
                    style={{
                      width: "22%",
                      padding: "6px 8px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(240,240,245,0.25)",
                      textAlign: "right",
                    }}
                  >
                    תגיות (עד 3)
                  </th>
                  <th
                    style={{
                      width: 90,
                      padding: "6px 8px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(240,240,245,0.25)",
                      textAlign: "center",
                    }}
                  >
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {ch.lessons.map((lesson, lIdx) => (
                  <tr
                    key={lesson.id}
                    style={{
                      background:
                        lIdx % 2 === 0
                          ? "transparent"
                          : "rgba(255,255,255,0.015)",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        lIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";
                    }}
                  >
                    {/* Number */}
                    <td
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        color: "rgba(240,240,245,0.3)",
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {ch.number}.{lesson.number}
                    </td>

                    {/* Title */}
                    <td style={{ padding: "4px 0" }}>
                      <input
                        style={cellInputS}
                        placeholder="כותרת השיעור..."
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(chIdx, lIdx, { title: e.target.value })
                        }
                        onFocus={cellFocus}
                        onBlur={cellBlur}
                      />
                    </td>

                    {/* Video URL */}
                    <td style={{ padding: "4px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          style={{ ...cellInputS, fontSize: 12, fontFamily: "var(--font-heading-en)" }}
                          placeholder="https://youtube.com/..."
                          value={lesson.videoUrl}
                          onChange={(e) =>
                            updateLesson(chIdx, lIdx, { videoUrl: e.target.value })
                          }
                          onFocus={cellFocus}
                          onBlur={cellBlur}
                        />
                        {lesson.duration && lesson.duration !== "—" && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(240,240,245,0.3)",
                              whiteSpace: "nowrap",
                              paddingLeft: 4,
                              fontFamily: "var(--font-heading-en)",
                            }}
                          >
                            {lesson.duration}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Skills */}
                    <td style={{ padding: "4px 4px" }}>
                      <SkillsPills
                        skills={lesson.skills}
                        onChange={(skills) => updateLesson(chIdx, lIdx, { skills })}
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                        <button
                          style={iconBtnS}
                          onClick={() => moveLesson(chIdx, lIdx, -1)}
                          disabled={lIdx === 0}
                          title="הזז למעלה"
                        >
                          ↑
                        </button>
                        <button
                          style={iconBtnS}
                          onClick={() => moveLesson(chIdx, lIdx, 1)}
                          disabled={lIdx === ch.lessons.length - 1}
                          title="הזז למטה"
                        >
                          ↓
                        </button>
                        <button
                          style={{
                            ...iconBtnS,
                            border: "1px solid rgba(255,60,60,0.15)",
                            color: "rgba(255,120,120,0.6)",
                          }}
                          onClick={() => removeLesson(chIdx, lIdx)}
                          title="מחק שיעור"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Quick-add row */}
                <QuickAddRow chIdx={chIdx} chNumber={ch.number} lessonCount={ch.lessons.length} />
              </tbody>
            </table>
          </div>
        ))}

        <button style={{ ...btnSec, marginTop: 8 }} onClick={addChapter}>
          + הוסף נושא
        </button>
      </div>

      {/* ── Section C: Sticky bottom bar ───────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(10,10,26,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          padding: "14px 40px 14px 40px",
          paddingRight: "108px", // sidebar width + padding
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 60, // above event banner
        }}
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { label: "נושאים", value: chapters.length },
            { label: "שיעורים", value: totalLessons },
            { label: "משך", value: formatTotalDuration(totalDurationSec) },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(240,240,245,0.35)" }}>{s.label}</div>
            </div>
          ))}
          {lastSaved && (
            <span
              style={{ fontSize: 11, color: "rgba(240,240,245,0.25)", marginLeft: 8 }}
            >
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
            style={{
              ...btnSec,
              padding: "10px 20px",
              border: saveFlash ? "1px solid rgba(0,200,83,0.4)" : "1px solid rgba(0,0,255,0.3)",
              color: saveFlash ? "#00C853" : "#3333FF",
              background: saveFlash ? "rgba(0,200,83,0.1)" : "rgba(255,255,255,0.04)",
              transition: "all 0.3s",
            }}
            onClick={() => saveCourse()}
            disabled={!title.trim()}
          >
            {saveFlash ? "✓ נשמר" : "שמור קורס"}
          </button>
          <button
            style={{ ...btnP, padding: "10px 20px", opacity: title.trim() ? 1 : 0.4 }}
            onClick={() => saveCourse(status === "draft" ? "active" : undefined)}
            disabled={!title.trim()}
          >
            שמור ופרסם
          </button>
        </div>
      </div>
    </div>
  );
}
