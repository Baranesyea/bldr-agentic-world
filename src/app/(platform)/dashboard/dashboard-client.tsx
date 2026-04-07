"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { BookIcon, FireIcon, TrophyIcon, PlayIcon, LockIcon, CheckIcon } from "@/components/ui/icons";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { resolveImageUrl } from "@/lib/image-store";
import { YouTubeCarousel, YouTubeShortsCarousel } from "@/components/youtube-carousel";
import { useAccessCheck, isCourseAvailable } from "@/hooks/useAccessCheck";
import { PricingPopup } from "@/components/ui/pricing-popup";
import { useUser } from "@/hooks/useUser";

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

function getTotalDuration(c: { chapters: { lessons: { duration: string }[] }[] }): string {
  let totalSec = 0;
  for (const ch of c.chapters) {
    for (const l of ch.lessons) {
      if (!l.duration) continue;
      const parts = l.duration.split(":").map(Number);
      if (parts.length === 2) totalSec += parts[0] * 60 + parts[1];
      else if (parts.length === 3) totalSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  if (totalSec === 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h} שע׳ ${m > 0 ? `${m} דק׳` : ""}`.trim();
  return `${m} דק׳`;
}

interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  status: string;
  featured: boolean;
  thumbnailUrl: string;
  chapters: { id: string; title: string; lessons: { id: string; slug?: string; title: string; videoUrl: string; duration: string }[] }[];
}

interface DashboardClientProps {
  courses: Course[];
}

export default function DashboardClient({ courses }: DashboardClientProps) {
  const { profile: userProfile, isAdmin } = useUser();
  const [showPricing, setShowPricing] = useState(false);
  const access = useAccessCheck();

  const userName = userProfile?.full_name?.split(" ")[0] || "";

  // Last watched + progress
  const [lastWatched, setLastWatched] = useState<{ lessonId: string; courseId: string; courseTitle: string; lessonTitle: string; watchPosition: number } | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("bldr_completed_lessons") || "[]"); } catch {}
    }
    return [];
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email;
        if (!email) return;
        // Fetch last-watched and progress in parallel
        const [lwRes, progRes] = await Promise.all([
          fetch(`/api/progress/last-watched?email=${encodeURIComponent(email)}`),
          fetch(`/api/progress?email=${encodeURIComponent(email)}`),
        ]);
        const lw = await lwRes.json();
        if (lw && lw.lessonId) setLastWatched(lw);
        const prog = await progRes.json();
        if (Array.isArray(prog.completedLessons) && prog.completedLessons.length > 0) {
          setCompletedLessons(prog.completedLessons);
          localStorage.setItem("bldr_completed_lessons", JSON.stringify(prog.completedLessons));
        }
      } catch {}
    })();
  }, []);

  const activeCourses = courses.filter((c) => c.status === "active");
  const comingSoonCourses = courses.filter((c) =>
    c.status === "coming_soon" || (c.status === "draft" && isAdmin)
  );
  const featuredCourse = activeCourses.find((c) => c.featured) || activeCourses[0];
  // Show all active courses in the grid (including featured)
  const nonFeaturedActive = activeCourses;

  const totalLessons = courses.reduce((s, c) => s + (c.chapters?.reduce((cs, ch) => cs + ch.lessons.length, 0) || 0), 0);
  const firstLesson = featuredCourse?.chapters?.[0]?.lessons?.[0];
  const featuredAllLessons = featuredCourse?.chapters?.flatMap((ch) => ch.lessons) || [];
  const featuredDone = featuredAllLessons.filter((l) => completedLessons.includes(l.id)).length;
  const featuredTotal = featuredAllLessons.length;
  const featuredComplete = featuredTotal > 0 && featuredDone === featuredTotal;
  const featuredStarted = featuredDone > 0;

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
        @media (max-width: 768px) {
          .dash-hero { height: auto !important; min-height: 280px !important; padding: 24px 16px !important; }
          .dash-hero h1 { font-size: 28px !important; }
          .dash-section { padding: 20px 16px 16px !important; }
          .dash-stats-bar { padding: 10px 16px !important; flex-wrap: wrap; gap: 8px; }
        }
      `}</style>
      {/* ── Stats Bar ── */}
      <div className="dash-stats-bar" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(10,10,26,0.6)", backdropFilter: "blur(12px)",
      }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5" }}>{(() => {
          const h = new Date().getHours();
          if (h >= 5 && h < 12) return "בוקר טוב";
          if (h >= 12 && h < 17) return "צהריים טובים";
          if (h >= 17 && h < 21) return "ערב טוב";
          if (h >= 21 && h <= 23) return "לילה טוב";
          return "אמצע הלילה טוב";
        })()}, {userName}</span>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { icon: <BookIcon size={14} />, value: String(totalLessons), label: "שיעורים" },
            { icon: <FireIcon size={14} />, value: String(activeCourses.length), label: "קורסים" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#f0f0f5", display: "flex", alignItems: "center" }}>{s.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5", lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: "12px", color: "#f0f0f5", lineHeight: 1 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Continue Where You Left Off (desktop only) ── */}
      {!isMobile && lastWatched && (
        <Link
          href={`/courses/${lastWatched.courseId}/lessons/${lastWatched.lessonId}?t=${Math.floor(lastWatched.watchPosition / 60)}:${String(lastWatched.watchPosition % 60).padStart(2, "0")}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <div style={{
            margin: "0",
            padding: "10px 32px",
            background: "transparent",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(0,0,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <PlayIcon size={14} color="#6666FF" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5" }}>
                  המשך מאיפה שעצרת
                </div>
                <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)", marginTop: 1 }}>
                  {lastWatched.courseTitle} · {lastWatched.lessonTitle}{lastWatched.watchPosition > 0 ? ` · ${Math.floor(lastWatched.watchPosition / 60)}:${String(lastWatched.watchPosition % 60).padStart(2, "0")}` : ""}
                </div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6666FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </div>
        </Link>
      )}

      {/* ── Hero — Featured Course ── */}
      {featuredCourse ? (
        <div className="dash-hero" style={{
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
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <span style={{ background: "rgba(0,0,255,0.2)", color: "#3333FF", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                קורס מומלץ
              </span>
              {featuredComplete ? (
                <span style={{ background: "rgba(0,200,83,0.15)", border: "1px solid rgba(0,200,83,0.3)", color: "#00C853", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckIcon size={12} color="#00C853" /> הושלם
                </span>
              ) : featuredStarted ? (
                <span style={{ background: "rgba(255,255,255,0.08)", color: "#fff", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                  {featuredDone}/{featuredTotal} שיעורים
                </span>
              ) : null}
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f0f0f5", lineHeight: 1.1, marginBottom: "12px", textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)" }}>
              {featuredCourse.title}
            </h1>
            {featuredCourse.description && (
              <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.7)", marginBottom: "16px", lineHeight: 1.6, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {featuredCourse.description.slice(0, 150)}
              </p>
            )}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ width: "fit-content", marginRight: "20px" }}>
                <AnimatedTooltip items={MOCK_STUDENTS} />
              </div>
              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginTop: "8px" }}>32 סטודנטים לומדים עכשיו</span>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href={firstLesson ? `/courses/${featuredCourse.id}/lessons/${firstLesson.id}` : `/courses/${featuredCourse.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "4px",
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
                  borderRadius: "4px", fontWeight: 600, fontSize: "15px",
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
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "rgba(240,240,245,0.7)" }}>ברוך הבא, {userName}!</h1>
          <p style={{ fontSize: "15px", color: "rgba(240,240,245,0.7)" }}>עדיין אין קורסים. צור את הקורס הראשון שלך.</p>
          <Link href="/admin/courses/new" style={{
            background: "#0000FF", color: "white", padding: "12px 28px", borderRadius: "4px",
            fontWeight: 600, fontSize: "15px", textDecoration: "none", boxShadow: "0 0 30px rgba(0,0,255,0.35)",
          }}>
            צור קורס חדש
          </Link>
        </div>
      )}

      {/* ── YouTube Carousel ── */}
      <YouTubeCarousel />

      {/* ── All Active Courses ── */}
      {nonFeaturedActive.length > 0 && (
        <div className="dash-section" style={{ padding: "32px 48px 24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>כל הקורסים</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {nonFeaturedActive.map((c, idx) => {
              const allCourseLessons = c.chapters?.flatMap((ch) => ch.lessons) || [];
              const lessonCount = allCourseLessons.length;
              const totalDur = getTotalDuration(c);
              const doneLessons = allCourseLessons.filter((l) => completedLessons.includes(l.id)).length;
              const courseComplete = lessonCount > 0 && doneLessons === lessonCount;
              const courseStarted = doneLessons > 0;
              const locked = !isAdmin && !access.loading && access.allCourseIds.length > 0 && !isCourseAvailable(c.id, access);
              if (locked) {
                return (
                <div key={c.id} onClick={() => setShowPricing(true)} style={{ textDecoration: "none", cursor: "pointer" }}>
                  <div className="course-card-wrap" style={{
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                    aspectRatio: "16 / 10",
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
                    {/* Gradient overlay — strong bottom for text readability */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.92) 35%, rgba(5,5,16,0.5) 55%, rgba(5,5,16,0.15) 80%, rgba(5,5,16,0.08) 100%)",
                    }} />
                    {/* Badge */}
                    {c.featured && (
                      <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,255,0.35)", color: "#6666FF", padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>מומלץ</span>
                    )}
                    {/* Lesson count badge */}
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", color: "rgba(240,240,245,0.7)", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>
                      {lessonCount} שיעורים{totalDur ? ` · ${totalDur}` : ""}
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
                    {/* Text overlay — starts from ~50% of card height */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "0 20px 16px",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f5", marginBottom: 6, textShadow: "0 1px 6px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", lineHeight: 1.35 }}>{c.title}</h3>
                      {c.description && (
                        <p style={{ fontSize: 12, color: "rgba(240,240,245,0.7)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{c.description}</p>
                      )}
                    </div>
                    {/* Lock overlay for unavailable courses */}
                    {locked && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(5,5,16,0.6)",
                        zIndex: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "8px",
                      }}>
                        <LockIcon size={32} color="rgba(240,240,245,0.5)" />
                        <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", fontWeight: 500 }}>תוכן למנויים בלבד</span>
                      </div>
                    )}
                  </div>
                </div>
                );
              }
              return (
                <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
                  <div className="course-card-wrap" style={{
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                    aspectRatio: "16 / 10",
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.3s",
                    background: "linear-gradient(135deg, #0a0a2a, #000033)",
                    animation: `dashFadeUp 0.6s ease-out ${0.15 * idx}s both`,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.borderColor = "rgba(0,0,255,0.4)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,255,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {c.thumbnailUrl && (
                      <ResolvedImg src={c.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.92) 35%, rgba(5,5,16,0.5) 55%, rgba(5,5,16,0.15) 80%, rgba(5,5,16,0.08) 100%)",
                    }} />
                    {c.featured && (
                      <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,255,0.35)", color: "#6666FF", padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>מומלץ</span>
                    )}
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", color: "rgba(240,240,245,0.7)", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>
                      {lessonCount} שיעורים{totalDur ? ` · ${totalDur}` : ""}
                    </span>
                    {/* Completion indicator */}
                    {courseComplete ? (
                      <div style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,200,83,0.2)", border: "2px solid #00C853", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, backdropFilter: "blur(4px)" }}>
                        <CheckIcon size={16} color="#00C853" />
                      </div>
                    ) : courseStarted ? (
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "4px 10px", zIndex: 2, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{doneLessons}/{lessonCount}</span>
                      </div>
                    ) : null}
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
                    <div style={{
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      padding: "0 20px 16px",
                      zIndex: 2,
                      display: "flex", flexDirection: "column", justifyContent: "flex-end",
                    }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f5", marginBottom: 6, textShadow: "0 1px 6px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", lineHeight: 1.35 }}>{c.title}</h3>
                      {c.description && (
                        <p style={{ fontSize: 12, color: "rgba(240,240,245,0.7)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{c.description}</p>
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
        <div className="dash-section" style={{ padding: "16px 48px 48px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            עולה בקרוב
            <span style={{ background: "rgba(255,179,0,0.15)", color: "#FFB300", padding: "2px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>{comingSoonCourses.length}</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {comingSoonCourses.map((c, idx) => (
              <div key={c.id} style={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                aspectRatio: "16 / 10",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "linear-gradient(135deg, #0a0a2a, #000033)",
                animation: `dashFadeUp 0.6s ease-out ${0.15 * (idx + nonFeaturedActive.length)}s both`,
              }}>
                {/* Background thumbnail */}
                {c.thumbnailUrl && (
                  <ResolvedImg src={c.thumbnailUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                )}
                {/* Gradient overlay — same as active courses */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.92) 35%, rgba(5,5,16,0.5) 55%, rgba(5,5,16,0.15) 80%, rgba(5,5,16,0.08) 100%)",
                }} />
                {/* Badge */}
                <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,179,0,0.25)", color: "#FFB300", padding: "4px 14px", borderRadius: 4, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", zIndex: 2 }}>בקרוב</span>
                {/* Text overlay — same position as active courses */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "0 20px 16px",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f5", marginBottom: 6, textShadow: "0 1px 6px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", lineHeight: 1.35 }}>{c.title}</h3>
                  {c.description && (
                    <p style={{ fontSize: 12, color: "rgba(240,240,245,0.7)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{c.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── YouTube Shorts ── */}
      <YouTubeShortsCarousel />

      {/* Pricing Popup */}
      {showPricing && <PricingPopup onClose={() => setShowPricing(false)} />}
    </div>
  );
}
