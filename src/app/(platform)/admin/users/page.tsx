"use client";

import React, { useState, useMemo } from "react";
import { SearchIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";

/* ─── Types ─── */
interface CourseProgress {
  courseTitle: string;
  watched: number;
  total: number;
  completedAssignments: number;
  totalAssignments: number;
  lessons: { title: string; watched: boolean; assignmentDone: boolean }[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  joinedAt: string;
  role: "member" | "admin";
  lastActive: string;
  stats: {
    totalWatched: number;
    totalLessons: number;
    completedAssignments: number;
    totalAssignments: number;
    notesCount: number;
    streakDays: number;
  };
  courseProgress: CourseProgress[];
}

/* ─── Mock Data ─── */
const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)",
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
];

function makeLessons(titles: string[], watchedCount: number, assignmentsDone: number): { title: string; watched: boolean; assignmentDone: boolean }[] {
  return titles.map((title, i) => ({
    title,
    watched: i < watchedCount,
    assignmentDone: i < assignmentsDone,
  }));
}

const COURSES_POOL: { courseTitle: string; lessons: string[] }[] = [
  {
    courseTitle: "Building AI Agents from Scratch",
    lessons: [
      "Introduction to AI Agents",
      "Setting Up Your Environment",
      "Prompt Engineering Basics",
      "Chain of Thought Reasoning",
      "Tool Use & Function Calling",
      "Memory & Context Management",
      "Multi-Agent Systems",
      "Deployment & Production",
    ],
  },
  {
    courseTitle: "Advanced Automation with Make.com",
    lessons: [
      "Make.com Overview",
      "Building Your First Scenario",
      "Working with APIs",
      "Error Handling & Filters",
      "Advanced Data Structures",
      "Scheduling & Webhooks",
    ],
  },
  {
    courseTitle: "Live Selling Masterclass",
    lessons: [
      "The Psychology of Live Selling",
      "Camera Setup & Lighting",
      "Building Your Show Structure",
      "Engagement Techniques",
      "Handling Objections Live",
      "Post-Show Follow Up",
      "Scaling Your Live Sales",
    ],
  },
  {
    courseTitle: "Content Strategy for Creators",
    lessons: [
      "Defining Your Niche",
      "Content Pillars Framework",
      "Platform-Specific Strategy",
      "Content Calendar Planning",
      "Analytics & Optimization",
    ],
  },
];

const MOCK_USERS: UserData[] = [
  {
    id: "u1",
    name: "שירה כהן",
    email: "shira.cohen@gmail.com",
    avatarUrl: "",
    joinedAt: "2025-11-12T10:00:00Z",
    role: "admin",
    lastActive: "2026-03-15T08:30:00Z",
    stats: { totalWatched: 22, totalLessons: 26, completedAssignments: 18, totalAssignments: 20, notesCount: 34, streakDays: 45 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 8, total: 8, completedAssignments: 8, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 8, 8) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 6, total: 6, completedAssignments: 5, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 6, 5) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 5, total: 7, completedAssignments: 3, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 5, 3) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 3, total: 5, completedAssignments: 2, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 3, 2) },
    ],
  },
  {
    id: "u2",
    name: "אורי לוי",
    email: "ori.levi@outlook.com",
    avatarUrl: "",
    joinedAt: "2025-12-03T14:00:00Z",
    role: "member",
    lastActive: "2026-03-14T19:00:00Z",
    stats: { totalWatched: 14, totalLessons: 26, completedAssignments: 10, totalAssignments: 20, notesCount: 12, streakDays: 18 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 5, total: 8, completedAssignments: 4, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 5, 4) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 4, total: 6, completedAssignments: 3, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 4, 3) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 3, total: 7, completedAssignments: 2, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 3, 2) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 2, total: 5, completedAssignments: 1, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 2, 1) },
    ],
  },
  {
    id: "u3",
    name: "נועה ברק",
    email: "noa.barak@yahoo.com",
    avatarUrl: "",
    joinedAt: "2026-01-15T09:00:00Z",
    role: "member",
    lastActive: "2026-03-13T16:45:00Z",
    stats: { totalWatched: 18, totalLessons: 26, completedAssignments: 14, totalAssignments: 20, notesCount: 22, streakDays: 30 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 7, total: 8, completedAssignments: 6, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 7, 6) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 6, total: 6, completedAssignments: 5, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 6, 5) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 3, total: 7, completedAssignments: 2, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 3, 2) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 2, total: 5, completedAssignments: 1, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 2, 1) },
    ],
  },
  {
    id: "u4",
    name: "יונתן מזרחי",
    email: "yonatan.m@gmail.com",
    avatarUrl: "",
    joinedAt: "2026-02-01T11:00:00Z",
    role: "member",
    lastActive: "2026-03-10T12:00:00Z",
    stats: { totalWatched: 4, totalLessons: 26, completedAssignments: 2, totalAssignments: 20, notesCount: 3, streakDays: 5 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 3, total: 8, completedAssignments: 1, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 3, 1) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 1, total: 6, completedAssignments: 1, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 1, 1) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 0, total: 7, completedAssignments: 0, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 0, 0) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 0, total: 5, completedAssignments: 0, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 0, 0) },
    ],
  },
  {
    id: "u5",
    name: "מיכל אברהם",
    email: "michal.a@walla.co.il",
    avatarUrl: "",
    joinedAt: "2025-10-20T08:00:00Z",
    role: "member",
    lastActive: "2026-03-15T07:15:00Z",
    stats: { totalWatched: 26, totalLessons: 26, completedAssignments: 20, totalAssignments: 20, notesCount: 48, streakDays: 120 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 8, total: 8, completedAssignments: 8, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 8, 8) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 6, total: 6, completedAssignments: 6, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 6, 6) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 7, total: 7, completedAssignments: 4, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 7, 4) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 5, total: 5, completedAssignments: 2, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 5, 2) },
    ],
  },
  {
    id: "u6",
    name: "דניאל פרידמן",
    email: "daniel.f@gmail.com",
    avatarUrl: "",
    joinedAt: "2026-02-20T16:00:00Z",
    role: "member",
    lastActive: "2026-03-12T22:30:00Z",
    stats: { totalWatched: 8, totalLessons: 26, completedAssignments: 5, totalAssignments: 20, notesCount: 7, streakDays: 10 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 4, total: 8, completedAssignments: 3, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 4, 3) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 2, total: 6, completedAssignments: 1, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 2, 1) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 2, total: 7, completedAssignments: 1, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 2, 1) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 0, total: 5, completedAssignments: 0, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 0, 0) },
    ],
  },
  {
    id: "u7",
    name: "תמר גולן",
    email: "tamar.golan@hotmail.com",
    avatarUrl: "",
    joinedAt: "2026-03-01T13:00:00Z",
    role: "member",
    lastActive: "2026-03-14T10:00:00Z",
    stats: { totalWatched: 6, totalLessons: 26, completedAssignments: 3, totalAssignments: 20, notesCount: 5, streakDays: 14 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 3, total: 8, completedAssignments: 2, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 3, 2) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 2, total: 6, completedAssignments: 1, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 2, 1) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 1, total: 7, completedAssignments: 0, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 1, 0) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 0, total: 5, completedAssignments: 0, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 0, 0) },
    ],
  },
  {
    id: "u8",
    name: "עידו שפירא",
    email: "ido.shapira@gmail.com",
    avatarUrl: "",
    joinedAt: "2025-12-25T10:00:00Z",
    role: "member",
    lastActive: "2026-03-08T14:20:00Z",
    stats: { totalWatched: 11, totalLessons: 26, completedAssignments: 8, totalAssignments: 20, notesCount: 15, streakDays: 0 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 6, total: 8, completedAssignments: 5, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 6, 5) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 3, total: 6, completedAssignments: 2, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 3, 2) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 2, total: 7, completedAssignments: 1, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 2, 1) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 0, total: 5, completedAssignments: 0, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 0, 0) },
    ],
  },
  {
    id: "u9",
    name: "רונית דוד",
    email: "ronit.david@gmail.com",
    avatarUrl: "",
    joinedAt: "2026-03-10T09:00:00Z",
    role: "member",
    lastActive: "2026-03-15T06:00:00Z",
    stats: { totalWatched: 2, totalLessons: 26, completedAssignments: 1, totalAssignments: 20, notesCount: 1, streakDays: 5 },
    courseProgress: [
      { courseTitle: COURSES_POOL[0].courseTitle, watched: 2, total: 8, completedAssignments: 1, totalAssignments: 8, lessons: makeLessons(COURSES_POOL[0].lessons, 2, 1) },
      { courseTitle: COURSES_POOL[1].courseTitle, watched: 0, total: 6, completedAssignments: 0, totalAssignments: 6, lessons: makeLessons(COURSES_POOL[1].lessons, 0, 0) },
      { courseTitle: COURSES_POOL[2].courseTitle, watched: 0, total: 7, completedAssignments: 0, totalAssignments: 4, lessons: makeLessons(COURSES_POOL[2].lessons, 0, 0) },
      { courseTitle: COURSES_POOL[3].courseTitle, watched: 0, total: 5, completedAssignments: 0, totalAssignments: 2, lessons: makeLessons(COURSES_POOL[3].lessons, 0, 0) },
    ],
  },
];

/* ─── Helpers ─── */
type SortKey = "name" | "joinedAt" | "lastActive" | "progress";

function getOverallProgress(u: UserData): number {
  return u.stats.totalLessons > 0 ? Math.round((u.stats.totalWatched / u.stats.totalLessons) * 100) : 0;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return `לפני ${Math.floor(days / 30)} חודשים`;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
}

function getCourseStatus(cp: CourseProgress): { label: string; color: string; bg: string } {
  if (cp.watched === 0) return { label: "לא התחיל", color: "rgba(240,240,245,0.5)", bg: "rgba(255,255,255,0.06)" };
  if (cp.watched >= cp.total && cp.completedAssignments >= cp.totalAssignments) return { label: "הושלם", color: "#4ade80", bg: "rgba(74,222,128,0.12)" };
  return { label: "בתהליך", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" };
}

/* ─── Component ─── */
export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = MOCK_USERS.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name, "he"); break;
        case "joinedAt": cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(); break;
        case "lastActive": cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime(); break;
        case "progress": cmp = getOverallProgress(a) - getOverallProgress(b); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const totalUsers = MOCK_USERS.length;
  const now = Date.now();
  const activeThisWeek = MOCK_USERS.filter((u) => now - new Date(u.lastActive).getTime() < 7 * 86400000).length;
  const avgProgress = Math.round(MOCK_USERS.reduce((s, u) => s + getOverallProgress(u), 0) / totalUsers);
  const newThisMonth = MOCK_USERS.filter((u) => {
    const d = new Date(u.joinedAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const toggleCourseExpand = (userId: string, courseTitle: string) => {
    const key = `${userId}::${courseTitle}`;
    setExpandedCourses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "24px" }}>
        משתמשים
      </h1>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "סה\"כ משתמשים", value: totalUsers },
          { label: "פעילים השבוע", value: activeThisWeek },
          { label: "התקדמות ממוצעת", value: avgProgress + "%" },
          { label: "חדשים החודש", value: newThisMonth },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "360px" }}>
        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,245,0.35)", display: "flex" }}>
          <SearchIcon size={16} />
        </span>
        <input
          placeholder="חיפוש לפי שם או אימייל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 40px 10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { label: "", key: null, width: "48px" },
                { label: "שם", key: "name" as SortKey, width: undefined },
                { label: "אימייל", key: null, width: undefined },
                { label: "הצטרפות", key: "joinedAt" as SortKey, width: "120px" },
                { label: "פעילות אחרונה", key: "lastActive" as SortKey, width: "130px" },
                { label: "התקדמות", key: "progress" as SortKey, width: "160px" },
              ].map((col, i) => (
                <th
                  key={i}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "rgba(240,240,245,0.45)",
                    cursor: col.key ? "pointer" : "default",
                    userSelect: "none",
                    width: col.width,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {col.label}{col.key ? sortIndicator(col.key) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, idx) => {
              const progress = getOverallProgress(user);
              const isExpanded = expandedUser === user.id;
              return (
                <React.Fragment key={user.id}>
                  <tr
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                    style={{ cursor: "pointer", background: isExpanded ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Avatar */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: GRADIENTS[idx % GRADIENTS.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#fff",
                      }}>
                        {getInitials(user.name)}
                      </div>
                    </td>
                    {/* Name */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "14px", fontWeight: 600, color: "#f0f0f5" }}>
                      {user.name}
                      {user.role === "admin" && (
                        <span style={{ marginRight: "8px", fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                          מנהל
                        </span>
                      )}
                    </td>
                    {/* Email */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px", color: "rgba(240,240,245,0.5)", fontFamily: "var(--font-heading-en)" }}>
                      {user.email}
                    </td>
                    {/* Joined */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>
                      {formatDate(user.joinedAt)}
                    </td>
                    {/* Last Active */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>
                      {relativeDate(user.lastActive)}
                    </td>
                    {/* Progress */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)" }}>
                          <div style={{ width: progress + "%", height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.6)", minWidth: "36px", textAlign: "left" }}>{progress}%</span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ padding: "24px 28px", background: "rgba(255,255,255,0.02)" }}>
                          {/* Section 1: Overview */}
                          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", marginBottom: "28px" }}>
                            <div style={{
                              width: 56,
                              height: 56,
                              borderRadius: "50%",
                              background: GRADIENTS[idx % GRADIENTS.length],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}>
                              {getInitials(user.name)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{user.name}</span>
                                <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "6px", background: user.role === "admin" ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)", color: user.role === "admin" ? "#60a5fa" : "rgba(240,240,245,0.5)" }}>
                                  {user.role === "admin" ? "מנהל" : "חבר"}
                                </span>
                              </div>
                              <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", fontFamily: "var(--font-heading-en)", marginBottom: "4px" }}>{user.email}</div>
                              <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>
                                הצטרף/ה {formatDate(user.joinedAt)} &middot; פעילות אחרונה {relativeDate(user.lastActive)}
                              </div>
                            </div>
                          </div>

                          {/* Stats cards */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
                            {[
                              { label: "שיעורים נצפו", value: `${user.stats.totalWatched}/${user.stats.totalLessons}` },
                              { label: "מטלות הושלמו", value: `${user.stats.completedAssignments}/${user.stats.totalAssignments}` },
                              { label: "הערות", value: user.stats.notesCount },
                              { label: "רצף ימים", value: user.stats.streakDays },
                            ].map((s) => (
                              <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "14px" }}>
                                <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", marginBottom: "4px" }}>{s.label}</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{s.value}</div>
                              </div>
                            ))}
                          </div>

                          {/* Section 2: Course Progress */}
                          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f5", marginBottom: "14px" }}>התקדמות בקורסים</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {user.courseProgress.map((cp) => {
                              const status = getCourseStatus(cp);
                              const courseKey = `${user.id}::${cp.courseTitle}`;
                              const isCourseExpanded = expandedCourses[courseKey] || false;
                              const cpProgress = cp.total > 0 ? Math.round((cp.watched / cp.total) * 100) : 0;

                              return (
                                <div key={cp.courseTitle} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                                  {/* Course row */}
                                  <div
                                    onClick={(e) => { e.stopPropagation(); toggleCourseExpand(user.id, cp.courseTitle); }}
                                    style={{ display: "grid", gridTemplateColumns: "24px 1fr 140px 100px 90px", alignItems: "center", gap: "12px", padding: "12px 14px", cursor: "pointer" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <span style={{ color: "rgba(240,240,245,0.4)", display: "flex", transition: "transform 0.2s", transform: isCourseExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                                      <ChevronRightIcon size={14} />
                                    </span>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5", fontFamily: "var(--font-heading-en)" }}>
                                      {cp.courseTitle}
                                    </span>
                                    {/* Progress bar */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.06)" }}>
                                        <div style={{ width: cpProgress + "%", height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
                                      </div>
                                      <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.5)", minWidth: "40px" }}>{cp.watched}/{cp.total}</span>
                                    </div>
                                    {/* Assignments */}
                                    <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)" }}>
                                      מטלות: {cp.completedAssignments}/{cp.totalAssignments}
                                    </span>
                                    {/* Status */}
                                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", background: status.bg, color: status.color, textAlign: "center" }}>
                                      {status.label}
                                    </span>
                                  </div>

                                  {/* Section 3: Lesson detail (collapsible) */}
                                  {isCourseExpanded && (
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "8px 14px 12px 14px" }}>
                                      {cp.lessons.map((lesson, li) => (
                                        <div key={li} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 0", borderBottom: li < cp.lessons.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                                          <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.3)", minWidth: "20px" }}>{li + 1}</span>
                                          <span style={{ flex: 1, fontSize: "13px", color: lesson.watched ? "#f0f0f5" : "rgba(240,240,245,0.4)", fontFamily: "var(--font-heading-en)" }}>
                                            {lesson.title}
                                          </span>
                                          {/* Watched */}
                                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: lesson.watched ? "#4ade80" : "rgba(240,240,245,0.2)", minWidth: "50px" }}>
                                            {lesson.watched ? <CheckIcon size={13} color="#4ade80" /> : <span style={{ display: "inline-block", width: "13px", textAlign: "center" }}>-</span>}
                                            צפייה
                                          </span>
                                          {/* Assignment */}
                                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: lesson.assignmentDone ? "#4ade80" : "rgba(240,240,245,0.2)", minWidth: "50px" }}>
                                            {lesson.assignmentDone ? <CheckIcon size={13} color="#4ade80" /> : <span style={{ display: "inline-block", width: "13px", textAlign: "center" }}>-</span>}
                                            מטלה
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
