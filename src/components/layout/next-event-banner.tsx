"use client";

import React, { useState, useEffect } from "react";
import { CalendarIcon } from "@/components/ui/icons";

interface NextEventBannerProps {
  event?: { title: string; date: string; time: string; description?: string; link?: string } | null;
}

export function NextEventBanner({ event }: NextEventBannerProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden until we check
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

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

  const handleAddToCalendar = () => {
    if (added) return;

    try {
      const events = JSON.parse(localStorage.getItem("bldr_events") || "[]");
      // Check if already added
      const alreadyExists = events.some((ev: { title: string }) => ev.title === event.title);
      if (!alreadyExists) {
        events.push({
          id: `event-${Date.now()}`,
          title: event.title,
          description: event.description || "",
          type: "live",
          date: event.date,
          time: event.time,
          link: event.link || "",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("bldr_events", JSON.stringify(events));
      }
      setAdded(true);
      setTimeout(() => {
        sessionStorage.setItem("bldr_event_dismissed", "true");
        setDismissed(true);
      }, 1500);
    } catch {}
  };

  return (
    <div
      onClick={handleAddToCalendar}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        background: hovered ? "rgba(15,15,35,0.95)" : "rgba(10,10,26,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "14px 24px 14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        boxShadow: hovered
          ? "0 8px 40px rgba(0,0,255,0.15), 0 4px 20px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.4)",
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
      }}
    >
      {/* X button — only on hover */}
      {hovered && (
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(240,240,245,0.5)",
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      {/* Calendar icon */}
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 10,
        background: added ? "rgba(0,200,83,0.12)" : "rgba(0,0,255,0.1)",
        color: added ? "#00C853" : "#3333FF",
        flexShrink: 0,
        transition: "all 0.3s",
      }}>
        {added ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <CalendarIcon size={18} />
        )}
      </span>

      {/* Event info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {added ? (
          <span style={{ fontSize: 14, fontWeight: 600, color: "#00C853" }}>נוסף ליומן!</span>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5" }}>
              האירוע הבא: {event.title}
            </span>
            <span style={{ fontSize: 11, color: "rgba(240,240,245,0.4)" }}>
              {event.date} — {event.time} · לחץ להוספה ליומן
            </span>
          </>
        )}
      </div>
    </div>
  );
}
