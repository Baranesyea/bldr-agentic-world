"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";

// ── Types ──
interface OverviewData {
  view: "overview";
  activeUsers30d: number;
  sessionsToday: number;
  sessionsWeek: number;
  sessionsMonth: number;
  totalVideoMinutes: number;
  avgSessionMinutes: number;
  dailyActiveUsers: { day: string; users: number }[];
  videoHoursChart: { day: string; hours: number }[];
  peakHours: { hour: number; count: number }[];
  topLessons: { lessonId: string; lessonTitle: string; views: number }[];
  topUsers: { userEmail: string; eventCount: number }[];
}

interface UserSummary {
  userEmail: string;
  eventCount: number;
  lastSeen: string;
}

interface UserDetail {
  view: "user";
  email: string;
  loginCount: number;
  lastLogin: string | null;
  devices: string[];
  videoMinutes: number;
  notesCount: number;
  questionsCount: number;
  sessions: { sessionId: string; startTime: string; durationSeconds: number; pagesViewed: number; pages: string[] }[];
  courses: { courseId: string; lessonsWatched: number; totalMinutes: number }[];
}

// ── Styles ──
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8,
  padding: "20px 24px",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(240,240,245,0.7)",
  marginBottom: 4,
};

const statValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#f0f0f5",
};

const heading: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#f0f0f5",
  marginBottom: 12,
};

function BarChart({ data, maxVal, labelKey, valueKey, color = "#0000FF" }: {
  data: Record<string, unknown>[];
  maxVal: number;
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  if (!data.length) return <div style={{ color: "rgba(240,240,245,0.5)", fontSize: 12 }}>אין נתונים</div>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
      {data.map((item, i) => {
        const val = Number(item[valueKey]) || 0;
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const label = String(item[labelKey] || "").slice(5); // trim year
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div
              style={{
                width: "100%",
                maxWidth: 24,
                height: `${Math.max(pct, 2)}%`,
                background: color,
                borderRadius: "3px 3px 0 0",
                minHeight: 2,
                transition: "height 0.3s",
              }}
              title={`${label}: ${val}`}
            />
            {data.length <= 15 && (
              <span style={{ fontSize: 8, color: "rgba(240,240,245,0.4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 30 }}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics?view=overview");
      const data = await res.json();
      setOverview(data);
    } catch {}
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics?view=users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
    setLoading(false);
  }, []);

  const fetchUserDetail = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?view=user&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setUserDetail(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "overview") fetchOverview();
    else fetchUsers();
  }, [tab, fetchOverview, fetchUsers]);

  useEffect(() => {
    if (selectedUser) fetchUserDetail(selectedUser);
  }, [selectedUser, fetchUserDetail]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    background: active ? "#0000FF" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "rgba(240,240,245,0.7)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  });

  // ── User Detail View ──
  if (selectedUser && userDetail) {
    return (
      <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto", direction: "rtl" }}>
        <button
          onClick={() => { setSelectedUser(null); setUserDetail(null); }}
          style={{ background: "none", border: "none", color: "#0000FF", cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 16 }}
        >
          &rarr; חזרה לרשימה
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", marginBottom: 24 }}>{userDetail.email}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <div style={card}>
            <div style={statLabel}>כניסות</div>
            <div style={statValue}>{userDetail.loginCount}</div>
          </div>
          <div style={card}>
            <div style={statLabel}>כניסה אחרונה</div>
            <div style={{ ...statValue, fontSize: 14 }}>{formatDate(userDetail.lastLogin)}</div>
          </div>
          <div style={card}>
            <div style={statLabel}>מכשירים</div>
            <div style={{ ...statValue, fontSize: 16 }}>{userDetail.devices.join(", ") || "—"}</div>
          </div>
          <div style={card}>
            <div style={statLabel}>דקות צפייה</div>
            <div style={statValue}>{userDetail.videoMinutes}</div>
          </div>
          <div style={card}>
            <div style={statLabel}>הערות</div>
            <div style={statValue}>{userDetail.notesCount}</div>
          </div>
          <div style={card}>
            <div style={statLabel}>שאלות</div>
            <div style={statValue}>{userDetail.questionsCount}</div>
          </div>
        </div>

        {/* Courses */}
        {userDetail.courses.length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={heading}>קורסים</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "rgba(240,240,245,0.7)" }}>קורס</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "rgba(240,240,245,0.7)" }}>שיעורים</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "rgba(240,240,245,0.7)" }}>דקות</th>
                </tr>
              </thead>
              <tbody>
                {userDetail.courses.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "6px 8px", color: "#f0f0f5" }}>{c.courseId.slice(0, 8)}...</td>
                    <td style={{ padding: "6px 8px", color: "#f0f0f5" }}>{c.lessonsWatched}</td>
                    <td style={{ padding: "6px 8px", color: "#f0f0f5" }}>{c.totalMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sessions */}
        {userDetail.sessions.length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={heading}>סשנים ({userDetail.sessions.length})</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {userDetail.sessions.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 16, color: "#f0f0f5" }}>
                    <span>{formatDate(s.startTime)}</span>
                    <span>{Math.round(s.durationSeconds / 60)} דק׳</span>
                    <span>{s.pagesViewed} עמודים</span>
                  </div>
                  {s.pages.length > 0 && (
                    <div style={{ fontSize: 10, color: "rgba(240,240,245,0.5)", marginTop: 2 }}>
                      {s.pages.slice(0, 5).join(" | ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main View ──
  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", direction: "rtl" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f5", marginBottom: 20 }}>אנליטיקס</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab("overview")} style={tabStyle(tab === "overview")}>סקירה כללית</button>
        <button onClick={() => setTab("users")} style={tabStyle(tab === "users")}>משתמשים</button>
      </div>

      {loading && <div style={{ color: "rgba(240,240,245,0.5)", fontSize: 13 }}>טוען...</div>}

      {/* ── OVERVIEW ── */}
      {tab === "overview" && overview && !loading && (
        <>
          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={card}>
              <div style={statLabel}>משתמשים פעילים (30 יום)</div>
              <div style={statValue}>{overview.activeUsers30d}</div>
            </div>
            <div style={card}>
              <div style={statLabel}>סשנים היום</div>
              <div style={statValue}>{overview.sessionsToday}</div>
            </div>
            <div style={card}>
              <div style={statLabel}>סשנים השבוע</div>
              <div style={statValue}>{overview.sessionsWeek}</div>
            </div>
            <div style={card}>
              <div style={statLabel}>סשנים החודש</div>
              <div style={statValue}>{overview.sessionsMonth}</div>
            </div>
            <div style={card}>
              <div style={statLabel}>דקות צפייה</div>
              <div style={statValue}>{overview.totalVideoMinutes}</div>
            </div>
            <div style={card}>
              <div style={statLabel}>ממוצע סשן (דק׳)</div>
              <div style={statValue}>{overview.avgSessionMinutes}</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={card}>
              <div style={heading}>משתמשים פעילים יומי (30 יום)</div>
              <BarChart
                data={overview.dailyActiveUsers}
                maxVal={Math.max(...overview.dailyActiveUsers.map(d => d.users), 1)}
                labelKey="day"
                valueKey="users"
              />
            </div>
            <div style={card}>
              <div style={heading}>שעות צפייה יומי</div>
              <BarChart
                data={overview.videoHoursChart}
                maxVal={Math.max(...overview.videoHoursChart.map(d => d.hours), 1)}
                labelKey="day"
                valueKey="hours"
                color="#4444FF"
              />
            </div>
          </div>

          {/* Peak hours */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={heading}>שעות שיא</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {Array.from({ length: 24 }, (_, h) => {
                const found = overview.peakHours.find(p => Number(p.hour) === h);
                const val = found ? Number(found.count) : 0;
                const maxPeak = Math.max(...overview.peakHours.map(p => Number(p.count)), 1);
                const pct = (val / maxPeak) * 100;
                return (
                  <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", maxWidth: 16, height: `${Math.max(pct, 2)}%`, background: "#0000FF", borderRadius: "2px 2px 0 0", minHeight: 2 }} title={`${h}:00 - ${val}`} />
                    <span style={{ fontSize: 7, color: "rgba(240,240,245,0.4)", marginTop: 2 }}>{h}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top lessons + top users */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={card}>
              <div style={heading}>שיעורים הכי נצפים (10)</div>
              {overview.topLessons.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <span style={{ color: "#f0f0f5" }}>{l.lessonTitle || l.lessonId?.slice(0, 8) || "—"}</span>
                  <span style={{ color: "rgba(240,240,245,0.7)" }}>{l.views} צפיות</span>
                </div>
              ))}
              {overview.topLessons.length === 0 && <div style={{ color: "rgba(240,240,245,0.5)", fontSize: 12 }}>אין נתונים</div>}
            </div>
            <div style={card}>
              <div style={heading}>משתמשים הכי פעילים (10)</div>
              {overview.topUsers.map((u, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <span
                    style={{ color: "#0000FF", cursor: "pointer" }}
                    onClick={() => { setSelectedUser(u.userEmail!); setTab("users"); }}
                  >
                    {u.userEmail}
                  </span>
                  <span style={{ color: "rgba(240,240,245,0.7)" }}>{u.eventCount} אירועים</span>
                </div>
              ))}
              {overview.topUsers.length === 0 && <div style={{ color: "rgba(240,240,245,0.5)", fontSize: 12 }}>אין נתונים</div>}
            </div>
          </div>
        </>
      )}

      {/* ── USERS LIST ── */}
      {tab === "users" && !selectedUser && !loading && (
        <div style={card}>
          <div style={heading}>משתמשים ({users.length})</div>
          {users.length === 0 && <div style={{ color: "rgba(240,240,245,0.5)", fontSize: 12 }}>אין נתונים</div>}
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {users.map((u, i) => (
              <div
                key={i}
                onClick={() => setSelectedUser(u.userEmail)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5" }}>{u.userEmail}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,240,245,0.5)" }}>נראה לאחרונה: {formatDate(u.lastSeen)}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(240,240,245,0.7)" }}>{u.eventCount} אירועים</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
