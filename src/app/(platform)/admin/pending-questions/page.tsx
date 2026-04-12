"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QuestionIcon, CheckIcon, TrashIcon } from "@/components/ui/icons";
import { useUser } from "@/hooks/useUser";

interface Reply {
  id: string;
  question_id: string;
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

export default function AdminPendingQuestionsPage() {
  const { profile } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"pending" | "answered" | "all">("pending");

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
    if (filter === "all") return questions;
    if (filter === "pending") return questions.filter((q) => q.status === "pending");
    return questions.filter((q) => q.status === "answered");
  }, [questions, filter]);

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  const handleReply = async (questionId: string) => {
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
      // Reload
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (Array.isArray(data)) setQuestions(data);
    } catch {}
    setSubmitting(false);
  };

  const handleResolve = async (id: string) => {
    await fetch("/api/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolvedByAdmin: true }),
    });
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, resolvedByAdmin: true } : q));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את השאלה?")) return;
    await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f5", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <QuestionIcon size={22} /> שאלות ממתינות
          {pendingCount > 0 && (
            <span style={{
              background: "#FF3D00", color: "white", fontSize: 12, fontWeight: 700,
              padding: "2px 8px", borderRadius: 10,
            }}>{pendingCount}</span>
          )}
        </h1>
        <div style={{ display: "flex", gap: 6 }}>
          {(["pending", "answered", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 4, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: filter === f ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)",
                color: filter === f ? "#5555FF" : "rgba(240,240,245,0.6)",
              }}
            >
              {f === "pending" ? "ממתינות" : f === "answered" ? "נענו" : "הכל"}
            </button>
          ))}
        </div>
      </div>
      <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 13, marginBottom: 24 }}>
        שאלות שנשאלו על ידי סטודנטים בשיעורים
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.5)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 15 }}>
            {filter === "pending" ? "אין שאלות ממתינות!" : "אין שאלות"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((q) => {
            const expanded = expandedId === q.id;
            const allReplies = q.replies || [];
            const statusColor = q.status === "pending" ? "#FFB300" : "#00C853";
            const statusLabel = q.status === "pending" ? "ממתין" : "נענה";

            return (
              <div
                key={q.id}
                style={{
                  background: "#0a0a1a",
                  border: `1px solid ${q.status === "pending" ? "rgba(255,179,0,0.15)" : "rgba(0,200,83,0.15)"}`,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div onClick={() => setExpandedId(expanded ? null : q.id)} style={{ padding: "14px 18px", cursor: "pointer" }}>
                  {/* Course > Lesson */}
                  {(q.courseName || q.lessonTitle) && (
                    <div style={{ fontSize: 11, color: "rgba(240,240,245,0.4)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      {q.courseName && <span>{q.courseName}</span>}
                      {q.courseName && q.lessonTitle && <span>›</span>}
                      {q.lessonTitle && q.courseId && q.lessonId ? (
                        <Link
                          href={`/courses/${q.courseId}/lessons/${q.lessonId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "rgba(100,100,255,0.7)", textDecoration: "none" }}
                        >
                          {q.lessonTitle}
                        </Link>
                      ) : q.lessonTitle ? <span>{q.lessonTitle}</span> : null}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0,
                    }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5", margin: 0, flex: 1 }}>{q.title}</h3>
                    <span style={{
                      background: `${statusColor}20`, color: statusColor,
                      padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    }}>{statusLabel}</span>
                  </div>

                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 6 }}>
                    <span>{q.userName || "משתמש"}</span>
                    {q.userEmail && <span>{q.userEmail}</span>}
                    <span>{timeAgo(q.createdAt)}</span>
                    {allReplies.length > 0 && <span style={{ marginRight: "auto" }}>{allReplies.length} תגובות</span>}
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)", lineHeight: 1.7, margin: "14px 0", whiteSpace: "pre-wrap" }}>
                      {q.description}
                    </p>

                    {/* Replies */}
                    {allReplies.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                        {allReplies.map((r) => (
                          <div key={r.id} style={{
                            background: r.is_admin ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${r.is_admin ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)"}`,
                            borderRadius: 4, padding: "10px 14px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: r.is_admin ? "#5555FF" : "#f0f0f5" }}>
                                {r.user_name || "משתמש"}
                              </span>
                              {r.is_admin && <span style={{ fontSize: 10, background: "rgba(0,0,255,0.15)", color: "#5555FF", padding: "1px 6px", borderRadius: 4 }}>מנהל</span>}
                              <span style={{ fontSize: 11, color: "rgba(240,240,245,0.3)" }}>{timeAgo(r.created_at)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="כתוב תשובה..."
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,0,255,0.15)",
                          borderRadius: 4, padding: "10px 14px", color: "#f0f0f5", fontSize: 13,
                          outline: "none", resize: "vertical", minHeight: 60, fontFamily: "inherit",
                        }}
                      />
                      <button
                        onClick={() => handleReply(q.id)}
                        disabled={submitting}
                        style={{
                          background: "#0000FF", color: "white", padding: "10px 20px",
                          borderRadius: 4, border: "none", fontWeight: 600, fontSize: 13,
                          cursor: "pointer", alignSelf: "flex-end",
                        }}
                      >
                        {submitting ? "..." : "שלח"}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {!q.resolvedByAdmin && (
                        <button
                          onClick={() => handleResolve(q.id)}
                          style={{
                            background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)",
                            color: "#00C853", padding: "6px 14px", borderRadius: 4,
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <CheckIcon size={12} color="#00C853" /> סמן כטופל
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(q.id)}
                        style={{
                          background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)",
                          color: "#ff6b6b", padding: "6px 14px", borderRadius: 4,
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <TrashIcon size={12} /> מחק
                      </button>
                    </div>
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
