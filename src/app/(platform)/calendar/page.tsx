"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CalendarIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@/components/ui/icons";

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

type EventType = CalendarEvent["type"];

// ─── Constants ───────────────────────────────────────────────────────────────

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

const STORAGE_KEY = "bldr_calendar_events";

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: "sample-1", title: "Office Hours", date: "2026-03-17", startTime: "19:00", endTime: "20:00", type: "office_hours" },
  { id: "sample-2", title: "שיעור חי: Claude Code מתקדם", date: "2026-03-20", startTime: "20:00", endTime: "21:30", type: "live_lesson" },
  { id: "sample-3", title: "דדליין הגשת פרויקט", date: "2026-03-25", startTime: "23:59", endTime: "23:59", type: "deadline" },
  { id: "sample-4", title: "מיטאפ קהילתי", date: "2026-03-28", startTime: "18:00", endTime: "20:00", type: "community" },
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

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [prefillDate, setPrefillDate] = useState<string>("");

  // Load events from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw));
      } else {
        setEvents(SAMPLE_EVENTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EVENTS));
      }
    } catch {
      setEvents(SAMPLE_EVENTS);
    }
  }, []);

  const persist = useCallback((evts: CalendarEvent[]) => {
    setEvents(evts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evts));
  }, []);

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

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

  const handleSave = (evt: CalendarEvent) => {
    if (editingEvent) {
      persist(events.map(e => e.id === evt.id ? evt : e));
    } else {
      persist([...events, { ...evt, id: genId() }]);
    }
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    persist(events.filter(e => e.id !== id));
    setModalOpen(false);
    setDetailEvent(null);
    setEditingEvent(null);
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CalendarIcon size={24} color="#f0f0f5" />
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>לוח שנה</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => openAddModal()} style={btnPrimary}>
            <PlusIcon size={16} /> הוסף אירוע
          </button>
        </div>
      </div>

      {/* Month Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={nextMonth} style={navBtn}><ChevronRightIcon size={18} /></button>
          <span style={{ fontSize: "20px", fontWeight: 600, color: "#f0f0f5", minWidth: "140px", textAlign: "center" }}>
            {HEBREW_MONTH_NAMES[month]} {year}
          </span>
          <button onClick={prevMonth} style={navBtn}><ChevronLeftIcon size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={goToday} style={btnSecondary}>היום</button>
          <button style={{ ...btnSecondary, background: "rgba(0,0,255,0.15)", color: "#5555FF", borderColor: "rgba(0,0,255,0.3)" }}>חודש</button>
          <button style={btnSecondary} disabled>שבוע</button>
        </div>
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", marginBottom: "1px" }}>
        {HEBREW_DAY_NAMES.map(name => (
          <div key={name} style={{ padding: "10px 4px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.5)" }}>
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
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
              {/* Day number */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                <span style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: "13px",
                  fontWeight: isToday ? 700 : 400,
                  color: cell.currentMonth ? (isToday ? "#fff" : "rgba(240,240,245,0.9)") : "rgba(240,240,245,0.25)",
                  background: isToday ? "#0000FF" : "transparent",
                }}>
                  {cell.day}
                </span>
              </div>
              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {dayEvents.slice(0, 3).map(evt => (
                  <div
                    key={evt.id}
                    onClick={e => { e.stopPropagation(); setDetailEvent(evt); }}
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: EVENT_TYPE_COLORS[evt.type] + "22",
                      borderRight: `3px solid ${EVENT_TYPE_COLORS[evt.type]}`,
                      color: "rgba(240,240,245,0.85)",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = EVENT_TYPE_COLORS[evt.type] + "44"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = EVENT_TYPE_COLORS[evt.type] + "22"; }}
                  >
                    {evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: "10px", color: "rgba(240,240,245,0.4)", textAlign: "center" }}>+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
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
  event: CalendarEvent;
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(240,240,245,0.6)", fontSize: "14px", marginBottom: "8px" }}>
          <CalendarIcon size={14} /> {event.date}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(240,240,245,0.6)", fontSize: "14px", marginBottom: "16px" }}>
          <ClockIcon size={14} /> {event.startTime}{event.endTime && event.endTime !== event.startTime ? ` - ${event.endTime}` : ""}
        </div>
        {event.description && (
          <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "14px", marginBottom: "16px", lineHeight: 1.5 }}>{event.description}</p>
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
  event: CalendarEvent | null;
  prefillDate: string;
  onSave: (e: CalendarEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [date, setDate] = useState(event?.date || prefillDate);
  const [startTime, setStartTime] = useState(event?.startTime || "19:00");
  const [endTime, setEndTime] = useState(event?.endTime || "20:00");
  const [type, setType] = useState<EventType>(event?.type || "other");
  const [description, setDescription] = useState(event?.description || "");

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
  color: "rgba(240,240,245,0.6)",
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
