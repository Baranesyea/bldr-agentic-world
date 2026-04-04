"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  CoursesIcon,
  NotebookIcon,
  CalendarIcon,
  QuestionIcon,
  ChatIcon,
  ProfileIcon,
  SettingsIcon,
  GraduationIcon,
  LinkIcon,
  ImportIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FeedbackIcon,
  UsersIcon,
  LightbulbIcon,
  BrainIcon,
  SocialIcon,
  TerminalIcon,
  BellDotIcon,
  BeakerIcon,
  NewsIcon,
  CloseIcon,
  TourIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { Sparkles, BookOpen, Rocket, Layers, Calendar } from "lucide-react";
import { MorphingCardStack, type CardData } from "@/components/ui/morphing-card-stack";
import { useUser, getTouristData } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { SchoolSwitcher } from "@/components/layout/school-switcher";

const mainNav = [
  { label: "לימודים", href: "/dashboard", icon: CoursesIcon },
  { label: "מחברת", href: "/notebook", icon: NotebookIcon },
  { label: "לוח שנה", href: "/calendar", icon: CalendarIcon },
  { label: "מקרי בוחן", href: "/case-studies", icon: BeakerIcon },
  { label: "שאלות", href: "/qa", icon: QuestionIcon },
  { label: "פרופיל", href: "/profile", icon: ProfileIcon },
  { label: "סיור", href: "#tour", icon: TourIcon },
  { label: "מפגשי קהילה", href: "/community-meetings", icon: CalendarIcon },
  { label: "קהילה", href: "#whatsapp", icon: WhatsAppIcon },
];

const adminNav = [
  { label: "ניהול", href: "/admin", icon: SettingsIcon },
  { label: "ניהול קורסים", href: "/admin/courses", icon: GraduationIcon },
  { label: "פידבקים", href: "/admin/feedback", icon: FeedbackIcon },
  { label: "משתמשים", href: "/admin/users", icon: UsersIcon },
  { label: "קישורי שיתוף", href: "/admin/share-links", icon: LinkIcon },
  { label: "חשבונות מחוקים", href: "/admin/deleted-accounts", icon: UsersIcon },
  { label: "רעיונות לתכנים", href: "/admin/content-ideas", icon: LightbulbIcon },
  { label: "רעיונות לפיתוח", href: "/admin/ideas", icon: LightbulbIcon },
  { label: "משימות", href: "/admin/tasks", icon: LightbulbIcon },
  { label: "סטודנטים", href: "/admin/members", icon: UsersIcon },
  { label: "בתי ספר", href: "/admin/schools", icon: GraduationIcon },
  { label: "ייבוא משתמשים", href: "/admin/import-users", icon: ImportIcon },
  { label: "אנליטיקס", href: "/admin/analytics", icon: DashboardIcon },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: string;
  link?: string;
}

export function Sidebar({ collapsed: collapsedProp, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile: userProfile, isAdmin } = useUser();
  const touristData = typeof window !== "undefined" ? getTouristData() : null;
  const isTourist = !!touristData;
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = collapsedProp ?? internalCollapsed;
  const toggleCollapse = onToggle ?? (() => setInternalCollapsed(!internalCollapsed));
  const width = collapsed ? 68 : 240;
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    if (collapsed) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setInternalCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewAsUser, setViewAsUser] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newsCards, setNewsCards] = useState<CardData[]>([]);
  const notifLeaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tourBtnHighlight, setTourBtnHighlight] = useState(false);
  const tourBtnRef = useRef<HTMLButtonElement>(null);

  // Listen for tour-complete event to highlight the tour button
  useEffect(() => {
    const handleTourComplete = () => {
      setTourBtnHighlight(true);
      setTimeout(() => setTourBtnHighlight(false), 4500);
    };
    window.addEventListener("bldr:tour-complete", handleTourComplete);
    return () => window.removeEventListener("bldr:tour-complete", handleTourComplete);
  }, []);

  // Load notifications
  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bldr_notifications") || "[]");
      setNotifications(stored);
    } catch {}
  }, [showNotifications]);

  // Load news from API
  const iconMap: Record<string, React.ReactNode> = {
    sparkles: <Sparkles size={20} />,
    book: <BookOpen size={20} />,
    rocket: <Rocket size={20} />,
    layers: <Layers size={20} />,
    calendar: <Calendar size={20} />,
  };

  React.useEffect(() => {
    if (!showNews) return;
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cards: CardData[] = data.map((n: { id: string; title: string; description: string; icon?: string; url?: string }) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            icon: n.icon ? iconMap[n.icon] : undefined,
            url: n.url,
          }));
          setNewsCards(cards);
        }
      })
      .catch(() => {});
  }, [showNews]);

  // Close news on Escape
  React.useEffect(() => {
    if (!showNews) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowNews(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showNews]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("bldr_notifications", JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("bldr_notifications", JSON.stringify(updated));
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const handleTourClick = () => {
    localStorage.setItem("bldr_onboarding_trigger", "true");
  };

  const NavLink = ({ item }: { item: { label: string; href: string; icon: React.ComponentType<{ size?: number; color?: string }> } }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    if (item.href === "#tour" || item.href === "#whatsapp") {
      const handleClick = () => {
        if (item.href === "#tour") {
          localStorage.setItem("bldr_onboarding_trigger", "true");
        } else {
          try {
            const s = JSON.parse(localStorage.getItem("bldr_whatsapp_settings") || "{}");
            if (s.url) window.open(s.url, "_blank");
          } catch {}
        }
      };
      const isWA = item.href === "#whatsapp";
      const isTour = item.href === "#tour";
      const isHighlighted = isTour && tourBtnHighlight;
      return (
        <button
          ref={isTour ? tourBtnRef : undefined}
          onClick={handleClick}
          onMouseEnter={(e) => {
            if (isWA) {
              e.currentTarget.style.color = "#25D366";
              e.currentTarget.style.textShadow = "0 0 12px rgba(37,211,102,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (isWA) {
              e.currentTarget.style.color = "rgba(240,240,245,0.7)";
              e.currentTarget.style.textShadow = "none";
            }
          }}
          className={isHighlighted ? "tour-btn-highlight" : ""}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: collapsed ? "10px" : "10px 12px", borderRadius: "4px",
            fontSize: "14px", width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontWeight: 400,
            color: isHighlighted ? "#f0f0f5" : "rgba(240,240,245,0.6)",
            background: isHighlighted ? "rgba(0,0,255,0.12)" : "transparent",
            border: isHighlighted ? "1px solid rgba(0,0,255,0.3)" : "1px solid transparent",
            cursor: "pointer",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "all 0.4s ease",
            boxShadow: isHighlighted ? "0 0 16px rgba(0,0,255,0.25), inset 0 0 12px rgba(0,0,255,0.08)" : "none",
            position: "relative",
          }}
        >
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", transition: "filter 0.4s ease" }}><Icon size={18} /></span>
          {!collapsed && <span>{item.label}</span>}
        </button>
      );
    }

    return (
      <Link href={item.href} data-nav={item.href}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(240,240,245,0.85)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(240,240,245,0.7)";
          }
        }}
        style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: collapsed ? "10px" : "10px 12px", borderRadius: "4px",
        textDecoration: "none", fontSize: "14px",
        justifyContent: collapsed ? "center" : "flex-start",
        fontWeight: active ? 700 : 400,
        color: active ? "#fff" : "rgba(240,240,245,0.6)",
        background: active ? "rgba(0,0,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(0,0,255,0.25)" : "1px solid transparent",
        boxShadow: active ? "0 0 20px rgba(0,0,255,0.1)" : "none",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "background 0.2s, color 0.2s",
      }}>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><Icon size={18} /></span>
        {!collapsed && <span style={{ opacity: 1, transition: "opacity 0.2s" }}>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
    <style>{`
      @keyframes tourBtnPulse {
        0%, 100% { box-shadow: 0 0 16px rgba(0,0,255,0.25), inset 0 0 12px rgba(0,0,255,0.08); }
        50% { box-shadow: 0 0 24px rgba(0,0,255,0.4), inset 0 0 16px rgba(0,0,255,0.12); }
      }
      .tour-btn-highlight {
        animation: tourBtnPulse 1.5s ease-in-out infinite !important;
      }
    `}</style>
    {loggingOut && <LoadingSpinner text="מתנתק..." />}
    <aside ref={sidebarRef} style={{
      height: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,26,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      {/* Admin view toggle */}
      {isAdmin && (
        <div style={{
          padding: collapsed ? "6px 4px" : "6px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
          background: viewAsUser ? "rgba(255,179,0,0.06)" : "transparent",
          transition: "background 0.2s",
        }}>
          {!collapsed && (
            <span style={{ fontSize: "11px", color: viewAsUser ? "#FFB300" : "rgba(240,240,245,0.25)" }}>
              {viewAsUser ? "מצב משתמש" : "מצב מנהל"}
            </span>
          )}
          <ToggleSwitch checked={viewAsUser} onChange={setViewAsUser} activeColor="#FFB300" size="sm" />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: collapsed ? "64px" : "100px", padding: collapsed ? "0 12px" : "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "height 0.3s, padding 0.3s" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/logo.png" alt="BLDR" width={collapsed ? 36 : 160} height={collapsed ? 36 : 60} style={{ objectFit: "contain", transition: "all 0.3s" }} />
        </Link>
      </div>

      {!isTourist && (
        <SchoolSwitcher
          userId={userProfile?.id || ""}
          activeSchoolId={typeof window !== "undefined" ? localStorage.getItem("bldr_active_school") : null}
          collapsed={collapsed}
        />
      )}

      <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {isTourist ? (
          <>
            {touristData?.type === "lesson" && touristData.courseId && touristData.lessonId && (
              <NavLink item={{ label: "הסרטון שלי", href: `/courses/${touristData.courseId}/lessons/${touristData.lessonId}`, icon: CoursesIcon }} />
            )}
            {touristData?.type === "course" && touristData.courseId && (
              <NavLink item={{ label: "הקורס שלי", href: `/courses/${touristData.courseId}`, icon: CoursesIcon }} />
            )}
            {touristData?.type === "case_study" && (
              <NavLink item={{ label: "מקרי בוחן", href: "/case-studies", icon: BeakerIcon }} />
            )}
            <NavLink item={{ label: "לוח שנה", href: "/calendar", icon: CalendarIcon }} />
            <NavLink item={{ label: "פרופיל", href: "/profile", icon: ProfileIcon }} />
          </>
        ) : (
          <>
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            {isAdmin && !viewAsUser && (
              <>
                <div style={{ margin: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                {adminNav.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* News button */}
      <div style={{ padding: "4px 8px 0", position: "relative" }}>
        <button
          onClick={() => setShowNews(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: "12px", width: "100%", padding: collapsed ? "10px" : "10px 12px",
            borderRadius: "4px", background: "transparent",
            border: "none", cursor: "pointer", color: "rgba(240,240,245,0.7)", fontSize: "14px",
          }}
        >
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <NewsIcon size={18} />
          </span>
          {!collapsed && <span>חדשות</span>}
        </button>
      </div>

      {/* News full-screen overlay — rendered via portal to body */}
      {showNews && typeof document !== "undefined" && createPortal(
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNews(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <style>{`
            @keyframes newsSlideIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%", maxWidth: "700px", maxHeight: "85vh",
              background: "rgba(10,10,26,0.97)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px", padding: "40px 48px",
              position: "relative", overflow: "hidden",
              boxShadow: "0 32px 100px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,255,0.08)",
              animation: "newsSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <button
              onClick={() => setShowNews(false)}
              style={{
                position: "absolute", top: "16px", left: "16px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "50%", width: "36px", height: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(240,240,245,0.7)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              <CloseIcon size={16} />
            </button>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>
                <NewsIcon size={32} color="rgba(240,240,245,0.3)" />
              </span>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#f0f0f5" }}>
                מה חדש?
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginTop: "4px" }}>
                עדכונים אחרונים מהקהילה
              </p>
            </div>
            <MorphingCardStack cards={newsCards} />
          </div>
        </div>,
        document.body
      )}

      {/* Notifications bell */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: "12px", width: "100%", padding: collapsed ? "10px" : "10px 12px",
            borderRadius: "4px", background: showNotifications ? "rgba(0,0,255,0.12)" : "transparent",
            border: "none", cursor: "pointer", color: "rgba(240,240,245,0.7)", fontSize: "14px",
            position: "relative",
          }}
        >
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", position: "relative" }}>
            <BellDotIcon size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4, width: 16, height: 16,
                borderRadius: "50%", background: "#FF3D00", color: "white",
                fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</span>
            )}
          </span>
          {!collapsed && <span>התראות</span>}
        </button>

        {/* Notifications popup */}
        {showNotifications && (
          <>
            <style>{`
              @keyframes notifSlideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div onClick={() => setShowNotifications(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
            <div
              onMouseLeave={() => {
                notifLeaveTimerRef.current = setTimeout(() => setShowNotifications(false), 500);
              }}
              onMouseEnter={() => {
                if (notifLeaveTimerRef.current) { clearTimeout(notifLeaveTimerRef.current); notifLeaveTimerRef.current = null; }
              }}
              style={{
              position: "fixed", bottom: "80px", right: `${width + 16}px`,
              width: "320px", maxHeight: "400px", overflowY: "auto",
              background: "rgba(14,14,32,0.95)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
              padding: "0", zIndex: 99, boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              animation: "notifSlideIn 0.25s ease-out",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f5" }}>התראות</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#7777FF", fontSize: "12px", cursor: "pointer" }}>
                    סמן הכל כנקרא
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(240,240,245,0.7)", fontSize: "13px" }}>
                  אין התראות
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      // Navigate based on notification type
                      const link = n.link || (
                        n.type === "qa" ? "/admin/qa" :
                        n.type === "feedback" ? "/admin/feedback" :
                        n.type === "case_study" ? "/admin/case-studies" :
                        n.type === "user" ? "/admin/users" :
                        n.type === "course" ? "/admin/courses" :
                        null
                      );
                      if (link) {
                        setShowNotifications(false);
                        router.push(link);
                      }
                    }}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: n.read ? "transparent" : "rgba(0,0,255,0.04)",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0000FF", flexShrink: 0, marginTop: 5 }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", color: n.read ? "rgba(240,240,245,0.5)" : "#f0f0f5", lineHeight: 1.4 }}>{n.text}</p>
                        <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)", marginTop: "4px" }}>{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Logout + Collapse */}
      <div style={{ padding: "8px", paddingBottom: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <button
          id="logout-btn"
          onClick={async () => {
            setLoggingOut(true);
            // Clear all user-specific localStorage data
            const userKeys = [
              "bldr_profile_cache", "bldr_user_profile", "bldr_tourist",
              "bldr_active_school", "bldr_notes", "bldr_completed_lessons",
              "bldr_prompt_logs", "bldr_notifications", "bldr_trial",
              "bldr_user_settings", "bldr_login_count", "bldr_feedback",
              "bldr_questionnaire_done",
            ];
            userKeys.forEach((k) => localStorage.removeItem(k));
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.replace("/login");
          }}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10,
            width: "100%", height: "40px", padding: collapsed ? 0 : "0 12px",
            borderRadius: "4px", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)", color: "#ff6b6b", cursor: "pointer", fontSize: "13px",
            fontWeight: 600, transition: "background 0.2s",
          }}
          title="התנתק"
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,59,48,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,59,48,0.08)"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && "התנתק"}
        </button>
        {collapsed && (
          <button onClick={toggleCollapse} style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "36px",
            borderRadius: "4px", background: "none", border: "none", color: "rgba(240,240,245,0.7)", cursor: "pointer", fontSize: "16px",
          }}>
            <ChevronLeftIcon size={16} />
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
