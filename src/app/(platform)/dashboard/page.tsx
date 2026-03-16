"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookIcon, FireIcon, TrophyIcon, PlayIcon } from "@/components/ui/icons";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { resolveImageUrl } from "@/lib/image-store";

const MOCK_STUDENTS = [
  { id: 1, name: "שירה כהן", designation: "סטודנטית", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face" },
  { id: 2, name: "דניאל לוי", designation: "מפתח", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face" },
  { id: 3, name: "נועה ברק", designation: "מעצבת UX", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
  { id: 4, name: "יונתן אברהם", designation: "יזם", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { id: 5, name: "מיכל רוזן", designation: "מנהלת מוצר", image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face" },
  { id: 6, name: "אורי גולן", designation: "מהנדס תוכנה", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face" },
];

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

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  featured: boolean;
  thumbnailUrl: string;
  chapters: { id: string; title: string; lessons: { id: string; title: string; videoUrl: string; duration: string }[] }[];
}

const DEMO_COURSES: Course[] = [
  { id: "demo-c1", title: "Mastering Claude Code", description: "למד איך להשתמש ב-Claude Code כמו מקצוען — MCP Servers, CLAUDE.md, Agent SDK ועוד", status: "active", featured: false, thumbnailUrl: "", chapters: [{ id: "ch1", title: "יסודות", lessons: Array.from({ length: 8 }, (_, i) => ({ id: `dl${i}`, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—" })) }] },
  { id: "demo-c2", title: "Vibe Coding Fundamentals", description: "למד לבנות אפליקציות עם AI — מהרעיון לביצוע", status: "active", featured: false, thumbnailUrl: "", chapters: [{ id: "ch1", title: "מבוא", lessons: Array.from({ length: 6 }, (_, i) => ({ id: `dl${i}`, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—" })) }] },
  { id: "demo-c3", title: "Building AI Agents", description: "בנה סוכני AI חכמים עם Claude Agent SDK", status: "active", featured: false, thumbnailUrl: "", chapters: [{ id: "ch1", title: "יסודות", lessons: Array.from({ length: 5 }, (_, i) => ({ id: `dl${i}`, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—" })) }] },
  { id: "demo-c4", title: "Automation Mastery", description: "אוטומציות חכמות לעסקים ולאנשים פרטיים", status: "active", featured: false, thumbnailUrl: "", chapters: [{ id: "ch1", title: "מבוא", lessons: Array.from({ length: 4 }, (_, i) => ({ id: `dl${i}`, title: `שיעור ${i + 1}`, videoUrl: "", duration: "—" })) }] },
  { id: "demo-c5", title: "AI Product Management", description: "ניהול מוצר בעולם ה-AI", status: "coming_soon", featured: false, thumbnailUrl: "", chapters: [] },
  { id: "demo-c6", title: "Advanced Prompt Engineering", description: "טכניקות מתקדמות לכתיבת פרומפטים", status: "coming_soon", featured: false, thumbnailUrl: "", chapters: [] },
];

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userName, setUserName] = useState("ערן");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bldr_courses") || "[]") as Course[];
      // Merge: user courses + demo courses (only add demos that don't conflict)
      const userIds = new Set(stored.map((c) => c.id));
      let merged = [...stored, ...DEMO_COURSES.filter((d) => !userIds.has(d.id))];
      // Apply admin-defined order if exists
      try {
        const orderStr = localStorage.getItem("bldr_course_order");
        if (orderStr) {
          const order: string[] = JSON.parse(orderStr);
          const orderMap = new Map(order.map((id, i) => [id, i]));
          merged = merged.sort((a, b) => {
            const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
            const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
            return ai - bi;
          });
        }
      } catch {}
      setCourses(merged);
    } catch {
      setCourses(DEMO_COURSES);
    }
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_user_profile") || "{}");
      if (profile.name) setUserName(profile.name.split(" ")[0]);
    } catch {}
    try {
      const cached = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      if (cached.role === "admin") setIsAdmin(true);
    } catch {}
  }, []);

  const activeCourses = courses.filter((c) => c.status === "active");
  const comingSoonCourses = courses.filter((c) => c.status === "coming_soon");
  const draftCourses = courses.filter((c) => c.status === "draft");
  const featuredCourse = courses.find((c) => c.featured && c.status === "active") || activeCourses[0];
  // Don't show featured course in the grid below
  const nonFeaturedActive = activeCourses.filter((c) => c.id !== featuredCourse?.id);

  const totalLessons = courses.reduce((s, c) => s + (c.chapters?.reduce((cs, ch) => cs + ch.lessons.length, 0) || 0), 0);
  const firstLesson = featuredCourse?.chapters?.[0]?.lessons?.[0];

  return (
    <div style={{ minHeight: "100vh", background: "#050510" }}>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashHeroFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .course-card-wrap:hover .admin-edit-btn { opacity: 1 !important; }
        .admin-edit-btn:hover { background: rgba(255,255,255,0.25) !important; }
        .hero-edit-btn:hover { background: rgba(255,255,255,0.25) !important; }
      `}</style>
      {/* ── Stats Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(10,10,26,0.6)", backdropFilter: "blur(12px)",
      }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5" }}>שלום, {userName}</span>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { icon: <BookIcon size={14} />, value: String(totalLessons), label: "שיעורים" },
            { icon: <FireIcon size={14} />, value: String(activeCourses.length), label: "קורסים" },
            { icon: <TrophyIcon size={14} />, value: "450", label: "נקודות" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "rgba(240,240,245,0.4)", display: "flex" }}>{s.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>{s.value}</span>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero — Featured Course ── */}
      {featuredCourse ? (
        <div style={{
          position: "relative", height: "75vh", minHeight: "450px",
          overflow: "hidden", display: "flex", alignItems: "flex-end", padding: "48px",
          animation: "dashHeroFade 0.8s ease-out",
        }}>
          {/* Background — use thumbnail or gradient */}
          {featuredCourse.thumbnailUrl ? (
            <>
              <ResolvedImg
                src={featuredCourse.thumbnailUrl}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Gradient only from bottom half — top stays clear */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, #050510 15%, rgba(5,5,16,0.85) 50%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "60%", background: "linear-gradient(to left, rgba(5,5,16,0.7) 0%, rgba(5,5,16,0.3) 40%, transparent 100%)" }} />
            </>
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #050510 0%, #0a0a2a 40%, #000044 70%, #050510 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 60%, rgba(0,0,255,0.12) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to top, #050510, transparent)" }} />
            </>
          )}

          {/* Admin edit button on hero */}
          {isAdmin && featuredCourse && (
            <a
              href={`/admin/courses/${featuredCourse.id}/edit`}
              className="hero-edit-btn"
              style={{
                position: "absolute", top: 20, left: 20,
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 3, cursor: "pointer", textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </a>
          )}
          <div style={{ position: "relative", zIndex: 1, maxWidth: "550px" }}>
            <span style={{ background: "rgba(0,0,255,0.2)", color: "#3333FF", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "inline-block", marginBottom: "12px" }}>
              קורס מומלץ
            </span>
            <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "12px", textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)" }}>
              {featuredCourse.title}
            </h1>
            {featuredCourse.description && (
              <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.6)", marginBottom: "16px", lineHeight: 1.6, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {featuredCourse.description.slice(0, 150)}
              </p>
            )}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ width: "fit-content", marginRight: "20px" }}>
                <AnimatedTooltip items={MOCK_STUDENTS} />
              </div>
              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", display: "block", marginTop: "8px" }}>32 סטודנטים לומדים עכשיו</span>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href={firstLesson ? `/courses/${featuredCourse.id}/lessons/${firstLesson.id}` : `/courses/${featuredCourse.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "12px",
                  fontWeight: 600, fontSize: "15px", textDecoration: "none",
                  boxShadow: "0 0 30px rgba(0,0,255,0.35)",
                }}
              >
                <PlayIcon size={16} /> התחל לצפות
              </Link>
              <Link
                href={`/courses/${featuredCourse.id}`}
                style={{
                  background: "rgba(255,255,255,0.08)", color: "#f0f0f5", padding: "12px 28px",
                  borderRadius: "12px", fontWeight: 600, fontSize: "15px",
                  border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none",
                }}
              >
                פרטי הקורס
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* No courses — empty hero */
        <div style={{
          height: "40vh", minHeight: "300px",
          background: "linear-gradient(135deg, #050510, #0a0a2a, #050510)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px",
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "rgba(240,240,245,0.5)" }}>ברוך הבא, {userName}!</h1>
          <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.3)" }}>עדיין אין קורסים. צור את הקורס הראשון שלך.</p>
          <Link href="/admin/courses/new" style={{
            background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "12px",
            fontWeight: 600, fontSize: "15px", textDecoration: "none", boxShadow: "0 0 30px rgba(0,0,255,0.35)",
          }}>
            צור קורס חדש
          </Link>
        </div>
      )}

      {/* ── All Active Courses ── */}
      {nonFeaturedActive.length > 0 && (
        <div style={{ padding: "32px 48px 24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>כל הקורסים</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {nonFeaturedActive.map((c, idx) => {
              const lessonCount = c.chapters?.reduce((s, ch) => s + ch.lessons.length, 0) || 0;
              return (
                <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="course-card-wrap" style={{
                    position: "relative",
                    borderRadius: 16,
                    overflow: "hidden",
                    minHeight: 220,
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.3s",
                    background: "linear-gradient(135deg, #0a0a2a, #000033)",
                    animation: `dashFadeUp 0.6s ease-out ${0.15 * idx}s both`,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.borderColor = "rgba(0,0,255,0.4)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,255,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* Background thumbnail */}
                    {c.thumbnailUrl && (
                      <ResolvedImg src={c.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    {/* Gradient overlay */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)",
                    }} />
                    {/* Badge */}
                    {c.featured && (
                      <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,255,0.35)", color: "#6666FF", padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>מומלץ</span>
                    )}
                    {/* Lesson count badge */}
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", color: "rgba(240,240,245,0.7)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>
                      {lessonCount} שיעורים
                    </span>
                    {/* Admin edit button */}
                    {isAdmin && (
                      <a
                        href={`/admin/courses/${c.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="admin-edit-btn"
                        style={{
                          position: "absolute", top: 12, right: 12,
                          width: 32, height: 32, borderRadius: "50%",
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          zIndex: 3, cursor: "pointer", textDecoration: "none",
                          opacity: 0, transition: "opacity 0.2s",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </a>
                    )}
                    {/* Text overlay */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "16px 20px",
                      zIndex: 2,
                    }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f5", marginBottom: 4, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{c.title}</h3>
                      {c.description && (
                        <p style={{ fontSize: 13, color: "rgba(240,240,245,0.55)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{c.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Coming Soon ── */}
      {comingSoonCourses.length > 0 && (
        <div style={{ padding: "16px 48px 48px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            עולה בקרוב
            <span style={{ background: "rgba(255,179,0,0.15)", color: "#FFB300", padding: "2px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>{comingSoonCourses.length}</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {comingSoonCourses.map((c, idx) => (
              <div key={c.id} style={{
                background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px", overflow: "hidden", opacity: 0.6,
                animation: `dashFadeUp 0.6s ease-out ${0.15 * (idx + nonFeaturedActive.length)}s both`,
              }}>
                <div style={{ position: "relative", paddingBottom: "56.25%", background: "linear-gradient(135deg, #0a0a2a, #0a0a20)" }}>
                  {c.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <ResolvedImg src={c.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                  )}
                  <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,179,0,0.25)", color: "#FFB300", padding: "4px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>בקרוב</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "rgba(240,240,245,0.5)", marginBottom: "6px" }}>{c.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
