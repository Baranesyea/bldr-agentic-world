"use client";

import React from "react";

const events = [
  { id: "1", title: "Office Hours", date: "יום שלישי, 18 מרץ", time: "19:00", type: "live", rsvps: 24, isPast: false },
  { id: "2", title: "Workshop: Building AI Agents", date: "יום חמישי, 20 מרץ", time: "20:00", type: "workshop", rsvps: 18, isPast: false },
  { id: "3", title: "Q&A Session — Claude Code", date: "יום שלישי, 11 מרץ", time: "19:00", type: "qa", rsvps: 32, isPast: true, hasRecording: true },
  { id: "4", title: "Community Meetup", date: "יום חמישי, 6 מרץ", time: "20:00", type: "meetup", rsvps: 45, isPast: true, hasRecording: true },
];

export default function CalendarPage() {
  const upcoming = events.filter((e) => !e.isPast);
  const past = events.filter((e) => e.isPast);

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>📅 לוח שנה</h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "32px", fontSize: "14px" }}>אירועים קרובים והקלטות</p>

      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#3333FF", marginBottom: "16px" }}>קרוב</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {upcoming.map((e) => (
          <div key={e.id} style={{ background: "#0a0a1a", border: "1px solid rgba(0,0,255,0.15)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{e.title}</h3>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>{e.date} · {e.time}</p>
              <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)", marginTop: "4px" }}>{e.rsvps} נרשמו</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ background: "#0000FF", color: "white", padding: "8px 20px", borderRadius: "10px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>אישור הגעה</button>
              <button style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f5", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px", cursor: "pointer" }}>הוסף ליומן</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "rgba(240,240,245,0.35)", marginBottom: "16px" }}>אירועים שעברו</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {past.map((e) => (
          <div key={e.id} style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px" }}>{e.title}</h3>
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>{e.date} · {e.time}</p>
            </div>
            {e.hasRecording && (
              <button style={{ background: "rgba(255,255,255,0.06)", color: "#3333FF", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,255,0.15)", fontSize: "13px", cursor: "pointer" }}>🎥 צפה בהקלטה</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
