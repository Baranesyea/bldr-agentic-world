"use client";

import React from "react";
import Link from "next/link";
import { SettingsIcon, GraduationIcon, ImportIcon, LinkIcon, FeedbackIcon, UsersIcon, LightbulbIcon, BrainIcon, TerminalIcon, BeakerIcon } from "@/components/ui/icons";

const iconMap: Record<string, React.ReactNode> = {
  "/admin/settings": <SettingsIcon size={28} />,
  "/admin/courses": <GraduationIcon size={28} />,
  "/admin/import-course": <ImportIcon size={28} />,
  "/admin/promo-links": <LinkIcon size={28} />,
  "/admin/feedback": <FeedbackIcon size={28} />,
  "/admin/users": <UsersIcon size={28} />,
  "/admin/ideas": <LightbulbIcon size={28} />,
  "/admin/knowledge": <BrainIcon size={28} />,
  "/admin/logs": <TerminalIcon size={28} />,
  "/admin/case-studies": <BeakerIcon size={28} />,
};

const sections = [
  {
    title: "הגדרות",
    description: "מפתחות API, צבעי מותג, לוגו, גרדיאנט ומחולל תמונות ממוזערות",
    href: "/admin/settings",
  },
  {
    title: "ניהול קורסים",
    description: "צור, ערוך, שכפל ונהל את כל הקורסים שלך עם פרקים ושיעורים",
    href: "/admin/courses",
  },
  {
    title: "ייבוא קורס",
    description: "העלה קובץ אקסל או CSV ליצירת קורס מלא עם פרקים ושיעורים",
    href: "/admin/import-course",
  },
  {
    title: "קישורי פרומו",
    description: "צור קישורי הזמנה לתקופת ניסיון עם משך מותאם אישית למשתמשים חדשים",
    href: "/admin/promo-links",
  },
  {
    title: "פידבקים",
    description: "צפה בפידבקים שהתקבלו מהמשתמשים, סנן לפי קטגוריה וסטטוס",
    href: "/admin/feedback",
  },
  {
    title: "משתמשים",
    description: "ניהול משתמשים, מעקב התקדמות, צפייה בסטטיסטיקות ופעילות",
    href: "/admin/users",
  },
  {
    title: "רעיונות לפיתוח",
    description: "ניהול רעיונות ודרישות פיתוח, מעקב סטטוס ותעדוף",
    href: "/admin/ideas",
  },
  {
    title: "בסיס ידע",
    description: "המוח של המערכת — שאלות, תשובות ומידע לניהול הידע הפנימי",
    href: "/admin/knowledge",
  },
  {
    title: "לוג פרומפטים",
    description: "מעקב אחר כל הפרומפטים שיצאו מהמערכת, סטטוס ותשובות מה-API",
    href: "/admin/logs",
  },
  {
    title: "מקרי בוחן",
    description: "ניהול בקשות למקרי בוחן, צפייה בסטטוס ומעקב אחר פניות",
    href: "/admin/case-studies",
  },
];

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "28px",
  textDecoration: "none",
  display: "block",
  transition: "border-color 0.2s, box-shadow 0.2s",
  cursor: "pointer",
};

export default function AdminPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
        ניהול
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "32px", fontSize: "14px" }}>
        ניהול והגדרת הפלטפורמה.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={CARD}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(0,0,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ display: "block", marginBottom: "12px", color: "rgba(240,240,245,0.6)" }}>{iconMap[s.href]}</span>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
              {s.title}
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", lineHeight: 1.5 }}>
              {s.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
