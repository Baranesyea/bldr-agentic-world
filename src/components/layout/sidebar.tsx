"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/icons";
import { Sparkles, BookOpen, Rocket, Layers, Calendar } from "lucide-react";
import { MorphingCardStack, type CardData } from "@/components/ui/morphing-card-stack";

const mainNav = [
  { label: "לימודים", href: "/dashboard", icon: CoursesIcon },
  { label: "מחברת", href: "/notebook", icon: NotebookIcon },
  { label: "לוח שנה", href: "/calendar", icon: CalendarIcon },
  { label: "מקרי בוחן", href: "/case-studies", icon: BeakerIcon },
  { label: "תכנים נוספים", href: "/social", icon: SocialIcon },
  { label: "שאלות", href: "/qa", icon: QuestionIcon },
  { label: "צ׳אט", href: "/chat", icon: ChatIcon },
  { label: "פרופיל", href: "/profile", icon: ProfileIcon },
];

const adminNav = [
  { label: "ניהול", href: "/admin", icon: SettingsIcon },
  { label: "ניהול קורסים", href: "/admin/courses", icon: GraduationIcon },
  { label: "קישורי פרומו", href: "/admin/promo-links", icon: LinkIcon },
  { label: "ייבוא קורס", href: "/admin/import-course", icon: ImportIcon },
  { label: "פידבקים", href: "/admin/feedback", icon: FeedbackIcon },
  { label: "משתמשים", href: "/admin/users", icon: UsersIcon },
  { label: "רעיונות", href: "/admin/ideas", icon: LightbulbIcon },
  { label: "בסיס ידע", href: "/admin/knowledge", icon: BrainIcon },
  { label: "לוג פרומפטים", href: "/admin/logs", icon: TerminalIcon },
  { label: "מקרי בוחן", href: "/admin/case-studies", icon: BeakerIcon },
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
}

export function Sidebar({ collapsed: collapsedProp, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = collapsedProp ?? internalCollapsed;
  const toggleCollapse = onToggle ?? (() => setInternalCollapsed(!internalCollapsed));
  const width = collapsed ? 68 : 240;
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNews, setShowNews] = useState(false);
  const [newsCards, setNewsCards] = useState<CardData[]>([]);

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
          const cards: CardData[] = data.map((n: { id: string; title: string; description: string; icon?: string }) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            icon: n.icon ? iconMap[n.icon] : undefined,
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

  const NavLink = ({ item }: { item: { label: string; href: string; icon: React.ComponentType<{ size?: number; color?: string }> } }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link href={item.href} style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: collapsed ? "10px" : "10px 12px", borderRadius: "12px",
        textDecoration: "none", fontSize: "14px",
        justifyContent: collapsed ? "center" : "flex-start",
        fontWeight: active ? 700 : 400,
        color: active ? "#fff" : "rgba(240,240,245,0.6)",
        background: active ? "rgba(0,0,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(0,0,255,0.25)" : "1px solid transparent",
        boxShadow: active ? "0 0 20px rgba(0,0,255,0.1)" : "none",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><Icon size={18} /></span>
        {!collapsed && <span style={{ opacity: 1, transition: "opacity 0.2s" }}>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside style={{
      height: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,26,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: collapsed ? "64px" : "100px", padding: collapsed ? "0 12px" : "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "height 0.3s, padding 0.3s" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/logo.png" alt="BLDR" width={collapsed ? 36 : 160} height={collapsed ? 36 : 60} style={{ objectFit: "contain", transition: "all 0.3s" }} />
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <div style={{ margin: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
        {adminNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* News button */}
      <div style={{ padding: "4px 8px 0", position: "relative" }}>
        <button
          onClick={() => setShowNews(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: "12px", width: "100%", padding: collapsed ? "10px" : "10px 12px",
            borderRadius: "12px", background: "transparent",
            border: "none", cursor: "pointer", color: "rgba(240,240,245,0.6)", fontSize: "14px",
          }}
        >
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <NewsIcon size={18} />
          </span>
          {!collapsed && <span>חדשות</span>}
        </button>
      </div>

      {/* News full-screen overlay */}
      {showNews && (
        <div
          onClick={() => setShowNews(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "600px", maxHeight: "80vh",
              background: "rgba(14,14,32,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px", padding: "32px",
              position: "relative", overflowY: "auto",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <button
              onClick={() => setShowNews(false)}
              style={{
                position: "absolute", top: "16px", left: "16px",
                background: "rgba(255,255,255,0.06)", border: "none",
                borderRadius: "50%", width: "36px", height: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(240,240,245,0.6)",
              }}
            >
              <CloseIcon size={16} />
            </button>
            <h2 style={{
              fontSize: "28px", fontWeight: 800, color: "#f0f0f5",
              textAlign: "center", marginBottom: "24px",
            }}>
              מה חדש?
            </h2>
            <MorphingCardStack cards={newsCards} defaultLayout="list" />
          </div>
        </div>
      )}

      {/* Notifications bell */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: "12px", width: "100%", padding: collapsed ? "10px" : "10px 12px",
            borderRadius: "12px", background: showNotifications ? "rgba(0,0,255,0.12)" : "transparent",
            border: "none", cursor: "pointer", color: "rgba(240,240,245,0.6)", fontSize: "14px",
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
            <div onClick={() => setShowNotifications(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
            <div style={{
              position: "absolute", bottom: "100%", right: collapsed ? "-280px" : "0",
              width: "320px", maxHeight: "400px", overflowY: "auto",
              background: "rgba(14,14,32,0.95)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px",
              padding: "0", zIndex: 99, boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              marginBottom: "8px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f5" }}>התראות</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#3333FF", fontSize: "12px", cursor: "pointer" }}>
                    סמן הכל כנקרא
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(240,240,245,0.3)", fontSize: "13px" }}>
                  אין התראות
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
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
                        <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.25)", marginTop: "4px" }}>{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={toggleCollapse} style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "36px",
          borderRadius: "12px", background: "none", border: "none", color: "rgba(240,240,245,0.35)", cursor: "pointer", fontSize: "16px",
        }}>
          {collapsed ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
        </button>
      </div>
    </aside>
  );
}
