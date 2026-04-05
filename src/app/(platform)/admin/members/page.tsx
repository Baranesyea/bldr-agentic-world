"use client";

import React, { useState, useEffect } from "react";

interface Member {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "inactive";
  type: "free" | "paid";
  pricePaid: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserAnalytics {
  loginCount: number;
  lastLogin: string | null;
  devices: string[];
  videoMinutes: number;
  notesCount: number;
  questionsCount: number;
  sessions: {
    sessionId: string;
    startTime: string;
    durationSeconds: number;
    pagesViewed: number;
    pages: string[];
  }[];
  courses: {
    courseId: string;
    lessonsWatched: number;
    totalMinutes: number;
  }[];
}

interface TimelineEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  page: string;
  device: string;
  time: string;
}

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
  padding: "24px",
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "10px 22px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const STAT_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "6px",
  padding: "16px",
  textAlign: "center" as const,
};

const LABEL: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(240,240,245,0.5)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const VALUE: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#f0f0f5",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}ש`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}ד`;
  const h = Math.floor(m / 60);
  return `${h}ש ${m % 60}ד`;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("he-IL");
  } catch {
    return d;
  }
}

function formatDateTime(d: string) {
  try {
    return new Date(d).toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function deviceIcon(d: string) {
  if (d === "mobile") return "📱";
  if (d === "tablet") return "📟";
  return "🖥️";
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  session_start: { label: "התחלת סשן", color: "#4CAF50" },
  session_heartbeat: { label: "פעילות", color: "#607D8B" },
  login: { label: "התחברות", color: "#2196F3" },
  page_view: { label: "צפייה בעמוד", color: "#9C27B0" },
  video_play: { label: "הפעלת וידאו", color: "#FF9800" },
  video_progress: { label: "צפייה בוידאו", color: "#FF5722" },
  note_created: { label: "יצירת הערה", color: "#00BCD4" },
  question_asked: { label: "שאלה", color: "#E91E63" },
};

function formatTime(d: string) {
  try {
    return new Date(d).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return d;
  }
}

function eventDescription(ev: TimelineEvent): string {
  const d = ev.data || {};
  switch (ev.type) {
    case "page_view": return String(d.path || d.title || ev.page || "");
    case "video_play": return String(d.lessonTitle || d.lessonId || "");
    case "video_progress": {
      const sec = Number(d.seconds || 0);
      return `${String(d.lessonTitle || d.lessonId || "")} — ${Math.round(sec / 60)} דקות`;
    }
    case "login": return `שיטה: ${String(d.method || "unknown")}`;
    case "session_start": return `מכשיר: ${String(d.deviceType || "unknown")}`;
    case "session_heartbeat": return `${formatDuration(Number(d.activeDuration || 0))} פעילות`;
    case "note_created": return String(d.lessonTitle || d.lessonId || "");
    case "question_asked": return String(d.question || "").slice(0, 60);
    default: return JSON.stringify(d).slice(0, 80);
  }
}

/* ────────────────── Session Timeline ────────────────── */
function SessionTimeline({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/analytics?view=session&sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        setEvents(data.timeline || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [sessionId]);

  // Filter out heartbeats for cleaner view (keep the last one for duration)
  const meaningfulEvents = events.filter((e, i) => {
    if (e.type !== "session_heartbeat") return true;
    // Keep only the last heartbeat
    const nextHeartbeat = events.slice(i + 1).find(x => x.type === "session_heartbeat");
    return !nextHeartbeat;
  });

  return (
    <div style={{
      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px", padding: "16px", marginTop: "8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.7)", margin: 0 }}>
          טיימליין סשן
        </h4>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "rgba(240,240,245,0.5)",
          cursor: "pointer", fontSize: "12px",
        }}>
          ✕
        </button>
      </div>

      {loading && <div style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>טוען...</div>}

      {!loading && meaningfulEvents.length === 0 && (
        <div style={{ color: "rgba(240,240,245,0.4)", fontSize: "13px" }}>אין אירועים בסשן</div>
      )}

      {!loading && meaningfulEvents.length > 0 && (
        <div style={{ position: "relative", paddingRight: "20px" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", right: "6px", top: "4px", bottom: "4px",
            width: "2px", background: "rgba(255,255,255,0.08)",
          }} />

          {meaningfulEvents.map((ev, i) => {
            const info = EVENT_LABELS[ev.type] || { label: ev.type, color: "#888" };
            return (
              <div key={ev.id || i} style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                marginBottom: "10px", position: "relative",
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", right: "-17px", top: "5px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: info.color, border: "2px solid rgba(0,0,0,0.4)",
                  flexShrink: 0,
                }} />

                {/* Time */}
                <div style={{
                  fontSize: "11px", color: "rgba(240,240,245,0.4)",
                  minWidth: "60px", direction: "ltr", textAlign: "right", paddingTop: "2px",
                }}>
                  {formatTime(ev.time)}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "inline-block", fontSize: "11px", fontWeight: 600,
                    padding: "2px 8px", borderRadius: "10px",
                    background: `${info.color}20`, color: info.color,
                    marginBottom: "2px",
                  }}>
                    {info.label}
                  </span>
                  <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)", marginTop: "2px" }}>
                    {eventDescription(ev)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────────────────── User Detail Panel ────────────────── */
function UserDetailPanel({ member, onClose }: { member: Member; onClose: () => void }) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/analytics?view=user&email=${encodeURIComponent(member.email)}`);
        const data = await res.json();
        setAnalytics(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [member.email]);

  return (
    <div style={{ ...CARD, marginBottom: "24px", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f5", margin: "0 0 4px 0" }}>
            {member.fullName}
          </h2>
          <div style={{ fontSize: "14px", color: "rgba(240,240,245,0.5)", direction: "ltr", textAlign: "right" }}>
            {member.email}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <span style={{
              padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
              background: member.status === "active" ? "rgba(0,200,83,0.12)" : "rgba(255,59,48,0.12)",
              color: member.status === "active" ? "#00C853" : "#ff6b6b",
            }}>
              {member.status === "active" ? "פעיל" : "לא פעיל"}
            </span>
            <span style={{
              padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
              background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.7)",
            }}>
              {member.type === "paid" ? `בתשלום — ${member.pricePaid} ₪` : "חינם"}
            </span>
            <span style={{
              padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
              background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.5)",
            }}>
              הצטרף {formatDate(member.createdAt)}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px", padding: "6px 14px", color: "rgba(240,240,245,0.7)",
          fontSize: "12px", cursor: "pointer",
        }}>
          ✕ סגור
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "rgba(240,240,245,0.5)", padding: "40px 0" }}>
          טוען נתוני משתמש...
        </div>
      )}

      {!loading && analytics && (
        <>
          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <div style={STAT_CARD}>
              <div style={LABEL}>התחברויות</div>
              <div style={VALUE}>{analytics.loginCount}</div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>התחברות אחרונה</div>
              <div style={{ ...VALUE, fontSize: "14px" }}>
                {analytics.lastLogin ? formatDateTime(analytics.lastLogin) : "—"}
              </div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>סשנים</div>
              <div style={VALUE}>{analytics.sessions.length}</div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>דקות צפייה</div>
              <div style={VALUE}>{analytics.videoMinutes}</div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>הערות</div>
              <div style={VALUE}>{analytics.notesCount}</div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>שאלות</div>
              <div style={VALUE}>{analytics.questionsCount}</div>
            </div>
            <div style={STAT_CARD}>
              <div style={LABEL}>מכשירים</div>
              <div style={{ ...VALUE, fontSize: "18px" }}>
                {analytics.devices.length > 0 ? analytics.devices.map(d => deviceIcon(d)).join(" ") : "—"}
              </div>
            </div>
          </div>

          {/* Course Progress */}
          {analytics.courses.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(240,240,245,0.7)", margin: "0 0 12px 0" }}>
                התקדמות בקורסים
              </h3>
              <div style={{ display: "grid", gap: "8px" }}>
                {analytics.courses.map((c) => (
                  <div key={c.courseId} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "4px", padding: "10px 14px",
                  }}>
                    <span style={{ color: "#f0f0f5", fontSize: "13px" }}>{c.courseId}</span>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(240,240,245,0.5)" }}>
                      <span>{c.lessonsWatched} שיעורים</span>
                      <span>{c.totalMinutes} דקות</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions List */}
          {analytics.sessions.length > 0 && (
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(240,240,245,0.7)", margin: "0 0 12px 0" }}>
                סשנים ({analytics.sessions.length})
              </h3>
              <div style={{ display: "grid", gap: "6px", maxHeight: "500px", overflowY: "auto" }}>
                {analytics.sessions.slice(0, 20).map((s) => (
                  <div key={s.sessionId}>
                    <button
                      onClick={() => setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)}
                      style={{
                        width: "100%", textAlign: "right", cursor: "pointer",
                        background: expandedSession === s.sessionId ? "rgba(26,26,255,0.08)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${expandedSession === s.sessionId ? "rgba(26,26,255,0.2)" : "rgba(255,255,255,0.05)"}`,
                        borderRadius: "4px", padding: "10px 14px",
                        color: "#f0f0f5", fontSize: "13px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ color: "rgba(240,240,245,0.4)", fontSize: "12px" }}>
                        {expandedSession === s.sessionId ? "▲" : "▼"} {s.pagesViewed} עמודים
                      </span>
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "12px" }}>
                          {formatDuration(s.durationSeconds)}
                        </span>
                        <span>{s.startTime ? formatDateTime(s.startTime) : "—"}</span>
                      </div>
                    </button>
                    {expandedSession === s.sessionId && (
                      <SessionTimeline
                        sessionId={s.sessionId}
                        onClose={() => setExpandedSession(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No data state */}
          {analytics.loginCount === 0 && analytics.sessions.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(240,240,245,0.4)", padding: "20px 0" }}>
              אין נתוני פעילות למשתמש זה
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────── Main Page ────────────────── */
export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Add form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"free" | "paid">("free");
  const [newPrice, setNewPrice] = useState(0);
  const [newNotes, setNewNotes] = useState("");

  // Edit form
  const [editType, setEditType] = useState<"free" | "paid">("free");
  const [editPrice, setEditPrice] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editName, setEditName] = useState("");

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async () => {
    if (!newEmail || !newName) return;
    try {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName,
          type: newType,
          pricePaid: newPrice,
          notes: newNotes,
        }),
      });
      setShowAdd(false);
      setNewEmail("");
      setNewName("");
      setNewType("free");
      setNewPrice(0);
      setNewNotes("");
      fetchMembers();
    } catch {}
  };

  const toggleStatus = async (member: Member) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, status: newStatus }),
      });
      fetchMembers();
    } catch {}
  };

  const handleDelete = async (member: Member) => {
    if (!confirm(`למחוק את ${member.fullName}? המשתמש ינותק מהמערכת מיידית.`)) return;
    try {
      await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          fullName: member.fullName,
          userType: member.type,
          deletedBy: "admin",
        }),
      });
      if (selectedMember?.id === member.id) setSelectedMember(null);
      fetchMembers();
    } catch {}
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditType(member.type);
    setEditPrice(member.pricePaid);
    setEditNotes(member.notes || "");
    setEditName(member.fullName);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          fullName: editName,
          type: editType,
          pricePaid: editPrice,
          notes: editNotes,
        }),
      });
      setEditingId(null);
      fetchMembers();
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "rgba(240,240,245,0.7)", textAlign: "center" }}>
        טוען...
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>
          ניהול סטודנטים
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} style={BTN}>
          + הוסף סטודנט
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ ...CARD, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "16px" }}>
            סטודנט חדש
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              placeholder="אימייל"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={INPUT}
            />
            <input
              placeholder="שם מלא"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={INPUT}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "free" | "paid")}
              style={INPUT}
            >
              <option value="free">חינם</option>
              <option value="paid">בתשלום</option>
            </select>
            <input
              type="number"
              placeholder="מחיר"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              style={INPUT}
            />
            <input
              placeholder="הערות"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              style={{ ...INPUT, gridColumn: "1 / -1" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{ ...BTN, background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.7)" }}
            >
              ביטול
            </button>
            <button onClick={handleAdd} style={BTN}>
              שמור
            </button>
          </div>
        </div>
      )}

      {/* User Detail Panel */}
      {selectedMember && (
        <UserDetailPanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Table */}
      <div style={{ ...CARD, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["שם", "אימייל", "סטטוס", "סוג", "מחיר", "תאריך הצטרפות", "פעולות"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    color: "rgba(240,240,245,0.7)",
                    fontWeight: 500,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "rgba(240,240,245,0.7)" }}>
                  אין סטודנטים עדיין
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr
                key={m.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.15s",
                  background: selectedMember?.id === m.id ? "rgba(26,26,255,0.08)" : "transparent",
                }}
                onMouseEnter={(e) => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = "transparent"; }}
              >
                {editingId === m.id ? (
                  <>
                    <td style={{ padding: "10px 16px" }}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...INPUT, padding: "6px 10px" }} />
                    </td>
                    <td style={{ padding: "10px 16px", color: "#f0f0f5" }}>{m.email}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                        background: m.status === "active" ? "rgba(0,200,83,0.12)" : "rgba(255,59,48,0.12)",
                        color: m.status === "active" ? "#00C853" : "#ff6b6b",
                      }}>
                        {m.status === "active" ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <select value={editType} onChange={(e) => setEditType(e.target.value as "free" | "paid")} style={{ ...INPUT, padding: "6px 10px" }}>
                        <option value="free">חינם</option>
                        <option value="paid">בתשלום</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} style={{ ...INPUT, padding: "6px 10px", width: "80px" }} />
                    </td>
                    <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.7)" }}>{formatDate(m.createdAt)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={saveEdit} style={{ ...BTN, padding: "6px 14px", fontSize: "12px" }}>
                          שמור
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ ...BTN, padding: "6px 14px", fontSize: "12px", background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.7)" }}
                        >
                          ביטול
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td
                      onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                      style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 500, cursor: "pointer" }}
                    >
                      {m.fullName}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right" }}>{m.email}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggleStatus(m)}
                        style={{
                          padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                          border: "none", cursor: "pointer",
                          background: m.status === "active" ? "rgba(0,200,83,0.12)" : "rgba(255,59,48,0.12)",
                          color: m.status === "active" ? "#00C853" : "#ff6b6b",
                        }}
                      >
                        {m.status === "active" ? "פעיל" : "לא פעיל"}
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)" }}>
                      {m.type === "paid" ? "בתשלום" : "חינם"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)" }}>
                      {m.pricePaid > 0 ? `${m.pricePaid} ₪` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", fontSize: "13px" }}>
                      {formatDate(m.createdAt)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                          style={{
                            background: "rgba(26,26,255,0.12)",
                            border: "1px solid rgba(26,26,255,0.2)",
                            borderRadius: "4px",
                            padding: "6px 14px",
                            color: "#7777ff",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          נתונים
                        </button>
                        <button
                          onClick={() => startEdit(m)}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "4px",
                            padding: "6px 14px",
                            color: "rgba(240,240,245,0.7)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          עריכה
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          style={{
                            background: "rgba(255,59,48,0.08)",
                            border: "1px solid rgba(255,59,48,0.15)",
                            borderRadius: "4px",
                            padding: "6px 14px",
                            color: "#ff6b6b",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
