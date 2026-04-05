"use client";

import React from "react";
import Link from "next/link";
import { SettingsIcon, GraduationIcon, ImportIcon, LinkIcon, FeedbackIcon, UsersIcon, LightbulbIcon, BrainIcon, TerminalIcon, BeakerIcon, QuestionIcon } from "@/components/ui/icons";

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
  "/admin/qa": <QuestionIcon size={28} />,
  "/admin/media": <ImportIcon size={28} />,
  "/admin/migrate": <ImportIcon size={28} />,
  "/admin/webhooks": <LinkIcon size={28} />,
  "/admin/onboarding": <UsersIcon size={28} />,
  "/admin/content-ideas": <LightbulbIcon size={28} />,
  "/admin/subscribers": <UsersIcon size={28} />,
  "/admin/tasks": <LightbulbIcon size={28} />,
  "/admin/email-templates": <LinkIcon size={28} />,
  "/admin/entry-video": <ImportIcon size={28} />,
  "/admin/flogin": <UsersIcon size={28} />,
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
  {
    title: "ניהול שאלות",
    description: "ניהול שאלות מהפורום, מענה לתלמידים והעברת שאלות לבסיס הידע",
    href: "/admin/qa",
  },
  {
    title: "ספריית מדיה",
    description: "ניהול תמונות ממוזערות, העלאה וארגון תמונות לקורסים",
    href: "/admin/media",
  },
  {
    title: "ייצוא וייבוא",
    description: "העבר מידע בין המערכת המקומית לאתר החי — קורסים, הגדרות ותמונות",
    href: "/admin/migrate",
  },
  {
    title: "וובהוקים",
    description: "ניהול וובהוקים לשליחת התראות אוטומטיות לכלים חיצוניים כמו Slack ו-Make",
    href: "/admin/webhooks",
  },
  {
    title: "אונבורדינג",
    description: "ניהול סיור המערכת למשתמשים חדשים — שלבים, אודיו וטקסט",
    href: "/admin/onboarding",
  },
  {
    title: "רעיונות לתכנים",
    description: "ניהול רעיונות לתכנים — כותרות, תיאורים ונושאים לקורסים ופוסטים",
    href: "/admin/content-ideas",
  },
  {
    title: "משימות",
    description: "ניהול משימות לביצוע — הוספה, מעקב ואישור ביצוע",
    href: "/admin/tasks",
  },
  {
    title: "תבניות אימייל",
    description: "עיצוב מיילים ממותגים עם משתנים דינמיים — ברוכים הבאים, איפוס סיסמה, עדכונים ועוד",
    href: "/admin/email-templates",
  },
  {
    title: "וידאו כניסה",
    description: "וידאו שקופץ אחרי התחברות — עדכונים, הודעות חשובות או ברכת פתיחה מ-Vimeo",
    href: "/admin/entry-video",
  },
  {
    title: "הרשמה חופשית",
    description: "ניהול עמוד הרשמה חופשית עם גישה מוגבלת בזמן — הפעלה, כיבוי ומשך גישה",
    href: "/admin/flogin",
  },
];

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
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
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "32px", fontSize: "14px" }}>
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
            <span style={{ display: "block", marginBottom: "12px", color: "rgba(240,240,245,0.7)" }}>{iconMap[s.href]}</span>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
              {s.title}
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>
              {s.description}
            </p>
          </Link>
        ))}
      </div>

      {/* API Documentation */}
      <div style={{ marginTop: "48px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
          תיעוד API
        </h2>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f5", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#00C853", fontFamily: "var(--font-heading-en)", fontSize: "12px", background: "rgba(0,200,83,0.1)", padding: "2px 8px", borderRadius: "4px" }}>POST</span>
            <span style={{ fontFamily: "var(--font-heading-en)" }}>/api/news</span>
            <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", fontWeight: 400 }}>— הוספת חדשות</span>
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "12px", lineHeight: 1.6 }}>
            סוכן יכול לשלוח עדכוני חדשות למערכת. המערכת שומרת עד 10 עדכונים אחרונים.
          </p>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "4px", padding: "16px", fontFamily: "var(--font-heading-en)", fontSize: "12px", color: "rgba(240,240,245,0.7)", lineHeight: 1.8, overflowX: "auto", direction: "ltr", textAlign: "left" }}>
            <div style={{ color: "rgba(240,240,245,0.7)" }}>{"// שליחת עדכון בודד"}</div>
            <div><span style={{ color: "#00C853" }}>POST</span> /api/news</div>
            <div style={{ color: "#FFB300" }}>{"{"}</div>
            <div>&nbsp;&nbsp;<span style={{ color: "#3333FF" }}>&quot;title&quot;</span>: <span style={{ color: "#00C853" }}>&quot;כותרת העדכון&quot;</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: "#3333FF" }}>&quot;description&quot;</span>: <span style={{ color: "#00C853" }}>&quot;תיאור מפורט של העדכון&quot;</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: "#3333FF" }}>&quot;icon&quot;</span>: <span style={{ color: "#00C853" }}>&quot;sparkles&quot;</span>, <span style={{ color: "rgba(240,240,245,0.7)" }}>// sparkles | book | rocket | layers | calendar</span></div>
            <div>&nbsp;&nbsp;<span style={{ color: "#3333FF" }}>&quot;url&quot;</span>: <span style={{ color: "#00C853" }}>&quot;https://...&quot;</span> <span style={{ color: "rgba(240,240,245,0.7)" }}>// אופציונלי — קישור חיצוני</span></div>
            <div style={{ color: "#FFB300" }}>{"}"}</div>
            <div style={{ marginTop: "12px", color: "rgba(240,240,245,0.7)" }}>{"// שליחת מספר עדכונים בבת אחת"}</div>
            <div><span style={{ color: "#00C853" }}>POST</span> /api/news</div>
            <div style={{ color: "#FFB300" }}>{"["}</div>
            <div>&nbsp;&nbsp;{"{ "}<span style={{ color: "#3333FF" }}>&quot;title&quot;</span>: ..., <span style={{ color: "#3333FF" }}>&quot;description&quot;</span>: ... {"}"},</div>
            <div>&nbsp;&nbsp;{"{ "}<span style={{ color: "#3333FF" }}>&quot;title&quot;</span>: ..., <span style={{ color: "#3333FF" }}>&quot;description&quot;</span>: ... {"}"}</div>
            <div style={{ color: "#FFB300" }}>{"]"}</div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#3333FF", fontFamily: "var(--font-heading-en)", fontSize: "12px", background: "rgba(0,0,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>GET</span>
              <span style={{ fontFamily: "var(--font-heading-en)" }}>/api/news</span>
              <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", fontWeight: 400 }}>— קריאת חדשות</span>
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.6 }}>
              מחזיר את 10 העדכונים האחרונים.
            </p>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#FF3D00", fontFamily: "var(--font-heading-en)", fontSize: "12px", background: "rgba(255,61,0,0.1)", padding: "2px 8px", borderRadius: "4px" }}>DELETE</span>
              <span style={{ fontFamily: "var(--font-heading-en)" }}>/api/news?id=xxx</span>
              <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", fontWeight: 400 }}>— מחיקת עדכון</span>
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
