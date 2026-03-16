"use client";

import React, { useState, useEffect } from "react";
import { CalendarIcon } from "@/components/ui/icons";

interface NextEventBannerProps {
  event?: {
    title: string;
    date: string;
    time: string;
    description?: string;
    link?: string;
    durationMinutes?: number;
  } | null;
}

function generateICS(event: NonNullable<NextEventBannerProps["event"]>): string {
  // Parse Hebrew date like "יום שלישי, 18 מרץ" + time "19:00"
  const now = new Date();
  const year = now.getFullYear();

  const hebrewMonths: Record<string, number> = {
    "ינואר": 0, "פברואר": 1, "מרץ": 2, "אפריל": 3, "מאי": 4, "יוני": 5,
    "יולי": 6, "אוגוסט": 7, "ספטמבר": 8, "אוקטובר": 9, "נובמבר": 10, "דצמבר": 11,
  };

  let month = now.getMonth();
  let day = now.getDate();

  // Try to extract day number and month name
  const dayMatch = event.date.match(/(\d+)/);
  if (dayMatch) day = parseInt(dayMatch[1]);

  for (const [name, idx] of Object.entries(hebrewMonths)) {
    if (event.date.includes(name)) { month = idx; break; }
  }

  const [hours, minutes] = (event.time || "19:00").split(":").map(Number);
  const duration = event.durationMinutes || 60;

  const start = new Date(year, month, day, hours, minutes);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  let description = event.description || "";
  if (event.link) description += `\\nLink: ${event.link}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BLDR//Agentic World//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}`,
    event.link ? `URL:${event.link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function openGoogleCalendar(event: NonNullable<NextEventBannerProps["event"]>) {
  const now = new Date();
  const year = now.getFullYear();
  const hebrewMonths: Record<string, number> = {
    "ינואר": 0, "פברואר": 1, "מרץ": 2, "אפריל": 3, "מאי": 4, "יוני": 5,
    "יולי": 6, "אוגוסט": 7, "ספטמבר": 8, "אוקטובר": 9, "נובמבר": 10, "דצמבר": 11,
  };
  let month = now.getMonth();
  let day = now.getDate();
  const dayMatch = event.date.match(/(\d+)/);
  if (dayMatch) day = parseInt(dayMatch[1]);
  for (const [name, idx] of Object.entries(hebrewMonths)) {
    if (event.date.includes(name)) { month = idx; break; }
  }
  const [hours, minutes] = (event.time || "19:00").split(":").map(Number);
  const duration = event.durationMinutes || 60;
  const start = new Date(year, month, day, hours, minutes);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || "")}`;
  window.open(url, "_blank");
}

export function NextEventBanner({ event }: NextEventBannerProps) {
  const [dismissed, setDismissed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("bldr_event_dismissed");
    setDismissed(wasDismissed === "true");
  }, []);

  if (!event || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("bldr_event_dismissed", "true");
    setDismissed(true);
  };

  const handleDownloadICS = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    openGoogleCalendar(event);
    setShowMenu(false);
  };

  return (
    <>
      {/* SVG Glass Filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="glass-distortion-banner" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting in="softMap" surfaceScale="3" specularConstant="0.8" specularExponent="80" lightingColor="white" result="specLight">
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="60" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          cursor: "pointer",
          transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        }}
      >
        {/* Liquid Glass Container */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: hovered ? 22 : 18,
          padding: hovered ? "16px 28px 16px 22px" : "14px 24px 14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          whiteSpace: "nowrap",
          transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          boxShadow: hovered
            ? "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)"
            : "0 4px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
          {/* Glass layers */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            borderRadius: "inherit",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.12) 100%)",
            borderRadius: "inherit",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 2,
            borderRadius: "inherit",
            boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.35), inset -1px -1px 0 rgba(255,255,255,0.15)",
          }} />
          {/* Specular highlight */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "50%", zIndex: 3,
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
            borderRadius: "inherit",
          }} />

          {/* X dismiss */}
          {hovered && (
            <button
              onClick={handleDismiss}
              style={{
                position: "absolute", top: -6, left: -6, zIndex: 40,
                width: 18, height: 18, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)", fontSize: 10,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
          )}

          {/* Calendar icon */}
          <span style={{
            position: "relative", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.9)",
            flexShrink: 0,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <CalendarIcon size={16} />
          </span>

          {/* Event info */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              האירוע הבא: {event.title}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              {event.date} — {event.time} · לחץ להוספה ליומן
            </span>
          </div>
        </div>

        {/* Calendar menu popup */}
        {showMenu && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            overflow: "hidden", borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
            minWidth: 200,
          }}>
            {/* Glass background */}
            <div style={{
              position: "absolute", inset: 0,
              backdropFilter: "blur(40px) saturate(1.8)",
              WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              borderRadius: "inherit",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)",
              borderRadius: "inherit",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "inherit",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(255,255,255,0.1)",
            }} />

            <div style={{ position: "relative", zIndex: 10, padding: 6 }}>
              {[
                { label: "Apple Calendar", icon: "🍎", onClick: handleDownloadICS },
                { label: "Google Calendar", icon: "📅", onClick: handleGoogleCalendar },
                { label: "הורד קובץ .ics", icon: "📥", onClick: handleDownloadICS },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 14px",
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", borderRadius: 8,
                    textAlign: "right", direction: "rtl",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
