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
} from "@/components/ui/icons";

const mainNav = [
  { label: "דשבורד", href: "/dashboard", icon: CoursesIcon },
  { label: "מחברת", href: "/notebook", icon: NotebookIcon },
  { label: "לוח שנה", href: "/calendar", icon: CalendarIcon },
  { label: "תכנים נוספים", href: "/social", icon: SocialIcon },
  { label: "שאלות", href: "/qa", icon: QuestionIcon },
  { label: "צ׳אט", href: "/chat", icon: ChatIcon },
  { label: "פרופיל", href: "/profile", icon: ProfileIcon },
  { label: "התראות", href: "/notifications", icon: BellDotIcon },
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

export function Sidebar({ collapsed: collapsedProp, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = collapsedProp ?? internalCollapsed;
  const toggleCollapse = onToggle ?? (() => setInternalCollapsed(!internalCollapsed));
  const width = collapsed ? 68 : 240;

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
