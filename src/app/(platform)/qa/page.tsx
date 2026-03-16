"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuestionIcon } from "@/components/ui/icons";
import { loadQuestions, addAnswer, type ForumQuestion } from "@/lib/forum";

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

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function QAPage() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setQuestions(loadQuestions());
    try {
      const stored = JSON.parse(localStorage.getItem("bldr_courses") || "[]");
      setCourses(stored.map((c: { id: string; name?: string; title?: string }) => ({ id: c.id, name: c.name || c.title || c.id })));
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search) {
        const s = search.toLowerCase();
        if (!q.title.toLowerCase().includes(s) && !q.content.toLowerCase().includes(s)) return false;
      }
      if (courseFilter !== "all" && q.courseId !== courseFilter) return false;
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      return true;
    });
  }, [questions, search, courseFilter, statusFilter]);

  const handleAnswer = (questionId: string) => {
    if (!answerText.trim()) return;
    let userName = "משתמש";
    let userAvatar = "";
    let userId = "anonymous";
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_user_profile") || "{}");
      userName = profile.name || profile.displayName || "משתמש";
      userAvatar = profile.avatar || profile.photoURL || "";
      userId = profile.id || profile.uid || "anonymous";
    } catch {}
    addAnswer(questionId, {
      id: `ans-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      content: answerText.trim(),
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      isAdmin: false,
      replies: [],
    });
    setAnswerText("");
    setQuestions(loadQuestions());
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: "rgba(51,51,255,0.15)", color: "#5555FF", label: "ממתין" },
      answered: { bg: "rgba(0,200,83,0.15)", color: "#00C853", label: "נענה" },
      closed: { bg: "rgba(255,255,255,0.08)", color: "rgba(240,240,245,0.5)", label: "סגור" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <QuestionIcon size={24} /> שאלות ותשובות
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "24px", fontSize: "14px" }}>
        כל השאלות מכל הקורסים — שאל, ענה, למד
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש שאלות..."
          style={{ flex: 1, minWidth: "200px", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none" }}
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none", cursor: "pointer" }}
        >
          <option value="all">כל הקורסים</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none", cursor: "pointer" }}
        >
          <option value="all">הכל</option>
          <option value="pending">ממתין</option>
          <option value="answered">נענה</option>
          <option value="closed">סגור</option>
        </select>
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.35)" }}>
          <QuestionIcon size={48} color="rgba(240,240,245,0.15)" />
          <p style={{ marginTop: "16px", fontSize: "15px" }}>אין שאלות עדיין. שאל את השאלה הראשונה מתוך שיעור!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((q) => {
            const expanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                style={{
                  background: "#0a0a1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Collapsed card */}
                <div
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  style={{ padding: "20px", cursor: "pointer" }}
                >
                  <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "6px" }}>
                    {q.courseName} &gt; {q.lessonTitle}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5", margin: 0 }}>{q.title}</h3>
                    {statusBadge(q.status)}
                  </div>
                  {!expanded && (
                    <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", margin: "0 0 8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {q.content}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {q.userAvatar ? (
                        <img src={q.userAvatar} alt="" style={{ width: 20, height: 20, borderRadius: "50%" }} />
                      ) : (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#12122a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "rgba(240,240,245,0.6)" }}>
                          {q.userName?.[0] || "?"}
                        </div>
                      )}
                      <span>{q.userName}</span>
                    </div>
                    <span>{timeAgo(q.createdAt)}</span>
                    <span style={{ marginRight: "auto" }}>{q.answers?.length || 0} תשובות</span>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.7, margin: "16px 0" }}>
                      {q.content}
                    </p>

                    {/* Media */}
                    {q.mediaUrls?.map((url, i) => (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        {isYouTubeUrl(url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(url)}
                            style={{ width: "100%", height: "360px", borderRadius: "10px", border: "none" }}
                            allowFullScreen
                          />
                        ) : isImageUrl(url) ? (
                          <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: "10px" }} />
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#5555FF", fontSize: "13px" }}>{url}</a>
                        )}
                      </div>
                    ))}

                    {/* Answers */}
                    {q.answers && q.answers.length > 0 && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.5)", margin: 0 }}>תשובות ({q.answers.length})</h4>
                        {q.answers.map((a) => (
                          <div key={a.id} style={{ background: a.isAdmin ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${a.isAdmin ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)"}`, borderRadius: "10px", padding: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              {a.userAvatar ? (
                                <img src={a.userAvatar} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
                              ) : (
                                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#12122a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "rgba(240,240,245,0.6)" }}>
                                  {a.userName?.[0] || "?"}
                                </div>
                              )}
                              <span style={{ fontSize: "13px", fontWeight: 600, color: a.isAdmin ? "#5555FF" : "#f0f0f5" }}>{a.userName}</span>
                              {a.isAdmin && <span style={{ fontSize: "10px", background: "rgba(0,0,255,0.15)", color: "#5555FF", padding: "1px 6px", borderRadius: "4px" }}>מנהל</span>}
                              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.3)" }}>{timeAgo(a.createdAt)}</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.65)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{a.content}</p>
                            {a.mediaUrls?.map((url, i) => (
                              <div key={i} style={{ marginTop: "8px" }}>
                                {isYouTubeUrl(url) ? (
                                  <iframe src={getYouTubeEmbedUrl(url)} style={{ width: "100%", height: "300px", borderRadius: "8px", border: "none" }} allowFullScreen />
                                ) : isImageUrl(url) ? (
                                  <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                                ) : (
                                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#5555FF", fontSize: "12px" }}>{url}</a>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer form */}
                    <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="כתוב תשובה..."
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "10px", padding: "10px 14px", color: "#f0f0f5", fontSize: "13px",
                          outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit",
                        }}
                      />
                      <button
                        onClick={() => handleAnswer(q.id)}
                        style={{
                          background: "#0000FF", color: "white", padding: "10px 20px", borderRadius: "10px",
                          border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", alignSelf: "flex-end",
                        }}
                      >
                        שלח
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
