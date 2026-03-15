"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const mainNav = [
  { label: "דשבורד", href: "/dashboard", icon: "📊" },
  { label: "קורסים", href: "/courses", icon: "📚" },
  { label: "מחברת", href: "/notebook", icon: "📝" },
  { label: "לוח שנה", href: "/calendar", icon: "📅" },
  { label: "שאלות", href: "/qa", icon: "❓" },
  { label: "צ׳אט", href: "/chat", icon: "💬" },
  { label: "פרופיל", href: "/profile", icon: "👤" },
];

const adminNav = [
  { label: "ניהול", href: "/admin", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 68 : 240;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <aside style={{
      position: "fixed",
      top: 0,
      right: 0,
      zIndex: 40,
      height: "100vh",
      width: width + "px",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,26,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      transition: "width 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", height: "64px", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard">
          <Image src="/logo.png" alt="BLDR" width={collapsed ? 36 : 100} height={collapsed ? 36 : 40} style={{ objectFit: "contain" }} />
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              fontWeight: active ? 700 : 400,
              color: active ? "#fff" : "rgba(240,240,245,0.6)",
              background: active ? "rgba(0,0,255,0.12)" : "transparent",
              border: active ? "1px solid rgba(0,0,255,0.25)" : "1px solid transparent",
              boxShadow: active ? "0 0 20px rgba(0,0,255,0.1)" : "none",
            }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <div style={{ margin: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
        {adminNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              fontWeight: active ? 700 : 400,
              color: active ? "#fff" : "rgba(240,240,245,0.6)",
              background: active ? "rgba(0,0,255,0.12)" : "transparent",
              border: active ? "1px solid rgba(0,0,255,0.25)" : "1px solid transparent",
              boxShadow: active ? "0 0 20px rgba(0,0,255,0.1)" : "none",
            }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "36px",
          borderRadius: "12px", background: "none", border: "none", color: "rgba(240,240,245,0.35)", cursor: "pointer", fontSize: "16px",
        }}>
          {collapsed ? "‹" : "›"}
        </button>
      </div>
    </aside>
  );
}
