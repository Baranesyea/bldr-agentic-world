"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QuestionIcon, CheckIcon } from "@/components/ui/icons";
import { useUser } from "@/hooks/useUser";

interface Reply {
  id: string;
  question_id: string;
  parent_reply_id: string | null;
  user_name: string | null;
  user_email: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
}

interface Question {
  id: string;
  userId: string;
  courseId: string | null;
  lessonId: string | null;
  courseName: string | null;
  lessonTitle: string | null;
  userName: string | null;
  userEmail: string | null;
  title: string;
  description: string;
  mediaLink: string | null;
  status: string;
  adminResponse: string | null;
  resolvedByAdmin: boolean;
  createdAt: string;
  replies: Reply[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

export default function QAPageClient({ courses }: { courses: { id: string; name: string }[] }) {
  const { isAdmin, profile } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load questions from API
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return questions
      .filter((q) => {
        // For non-admin users: only show questions with admin answers (published FAQ)
        if (!isAdmin && q.status !== "answered") return false;
        if (search) {
          const s = search.toLowerCase();
          if (!q.title.toLowerCase().includes(s) && !q.description.toLowerCase().includes(s)) return false;
        }
        if (courseFilter !== "all" && q.courseId !== courseFilter) return false;
        if (statusFilter !== "all" && q.status !== statusFilter) return false;
        return true;
      });
  }, [questions, search, courseFilter, statusFilter, isAdmin]);

  const handleAdminReply = async (questionId: string) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/questions/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          content: replyText.trim(),
          userName: profile?.full_name || "מנהל",
          userEmail: profile?.email || "",
          isAdmin: true,
        }),
      });
      setReplyText("");
      // Reload questions
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (Array.isArray(data)) setQuestions(data);
    } catch {}
    setSubmitting(false);
  };

  const handleResolve = async (questionId: string) => {
    await fetch("/api/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: questionId, resolvedByAdmin: true }),
    });
    setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, resolvedByAdmin: true } : q));
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("למחוק את השאלה?")) return;
    await fetch(`/api/questions?id=${questionId}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setExpandedId(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: "rgba(255,179,0,0.15)", color: "#FFB300", label: "ממתין לתשובה" },
      answered: { bg: "rgba(0,200,83,0.15)", color: "#00C853", label: "נענה" },
      closed: { bg: "rgba(255,255,255,0.08)", color: "rgba(240,240,245,0.7)", label: "סגור" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען...</div>
    );
  }

  return (
    <div className="qa-page" style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .qa-page { padding: 16px !important; }
          .qa-page input, .qa-page select { min-width: 0 !important; width: 100% !important; }
        }
      `}</style>

      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <QuestionIcon size={24} /> שאלות ותשובות
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "24px", fontSize: "14px" }}>
        {isAdmin ? "כל השאלות מכל הקורסים — ענה, סמן כפתור, העבר למאגר" : "שאלות נפוצות עם תשובות מהצוות"}
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש שאלות..."
          style={{ flex: 1, minWidth: "200px", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }}
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }}
        >
          <option value="all">כל הקורסים</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {isAdmin && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }}
          >
            <option value="all">הכל</option>
            <option value="pending">ממתין</option>
            <option value="answered">נענה</option>
          </select>
        )}
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.7)" }}>
          <QuestionIcon size={48} color="rgba(240,240,245,0.15)" />
          <p style={{ marginTop: "16px", fontSize: "15px" }}>
            {isAdmin ? "אין שאלות חדשות!" : "אין שאלות ותשובות עדיין. שאל שאלה מתוך שיעור!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((q) => {
            const expanded = expandedId === q.id;
            const adminReplies = q.replies?.filter((r: Reply) => r.is_admin) || [];
            const userReplies = q.replies?.filter((r: Reply) => !r.is_admin) || [];
            const allReplies = q.replies || [];

            return (
              <div
                key={q.id}
                style={{
                  background: "#0a0a1a",
                  border: q.resolvedByAdmin ? "1px solid rgba(0,200,83,0.15)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  style={{ padding: "16px 20px", cursor: "pointer" }}
                >
                  {/* Course > Lesson context */}
                  {(q.courseName || q.lessonTitle) && (
                    <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.5)", marginBottom: "6px", display: "flex", alignItems: "center", gap: 4 }}>
                      {q.courseName && <span>{q.courseName}</span>}
                      {q.courseName && q.lessonTitle && <span>›</span>}
                      {q.lessonTitle && (
                        q.courseId && q.lessonId ? (
                          <Link
                            href={`/courses/${q.courseId}/lessons/${q.lessonId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "rgba(100,100,255,0.7)", textDecoration: "none" }}
                          >
                            {q.lessonTitle}
                          </Link>
                        ) : <span>{q.lessonTitle}</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {q.resolvedByAdmin && <CheckIcon size={14} color="#00C853" />}
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5", margin: 0, flex: 1 }}>{q.title}</h3>
                    {statusBadge(q.status)}
                  </div>

                  {!expanded && (
                    <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", margin: "4px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                      {q.description}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "rgba(240,240,245,0.5)", marginTop: 8 }}>
                    <span>{q.userName || "משתמש"}</span>
                    <span>{timeAgo(q.createdAt)}</span>
                    <span style={{ marginRight: "auto" }}>{allReplies.length} תגובות</span>
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.7, margin: "16px 0", whiteSpace: "pre-wrap" }}>
                      {q.description}
                    </p>

                    {/* Admin response (legacy) */}
                    {q.adminResponse && (
                      <div style={{ background: "rgba(0,0,255,0.06)", border: "1px solid rgba(0,0,255,0.15)", borderRadius: 4, padding: 14, marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#5555FF", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, background: "rgba(0,0,255,0.15)", padding: "1px 6px", borderRadius: 4 }}>מנהל</span>
                          תשובה
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{q.adminResponse}</p>
                      </div>
                    )}

                    {/* All replies */}
                    {allReplies.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,240,245,0.6)", margin: 0 }}>תגובות ({allReplies.length})</h4>
                        {allReplies.map((r: Reply) => (
                          <div key={r.id} style={{
                            background: r.is_admin ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${r.is_admin ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)"}`,
                            borderRadius: 4, padding: "12px 14px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: r.is_admin ? "#5555FF" : "#f0f0f5" }}>
                                {r.user_name || "משתמש"}
                              </span>
                              {r.is_admin && <span style={{ fontSize: 10, background: "rgba(0,0,255,0.15)", color: "#5555FF", padding: "1px 6px", borderRadius: 4 }}>מנהל</span>}
                              <span style={{ fontSize: 11, color: "rgba(240,240,245,0.4)" }}>{timeAgo(r.created_at)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {/* Reply form */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="כתוב תשובה כמנהל..."
                            style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,0,255,0.15)", borderRadius: 4, padding: "10px 14px", color: "#f0f0f5", fontSize: 13, outline: "none", resize: "vertical", minHeight: 60, fontFamily: "inherit" }}
                          />
                          <button
                            onClick={() => handleAdminReply(q.id)}
                            disabled={submitting}
                            style={{ background: "#0000FF", color: "white", padding: "10px 20px", borderRadius: 4, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-end" }}
                          >
                            {submitting ? "..." : "שלח"}
                          </button>
                        </div>

                        {/* Admin buttons */}
                        <div style={{ display: "flex", gap: 8 }}>
                          {!q.resolvedByAdmin && (
                            <button
                              onClick={() => handleResolve(q.id)}
                              style={{ background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)", color: "#00C853", padding: "6px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <CheckIcon size={12} color="#00C853" /> סמן כטופל
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(q.id)}
                            style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff6b6b", padding: "6px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                          >
                            מחק
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
