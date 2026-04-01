"use client";

import React, { useState } from "react";
import { CalendarIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@/components/ui/icons";
import { PricingPopup } from "@/components/ui/pricing-popup";
import { getTouristData } from "@/hooks/useUser";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: "live_lesson" | "office_hours" | "deadline" | "community" | "other";
  description?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

type EventType = CalendarEvent["type"];

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  live_lesson: "#0000FF",
  office_hours: "#7B2FFF",
  deadline: "#FF3D00",
  community: "#00C853",
  other: "#FFB300",
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  live_lesson: "שיעור חי",
  office_hours: "Office Hours",
  deadline: "דדליין",
  community: "אירוע קהילה",
  other: "אחר",
};

const HEBREW_DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const HEBREW_MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayStr(): string {
  const t = new Date();
  return formatDate(t.getFullYear(), t.getMonth(), t.getDate());
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
}

export default function CalendarClient({ initialEvents }: CalendarClientProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [prefillDate, setPrefillDate] = useState<string>("");
  const [showPricing, setShowPricing] = useState(false);
  const isTourist = typeof window !== "undefined" ? !!getTouristData() : false;

  // No-op placeholder removed — CRUD now goes through API calls below

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(t);
  };

  const navigatePrev = () => {
    if (viewMode === "month") {
      prevMonth();
    } else if (viewMode === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      nextMonth();
    } else if (viewMode === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  };

  const navigateToDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setSelectedDate(new Date(y, m - 1, d));
  };

  // Upcoming events (next 10 from today)
  const upcomingEvents = [...events]
    .filter(e => {
      const eventDate = e.date + "T" + e.startTime;
      const nowStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate()) + "T" + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      return eventDate >= nowStr;
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 10);

  // Week view helpers
  const getWeekDays = (): { day: number; month: number; year: number; dateStr: string }[] => {
    const d = new Date(selectedDate);
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const days: { day: number; month: number; year: number; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(sunday);
      current.setDate(sunday.getDate() + i);
      days.push({
        day: current.getDate(),
        month: current.getMonth(),
        year: current.getFullYear(),
        dateStr: formatDate(current.getFullYear(), current.getMonth(), current.getDate()),
      });
    }
    return days;
  };

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Build grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const prevMonthDays = month === 0 ? getDaysInMonth(year - 1, 11) : getDaysInMonth(year, month - 1);

  const cells: { day: number; currentMonth: boolean; dateStr: string }[] = [];
  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, currentMonth: false, dateStr: formatDate(y, m, d) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, dateStr: formatDate(year, month, d) });
  }
  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, currentMonth: false, dateStr: formatDate(y, m, d) });
  }

  const today = todayStr();

  const eventsForDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  // Modal handlers
  const openAddModal = (date?: string) => {
    setEditingEvent(null);
    setPrefillDate(date || formatDate(year, month, now.getDate()));
    setModalOpen(true);
    setDetailEvent(null);
  };

  const openEditModal = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setPrefillDate("");
    setModalOpen(true);
    setDetailEvent(null);
  };

  const handleSave = async (evt: CalendarEvent) => {
    if (editingEvent) {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evt),
      });
      if (res.ok) {
        const updated = await res.json();
        setEvents(events.map(e => e.id === updated.id ? updated : e));
      }
    } else {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evt),
      });
      if (res.ok) {
        const created = await res.json();
        setEvents([...events, created]);
      }
    }
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = async (id: string) => {
    setDetailEvent(null);
    setModalOpen(false);
    setEditingEvent(null);
    setEvents(events.filter(e => e.id !== id));
    // Fire-and-forget API call
    fetch(`/api/events?id=${id}`, { method: "DELETE" });
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {showPricing && <PricingPopup onClose={() => setShowPricing(false)} />}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CalendarIcon size={24} color="#f0f0f5" />
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>לוח שנה</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => isTourist ? setShowPricing(true) : openAddModal()} style={btnPrimary}>
            <PlusIcon size={16} /> הוסף אירוע
          </button>
        </div>
      </div>

      {/* Month Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={navigateNext} style={navBtn}><ChevronRightIcon size={18} /></button>
          <span style={{ fontSize: "20px", fontWeight: 600, color: "#f0f0f5", minWidth: "180px", textAlign: "center" }}>
            {viewMode === "day"
              ? `${selectedDate.getDate()} ${HEBREW_MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
              : `${HEBREW_MONTH_NAMES[month]} ${year}`}
          </span>
          <button onClick={navigatePrev} style={navBtn}><ChevronLeftIcon size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {viewMode === "month" && (month !== now.getMonth() || year !== now.getFullYear()) && (
            <button onClick={goToday} style={btnSecondary}>היום</button>
          )}
          {(["month", "week", "day"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={viewMode === mode
                ? { ...btnSecondary, background: "#0000FF", color: "white", border: "1px solid #0000FF" }
                : { ...btnSecondary, background: "rgba(255,255,255,0.04)", color: "#f0f0f5", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {mode === "month" ? "חודש" : mode === "week" ? "שבוע" : "יום"}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: sidebar + calendar */}
      <div style={{ display: "flex", gap: "20px", direction: "rtl", alignItems: "stretch" }}>
        {/* Sidebar - upcoming events */}
        <div style={{ width: "240px", flexShrink: 0, paddingTop: 0 }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.9)", marginBottom: "12px", marginTop: 0, padding: "10px 4px", lineHeight: "1", boxSizing: "border-box", textAlign: "center" }}>אירועים קרובים</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {upcomingEvents.length === 0 && (
              <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.85)" }}>אין אירועים קרובים</div>
            )}
            {upcomingEvents.map(evt => (
              <div
                key={evt.id}
                onClick={() => {
                  navigateToDate(evt.date);
                  if (!isTourist) setDetailEvent(evt);
                }}
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                  borderRight: `3px solid ${EVENT_TYPE_COLORS[evt.type]}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
              >
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f5", marginBottom: "4px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{evt.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.85)" }}>
                  {evt.date} · {evt.startTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar area */}
        <div style={{ flex: 1, minWidth: 0, direction: "ltr" }}>
          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", marginBottom: "1px" }}>
                {HEBREW_DAY_NAMES.map(name => (
                  <div key={name} style={{ padding: "10px 4px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.9)" }}>
                    {name}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                {cells.map((cell, i) => {
                  const isToday = cell.dateStr === today;
                  const dayEvents = eventsForDate(cell.dateStr);
                  return (
                    <div
                      key={i}
                      onClick={() => openAddModal(cell.dateStr)}
                      style={{
                        minHeight: "100px",
                        background: "rgba(255,255,255,0.03)",
                        padding: "6px",
                        cursor: "pointer",
                        transition: "background 0.15s",
                        position: "relative",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                        <span style={{
                          width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "50%", fontSize: "13px", fontWeight: isToday ? 700 : 400,
                          color: cell.currentMonth ? (isToday ? "#fff" : "rgba(240,240,245,0.9)") : "rgba(240,240,245,0.7)",
                          background: isToday ? "#0000FF" : "transparent",
                        }}>
                          {cell.day}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {dayEvents.slice(0, 3).map(evt => (
                          <div
                            key={evt.id}
                            onClick={e => { e.stopPropagation(); if (isTourist) { setShowPricing(true); } else { setDetailEvent(evt); } }}
                            style={{
                              fontSize: "11px", padding: "2px 6px", borderRadius: "4px",
                              background: EVENT_TYPE_COLORS[evt.type] + "22",
                              borderRight: `3px solid ${EVENT_TYPE_COLORS[evt.type]}`,
                              color: "rgba(240,240,245,0.85)", overflow: "hidden", whiteSpace: "nowrap",
                              textOverflow: "ellipsis", cursor: "pointer", transition: "background 0.15s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = EVENT_TYPE_COLORS[evt.type] + "44"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = EVENT_TYPE_COLORS[evt.type] + "22"; }}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: "10px", color: "rgba(240,240,245,0.85)", textAlign: "center" }}>+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* WEEK VIEW */}
          {viewMode === "week" && (() => {
            const weekDays = getWeekDays();
            return (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: "1px", marginBottom: "1px" }}>
                  <div />
                  {weekDays.map((wd, i) => {
                    const isToday = wd.dateStr === today;
                    return (
                      <div key={i} style={{ padding: "10px 4px", textAlign: "center" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(240,240,245,0.9)" }}>{HEBREW_DAY_NAMES[i]}</div>
                        <div style={{
                          fontSize: "18px", fontWeight: isToday ? 700 : 400,
                          color: isToday ? "#fff" : "rgba(240,240,245,0.9)",
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: isToday ? "#0000FF" : "transparent",
                          display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: "4px",
                        }}>
                          {wd.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Hour rows */}
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", maxHeight: "600px", overflowY: "auto" }}>
                  {HOURS.map(hour => (
                    <div key={hour} style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: "1px", minHeight: "48px" }}>
                      <div style={{ padding: "4px 8px", fontSize: "12px", color: "rgba(240,240,245,0.85)", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      {weekDays.map((wd, di) => {
                        const hourEvents = eventsForDate(wd.dateStr).filter(evt => {
                          const h = parseInt(evt.startTime.split(":")[0], 10);
                          return h === hour;
                        });
                        return (
                          <div
                            key={di}
                            onClick={() => openAddModal(wd.dateStr)}
                            style={{
                              background: "rgba(255,255,255,0.03)", padding: "2px 4px", cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                          >
                            {hourEvents.map(evt => (
                              <div
                                key={evt.id}
                                onClick={e => { e.stopPropagation(); if (isTourist) { setShowPricing(true); } else { setDetailEvent(evt); } }}
                                style={{
                                  fontSize: "11px", padding: "2px 6px", borderRadius: "4px", marginBottom: "2px",
                                  background: EVENT_TYPE_COLORS[evt.type] + "22",
                                  borderRight: `3px solid ${EVENT_TYPE_COLORS[evt.type]}`,
                                  color: "rgba(240,240,245,0.85)", overflow: "hidden", whiteSpace: "nowrap",
                                  textOverflow: "ellipsis", cursor: "pointer",
                                }}
                              >
                                {evt.startTime} {evt.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* DAY VIEW */}
          {viewMode === "day" && (() => {
            const dayStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const dayOfWeek = selectedDate.getDay();
            return (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px 4px", textAlign: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(240,240,245,0.9)" }}>{HEBREW_DAY_NAMES[dayOfWeek]}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", maxHeight: "600px", overflowY: "auto" }}>
                  {HOURS.map(hour => {
                    const hourEvents = eventsForDate(dayStr).filter(evt => {
                      const h = parseInt(evt.startTime.split(":")[0], 10);
                      return h === hour;
                    });
                    return (
                      <div key={hour} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "1px", minHeight: "48px" }}>
                        <div style={{ padding: "4px 8px", fontSize: "12px", color: "rgba(240,240,245,0.85)", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {String(hour).padStart(2, "0")}:00
                        </div>
                        <div
                          onClick={() => openAddModal(dayStr)}
                          style={{
                            background: "rgba(255,255,255,0.03)", padding: "2px 4px", cursor: "pointer",
                            borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                        >
                          {hourEvents.map(evt => (
                            <div
                              key={evt.id}
                              onClick={e => { e.stopPropagation(); if (isTourist) { setShowPricing(true); } else { setDetailEvent(evt); } }}
                              style={{
                                fontSize: "13px", padding: "4px 8px", borderRadius: "4px", marginBottom: "2px",
                                background: EVENT_TYPE_COLORS[evt.type] + "22",
                                borderRight: `3px solid ${EVENT_TYPE_COLORS[evt.type]}`,
                                color: "rgba(240,240,245,0.85)", cursor: "pointer",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{evt.startTime} - {evt.endTime}</span> {evt.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Detail Panel */}
      {detailEvent && (
        <DetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => openEditModal(detailEvent)}
          onDelete={() => handleDelete(detailEvent.id)}
        />
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          prefillDate={prefillDate}
          onSave={handleSave}
          onDelete={editingEvent ? () => handleDelete(editingEvent.id) : undefined}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({ event, onClose, onEdit, onDelete }: {
  event: { id: string; title: string; date: string; startTime: string; endTime: string; type: "live_lesson" | "office_hours" | "deadline" | "community" | "other"; description?: string };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = EVENT_TYPE_COLORS[event.type];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(16,16,32,0.95)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "4px", padding: "28px", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "12px", color: color, fontWeight: 600 }}>{EVENT_TYPE_LABELS[event.type]}</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", margin: "0 0 12px" }}>{event.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(240,240,245,0.85)", fontSize: "14px", marginBottom: "8px" }}>
          <CalendarIcon size={14} /> {event.date}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(240,240,245,0.85)", fontSize: "14px", marginBottom: "16px" }}>
          <ClockIcon size={14} /> {event.startTime}{event.endTime && event.endTime !== event.startTime ? ` - ${event.endTime}` : ""}
        </div>
        {event.description && (
          <p style={{ color: "rgba(240,240,245,0.85)", fontSize: "14px", marginBottom: "16px", lineHeight: 1.5 }}>{event.description}</p>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-start" }}>
          <button onClick={onEdit} style={btnPrimary}>עריכה</button>
          <button onClick={onDelete} style={{ ...btnSecondary, color: "#FF3D00", borderColor: "rgba(255,61,0,0.3)" }}>מחיקה</button>
          <button onClick={onClose} style={btnSecondary}>סגירה</button>
        </div>
      </div>
    </div>
  );
}

// ─── Event Modal ─────────────────────────────────────────────────────────────

function EventModal({ event, prefillDate, onSave, onDelete, onClose }: {
  event: { id: string; title: string; date: string; startTime: string; endTime: string; type: EventType; description?: string } | null;
  prefillDate: string;
  onSave: (e: { id: string; title: string; date: string; startTime: string; endTime: string; type: EventType; description?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(event?.title || "");
  const [date, setDate] = React.useState(event?.date || prefillDate);
  const [startTime, setStartTime] = React.useState(event?.startTime || "19:00");
  const [endTime, setEndTime] = React.useState(event?.endTime || "20:00");
  const [type, setType] = React.useState<EventType>(event?.type || "other");
  const [description, setDescription] = React.useState(event?.description || "");

  const handleSubmit = () => {
    if (!title.trim() || !date) return;
    onSave({ id: event?.id || "", title: title.trim(), date, startTime, endTime, type, description: description.trim() || undefined });
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(16,16,32,0.95)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "4px", padding: "28px", width: "100%", maxWidth: "460px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", margin: "0 0 24px" }}>
          {event ? "עריכת אירוע" : "הוספת אירוע"}
        </h2>

        <label style={labelStyle}>שם האירוע</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם האירוע" style={inputStyle} />

        <label style={labelStyle}>תאריך</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>שעת התחלה</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>שעת סיום</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>סוג</label>
        <select value={type} onChange={e => setType(e.target.value as EventType)} style={inputStyle}>
          {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
            <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <label style={labelStyle}>תיאור (אופציונלי)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="תיאור האירוע..." style={{ ...inputStyle, resize: "vertical" }} />

        <div style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "flex-start" }}>
          <button onClick={handleSubmit} style={btnPrimary}>שמור</button>
          <button onClick={onClose} style={btnSecondary}>ביטול</button>
          {onDelete && (
            <button onClick={onDelete} style={{ ...btnSecondary, color: "#FF3D00", borderColor: "rgba(255,61,0,0.3)", marginInlineStart: "auto" }}>מחק</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background: "#0000FF",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "8px 20px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const btnSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "rgba(240,240,245,0.8)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  padding: "8px 16px",
  fontSize: "14px",
  cursor: "pointer",
};

const navBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  padding: "6px",
  cursor: "pointer",
  color: "#f0f0f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "rgba(240,240,245,0.85)",
  marginBottom: "6px",
  marginTop: "12px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "4px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "#f0f0f5",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
