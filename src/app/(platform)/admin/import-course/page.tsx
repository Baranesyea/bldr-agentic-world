"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  parseFile,
  generateTemplate,
  type ImportedCourse,
  type ImportedChapter,
  type ValidationError,
} from "@/lib/course-import";
import {
  generateThumbnail,
  type BrandSettings,
  type ThumbnailOptions,
} from "@/lib/thumbnail-generator";

// ── Styles ─────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 32,
  backdropFilter: "blur(20px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "rgba(240,240,245,0.6)",
  marginBottom: 8,
  fontWeight: 500,
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
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: "rgba(0,0,255,0.12)",
  color: "rgba(140,140,255,1)",
  border: "1px solid rgba(0,0,255,0.2)",
};

const badgeGreen: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: "rgba(0,200,100,0.12)",
  color: "rgba(100,255,180,1)",
  border: "1px solid rgba(0,200,100,0.2)",
};

// ── Component ──────────────────────────────────────────────────────
export default function ImportCoursePage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{
    course: ImportedCourse | null;
    errors: ValidationError[];
    stats: { totalChapters: number; totalLessons: number; withAssignments: number; withAttachments: number };
  } | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseStatus, setCourseStatus] = useState("draft");
  const [dragOver, setDragOver] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [imported, setImported] = useState(false);
  const [thumbStyle, setThumbStyle] = useState<ThumbnailOptions["style"]>("Gradient");
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ───────────────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const buffer = await f.arrayBuffer();
    const result = parseFile(buffer, f.name);
    setParseResult(result);
    if (!result.errors.some((e) => e.severity === "error") && result.course) {
      setStep(2);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const downloadTemplate = () => {
    const buf = generateTemplate();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "course-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleChapter = (num: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const doImport = () => {
    if (!parseResult?.course) return;
    const course = {
      ...parseResult.course,
      title: courseTitle,
      description: courseDesc,
      status: courseStatus,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("bldr_courses") || "[]");
    existing.push(course);
    localStorage.setItem("bldr_courses", JSON.stringify(existing));
    setImported(true);
  };

  const canProceedToPreview = courseTitle.trim().length > 0 && parseResult?.course;
  const hasErrors = parseResult?.errors.some((e) => e.severity === "error");

  // ── Step indicator ──────────────────────────────────────────────
  const steps = ["העלאה", "פרטים", "תצוגה מקדימה", "ייבוא"];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "rgba(240,240,245,0.35)", textDecoration: "none" }}>
          ניהול
        </Link>
        <span style={{ color: "rgba(240,240,245,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,245,0.6)" }}>ייבוא קורס</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
            ייבוא קורס
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={downloadTemplate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(240,240,245,0.7)", fontSize: 13, cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              הורד תבנית Excel
            </button>
            <a
              href="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/copy"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                border: "1px solid rgba(0,200,83,0.2)",
                background: "rgba(0,200,83,0.08)",
                color: "#00C853", fontSize: 13, textDecoration: "none", cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              פתח ב-Google Sheets
            </a>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", marginTop: 4 }}>
          העלה קובץ אקסל או CSV לייבוא תוכן קורס בכמויות
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    background: isDone
                      ? "#0000FF"
                      : isActive
                        ? "rgba(0,0,255,0.2)"
                        : "rgba(255,255,255,0.06)",
                    color: isDone || isActive ? "#fff" : "rgba(240,240,245,0.35)",
                    border: isActive ? "2px solid #0000FF" : "2px solid transparent",
                    transition: "all 0.3s",
                  }}
                >
                  {isDone ? "✓" : stepNum}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#fff" : "rgba(240,240,245,0.4)",
                    
                  }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    margin: "0 16px",
                    background: isDone ? "rgba(0,0,255,0.4)" : "rgba(255,255,255,0.06)",
                    transition: "all 0.3s",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step 1: Upload ─────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ ...card }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 24,
              
            }}
          >
            העלאת קובץ קורס
          </h2>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#0000FF" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 16,
              padding: "60px 32px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              background: dragOver ? "rgba(0,0,255,0.06)" : "transparent",
              boxShadow: dragOver ? "0 0 40px rgba(0,0,255,0.15)" : "none",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {file ? "📄" : "📁"}
            </div>
            {file ? (
              <>
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>{file.name}</p>
                <p style={{ color: "rgba(240,240,245,0.4)", fontSize: 13, marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 500 }}>
                  גרור ושחרר קובץ כאן
                </p>
                <p style={{ color: "rgba(240,240,245,0.35)", fontSize: 13, marginTop: 6 }}>
                  תומך בקבצי xlsx ו-csv
                </p>
              </>
            )}
          </div>

          {/* Errors */}
          {parseResult && hasErrors && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,60,60,0.08)",
                border: "1px solid rgba(255,60,60,0.2)",
              }}
            >
              <p style={{ color: "#ff6b6b", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                שגיאות תיקוף
              </p>
              {parseResult.errors
                .filter((e) => e.severity === "error")
                .slice(0, 10)
                .map((e, i) => (
                  <p key={i} style={{ color: "rgba(255,120,120,0.9)", fontSize: 13, marginTop: 4 }}>
                    שורה {e.row}, {e.column}: {e.message}
                  </p>
                ))}
              {parseResult.errors.filter((e) => e.severity === "error").length > 10 && (
                <p style={{ color: "rgba(255,120,120,0.6)", fontSize: 12, marginTop: 8 }}>
                  ...ועוד {parseResult.errors.filter((e) => e.severity === "error").length - 10} שגיאות
                </p>
              )}
            </div>
          )}

          {/* Expected columns */}
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 12,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,240,245,0.5)", marginBottom: 8 }}>עמודות נדרשות בקובץ:</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["מספר_נושא", "שם_הנושא", "מספר_שיעור", "שם_השיעור", "כתובת_וידאו"].map((col) => (
                <span key={col} style={{ background: "rgba(0,0,255,0.08)", color: "#3333FF", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-heading-en)" }}>{col}</span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "rgba(240,240,245,0.3)", marginTop: 8 }}>
              עמודות אופציונליות: תיאור, מטלה, טקסט_מטלה, כישורים, קבצים, הערות
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {file && !hasErrors && parseResult?.course && (
              <button style={btnPrimary} onClick={() => setStep(2)}>
                המשך
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Course Details ─────────────────────────────── */}
      {step === 2 && (
        <div style={{ ...card }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 24,
              
            }}
          >
            פרטי הקורס
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={labelStyle}>שם הקורס *</label>
              <input
                style={inputStyle}
                placeholder="לדוגמה: מאסטר באוטומציית AI"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>תיאור הקורס</label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                placeholder="מה הסטודנטים ילמדו בקורס הזה?"
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>סטטוס</label>
              <div style={{ position: "relative" }}>
                <select
                  style={selectStyle}
                  value={courseStatus}
                  onChange={(e) => setCourseStatus(e.target.value)}
                >
                  <option value="draft">טיוטה</option>
                  <option value="active">פעיל</option>
                  <option value="coming_soon">בקרוב</option>
                </select>
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(240,240,245,0.35)",
                    pointerEvents: "none",
                    fontSize: 12,
                  }}
                >
                  ▼
                </span>
              </div>
            </div>
            {/* Thumbnail Generator */}
            <div>
              <label style={labelStyle}>תמונה ממוזערת לקורס</label>
              <div style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 12 }}>סגנון</label>
                    <select
                      style={selectStyle}
                      value={thumbStyle}
                      onChange={(e) => setThumbStyle(e.target.value as ThumbnailOptions["style"])}
                    >
                      {["Minimal", "Bold", "Cinematic", "Gradient"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    style={{
                      ...btnPrimary,
                      opacity: courseTitle.trim() ? 1 : 0.4,
                      padding: "12px 20px",
                    }}
                    disabled={!courseTitle.trim() || generatingThumb}
                    onClick={() => {
                      if (!courseTitle.trim()) return;
                      setGeneratingThumb(true);
                      setTimeout(() => {
                        let brand: BrandSettings = {
                          brandName: "", primaryColor: "#1a1aff", secondaryColor: "#4444ff",
                          accentColor: "#00ccff", logoUrl: "", logoColor: "#ffffff",
                          gradientStartColor: "#1a1aff", gradientEndColor: "#4444ff", gradientDirection: "to right",
                        };
                        try {
                          const stored = localStorage.getItem("bldr_brand_settings");
                          if (stored) brand = JSON.parse(stored);
                        } catch {}
                        const url = generateThumbnail(brand, {
                          title: courseTitle,
                          subtitle: courseDesc.slice(0, 60),
                          style: thumbStyle,
                          size: "1280x720",
                        });
                        setThumbPreview(url);
                        setGeneratingThumb(false);
                      }, 300);
                    }}
                  >
                    {generatingThumb ? "יוצר..." : "צור תמונה ממוזערת"}
                  </button>
                </div>

                {thumbPreview ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbPreview}
                      alt="Course thumbnail"
                      style={{ width: "100%", borderRadius: 8, display: "block" }}
                    />
                    <p style={{ color: "rgba(240,240,245,0.35)", fontSize: 11, marginTop: 8 }}>
                      משתמש בצבעי המותג והגרדיאנט מההגדרות
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <p style={{ color: "rgba(240,240,245,0.25)", fontSize: 13 }}>
                      הזן שם קורס ולחץ על צור כדי ליצור תמונה ממוזערת
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button style={btnSecondary} onClick={() => setStep(1)}>
              חזרה
            </button>
            <button
              style={{
                ...btnPrimary,
                opacity: canProceedToPreview ? 1 : 0.4,
                pointerEvents: canProceedToPreview ? "auto" : "none",
              }}
              onClick={() => setStep(3)}
            >
              המשך
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview & Validate ─────────────────────────── */}
      {step === 3 && parseResult?.course && (
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
                
              }}
            >
              תצוגה מקדימה ואימות
            </h2>
            {/* Stats */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "פרקים", value: parseResult.stats.totalChapters },
                { label: "שיעורים", value: parseResult.stats.totalLessons },
                { label: "מטלות", value: parseResult.stats.withAssignments },
                { label: "קבצים מצורפים", value: parseResult.stats.withAttachments },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,240,245,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {parseResult.errors.filter((e) => e.severity === "warning").length > 0 && (
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,180,0,0.08)",
                border: "1px solid rgba(255,180,0,0.2)",
              }}
            >
              {parseResult.errors
                .filter((e) => e.severity === "warning")
                .map((e, i) => (
                  <p key={i} style={{ color: "rgba(255,200,60,0.9)", fontSize: 12, marginTop: i ? 4 : 0 }}>
                    אזהרה: שורה {e.row}, {e.column} - {e.message}
                  </p>
                ))}
            </div>
          )}

          {/* Tree */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {parseResult.course.chapters.map((ch: ImportedChapter) => (
              <div
                key={ch.number}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  overflow: "hidden",
                }}
              >
                {/* Chapter header */}
                <div
                  onClick={() => toggleChapter(ch.number)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        transform: expandedChapters.has(ch.number) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        display: "inline-block",
                        fontSize: 12,
                        color: "rgba(240,240,245,0.35)",
                      }}
                    >
                      ▶
                    </span>
                    <span style={{ color: "rgba(0,0,255,0.6)", fontSize: 12, fontWeight: 600 }}>
                      CH {ch.number}
                    </span>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{ch.title}</span>
                  </div>
                  <span style={{ color: "rgba(240,240,245,0.35)", fontSize: 12 }}>
                    {ch.lessons.length} שיעורים
                  </span>
                </div>

                {/* Lessons */}
                {expandedChapters.has(ch.number) && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {ch.lessons.map((lesson) => (
                      <div
                        key={`${ch.number}-${lesson.number}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 16px 10px 48px",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ color: "rgba(240,240,245,0.3)", fontSize: 12, minWidth: 24 }}>
                          {ch.number}.{lesson.number}
                        </span>
                        <span style={{ color: "rgba(240,240,245,0.8)", fontSize: 13, flex: 1, minWidth: 150 }}>
                          {lesson.title}
                        </span>
                        <span style={{ color: "rgba(240,240,245,0.3)", fontSize: 12 }}>
                          {lesson.duration}
                        </span>
                        <span
                          style={{ color: "rgba(240,240,245,0.25)", fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={lesson.videoUrl}
                        >
                          {lesson.videoUrl}
                        </span>
                        {lesson.skills.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {lesson.skills.map((s) => (
                              <span key={s} style={tagStyle}>{s}</span>
                            ))}
                          </div>
                        )}
                        {lesson.hasAssignment && <span style={badgeGreen}>מטלה</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button style={btnSecondary} onClick={() => setStep(2)}>
              חזרה
            </button>
            <button style={btnPrimary} onClick={() => setStep(4)}>
              המשך
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm & Import ───────────────────────────── */}
      {step === 4 && !imported && parseResult?.course && (
        <div style={{ ...card }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 24,
              
            }}
          >
            אישור וייבוא
          </h2>

          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {[
              { label: "שם הקורס", value: courseTitle },
              { label: "תיאור", value: courseDesc || "—" },
              { label: "סטטוס", value: courseStatus.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
              { label: "פרקים", value: String(parseResult.stats.totalChapters) },
              { label: "סה״כ שיעורים", value: String(parseResult.stats.totalLessons) },
              { label: "עם מטלות", value: String(parseResult.stats.withAssignments) },
              { label: "עם קבצים מצורפים", value: String(parseResult.stats.withAttachments) },
              { label: "קובץ מקור", value: file?.name || "—" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(240,240,245,0.4)", fontSize: 13 }}>{row.label}</span>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button style={btnSecondary} onClick={() => setStep(3)}>
              חזרה
            </button>
            <button style={btnPrimary} onClick={doImport}>
              ייבא קורס
            </button>
          </div>
        </div>
      )}

      {/* ── Success ────────────────────────────────────────────── */}
      {imported && (
        <div style={{ ...card, textAlign: "center", padding: "60px 32px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(0,200,100,0.12)",
              border: "2px solid rgba(0,200,100,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 24px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              
            }}
          >
            הקורס יובא בהצלחה
          </h2>
          <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 14, marginTop: 8 }}>
            &ldquo;{courseTitle}&rdquo; עם {parseResult?.stats.totalChapters} פרקים ו-{parseResult?.stats.totalLessons} שיעורים נשמר בהצלחה.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
            <Link href="/courses" style={{ ...btnSecondary, textDecoration: "none", display: "inline-block" }}>
              צפה בקורסים
            </Link>
            <button
              style={btnPrimary}
              onClick={() => {
                setStep(1);
                setFile(null);
                setParseResult(null);
                setCourseTitle("");
                setCourseDesc("");
                setCourseStatus("draft");
                setImported(false);
                setExpandedChapters(new Set());
              }}
            >
              ייבא עוד
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
