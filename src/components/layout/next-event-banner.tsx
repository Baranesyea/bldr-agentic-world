"use client";

import React from "react";
import { CalendarIcon } from "@/components/ui/icons";

interface NextEventBannerProps {
  event?: { title: string; date: string; time: string; hasRsvped?: boolean } | null;
}

export function NextEventBanner({ event }: NextEventBannerProps) {
  if (!event) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(10,10,26,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ display: "flex", alignItems: "center" }}><CalendarIcon size={20} /></span>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f5" }}>האירוע הבא: {event.title}</p>
          <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>{event.date} — {event.time}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {!event.hasRsvped && (
          <button style={{ background: "#0000FF", color: "white", padding: "8px 16px", borderRadius: "10px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>אישור הגעה</button>
        )}
        <button style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f5", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer" }}>הוסף ליומן</button>
      </div>
    </div>
  );
}
