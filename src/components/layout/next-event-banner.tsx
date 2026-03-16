"use client";

import React, { useState, useEffect, useRef } from "react";
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
  let description = event.description || "";
  if (event.link) description += `\\nLink: ${event.link}`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BLDR//Agentic World//EN",
    "BEGIN:VEVENT", `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`, `DESCRIPTION:${description}`,
    event.link ? `URL:${event.link}` : "", "END:VEVENT", "END:VCALENDAR",
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
  const [menuPos, setMenuPos] = useState<{ x: number } | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    setMenuPos({ x: mouseX });
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setHovered(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // Open menu on hover
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    setMenuPos({ x: mouseX });
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    hideTimer.current = setTimeout(() => setShowMenu(false), 1500);
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

  // Calculate menu left position relative to container
  const menuLeft = menuPos ? Math.max(20, Math.min(menuPos.x, 280)) : "50%";
  const menuTransform = menuPos ? "translateX(-50%)" : "translateX(-50%)";

  return (
    <>
      <style>{`
        @keyframes tooltipPop {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); }
          60% { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1.03); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
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
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          overflow: "visible",
          borderRadius: hovered ? 14 : 12,
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
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "50%", zIndex: 3,
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
            borderRadius: "inherit",
          }} />

          {/* X dismiss — bright background, dark X */}
          {hovered && (
            <button
              onClick={handleDismiss}
              style={{
                position: "absolute", top: -8, left: -8, zIndex: 40,
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
                border: "none",
                color: "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0, lineHeight: 1,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              ×
            </button>
          )}

          {/* Calendar icon */}
          <span style={{
            position: "relative", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 4,
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

        {/* Calendar menu popup — follows cursor X position */}
        {showMenu && (
          <div
            onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
            onMouseLeave={() => { hideTimer.current = setTimeout(() => setShowMenu(false), 1500); }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: typeof menuLeft === "number" ? menuLeft : menuLeft,
              transform: "translateX(-50%)",
              overflow: "hidden",
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
              minWidth: 200,
              animation: "tooltipPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              transition: "left 0.15s ease-out",
            }}
          >
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
                {
                  label: "Apple Calendar",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  onClick: handleDownloadICS,
                },
                {
                  label: "Google Calendar",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  onClick: handleGoogleCalendar,
                },
                {
                  label: "הורד קובץ .ics",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  ),
                  onClick: handleDownloadICS,
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 14px",
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", borderRadius: 4,
                    textAlign: "right", direction: "rtl",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ display: "flex", color: "rgba(255,255,255,0.6)" }}>{item.icon}</span>
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
