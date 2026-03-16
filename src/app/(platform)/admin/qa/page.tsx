"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuestionIcon } from "@/components/ui/icons";
import {
  loadQuestions,
  saveQuestions,
  addAnswer,
  updateQuestionStatus,
  transferToKnowledgeBase,
  type ForumQuestion,
} from "@/lib/forum";

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

const KB_CATEGORIES = ["כללי", "טכני", "קורסים", "חשבון", "תשלומים", "אחר"];

export default function AdminQAPage() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [kbOpen, setKbOpen] = useState<string | null>(null);
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbAnswer, setKbAnswer] = useState("");
  const [kbCategory, setKbCategory] = useState("כללי");
  const [kbTags, setKbTags] = useState("");
  const [kbSuccess, setKbSuccess] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const reload = () => setQuestions(loadQuestions());

  useEffect(() => {
    reload();
    try {
      const stored = JSON.parse(localStorage.getItem("bldr_courses") || "[]");
      setCourses(stored.map((c: { id: string; name?: string; title?: string }) => ({ id: c.id, name: c.name || c.title || c.id })));
    } catch {}
  }, []);

  // Auto-expand pending questions
  useEffect(() => {
    const pending = new Set(questions.filter((q) => q.status === "pending").map((q) => q.id));
    setExpandedIds((prev) => new Set([...prev, ...pending]));
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search) {
        const s = search.toLowerCase();
        if (!q.title.toLowerCase().includes(s) && !q.content.toLowerCase().includes(s)) return false;
      }
      if (courseFilter !== "all" && q.courseId !== courseFilter) return false;
      if (statusTab !== "all" && q.status !== statusTab) return false;
      return true;
    });
  }, [questions, search, courseFilter, statusTab]);

  const totalCount = questions.length;
  const pendingCount = questions.filter((q) => q.status === "pending").length;

  const handleAnswer = (questionId: string) => {
    const text = answerTexts[questionId]?.trim();
    if (!text) return;
    let userName = "מנהל";
    let userAvatar = "";
    let userId = "admin";
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_user_profile") || "{}");
      userName = profile.name || profile.displayName || "מנהל";
      userAvatar = profile.avatar || profile.photoURL || "";
      userId = profile.id || profile.uid || "admin";
    } catch {}
    addAnswer(questionId, {
      id: `ans-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      content: text,
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      isAdmin: true,
      replies: [],
    });
    setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
    reload();
  };

  const handleStatusChange = (questionId: string, status: "pending" | "answered" | "closed") => {
    updateQuestionStatus(questionId, status);
    reload();
  };

  const handleDelete = (questionId: string) => {
    const updated = questions.filter((q) => q.id !== questionId);
    saveQuestions(updated);
    reload();
  };

  const openKbTransfer = (q: ForumQuestion) => {
    setKbOpen(q.id);
    setKbQuestion(q.title + "\n" + q.content);
    const adminAnswer = q.answers?.find((a) => a.isAdmin);
    setKbAnswer(adminAnswer?.content || q.answers?.[0]?.content || "");
    setKbCategory("כללי");
    setKbTags("");
    setKbSuccess(null);
  };

  const handleKbTransfer = (questionId: string) => {
    transferToKnowledgeBase(questionId, kbQuestion, kbAnswer);
    setKbSuccess(questionId);
    setKbOpen(null);
    setTimeout(() => setKbSuccess(null), 3000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const tabs = [
    { key: "all", label: "הכל" },
    { key: "pending", label: "ממתין" },
    { key: "answered", label: "נענה" },
    { key: "closed", label: "סגור" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <QuestionIcon size={24} /> ניהול שאלות
        </h1>
      </div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>
        <span>{totalCount} שאלות סה&quot;כ</span>
        <span>{pendingCount} ממתינות</span>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            style={{
              padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 600,
              background: statusTab === t.key ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)",
              color: statusTab === t.key ? "#5555FF" : "rgba(240,240,245,0.5)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

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
          style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px", outline: "none", cursor: "pointer" }}
        >
          <option value="all">כל הקורסים</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Questions */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.35)" }}>
          <p style={{ fontSize: "15px" }}>אין שאלות להצגה</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((q) => {
            const expanded = expandedIds.has(q.id);
            return (
              <div
                key={q.id}
                style={{
                  background: "#0a0a1a",
                  border: `1px solid ${q.status === "pending" ? "rgba(255,179,0,0.15)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => toggleExpand(q.id)}
                  style={{ padding: "20px", cursor: "pointer" }}
                >
                  <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)", marginBottom: "6px" }}>
                    {q.courseName} &gt; {q.lessonTitle}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {q.userAvatar ? (
                        <img src={q.userAvatar} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
                      ) : (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#12122a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "rgba(240,240,245,0.6)" }}>
                          {q.userName?.[0] || "?"}
                        </div>
                      )}
                      <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)" }}>{q.userName}</span>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5", margin: 0 }}>{q.title}</h3>
                    {statusBadge(q.status)}
                    <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.3)", marginRight: "auto" }}>{timeAgo(q.createdAt)}</span>
                  </div>
                </div>

                {expanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.7, margin: "16px 0", whiteSpace: "pre-wrap" }}>
                      {q.content}
                    </p>

                    {/* Media */}
                    {q.mediaUrls?.map((url, i) => (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        {isYouTubeUrl(url) ? (
                          <iframe src={getYouTubeEmbedUrl(url)} style={{ width: "100%", height: "360px", borderRadius: "4px", border: "none" }} allowFullScreen />
                        ) : isImageUrl(url) ? (
                          <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: "4px" }} />
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#5555FF", fontSize: "13px" }}>{url}</a>
                        )}
                      </div>
                    ))}

                    {/* Status change + Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value as "pending" | "answered" | "closed")}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "6px 12px", color: "#f0f0f5", fontSize: "12px", outline: "none", cursor: "pointer" }}
                      >
                        <option value="pending">ממתין</option>
                        <option value="answered">נענה</option>
                        <option value="closed">סגור</option>
                      </select>
                      <button
                        onClick={() => handleDelete(q.id)}
                        style={{ background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "1px solid rgba(255,61,0,0.2)", borderRadius: "4px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                      >
                        מחק
                      </button>
                      {(q.status === "answered" || (q.answers && q.answers.length > 0)) && kbOpen !== q.id && (
                        <button
                          onClick={() => openKbTransfer(q)}
                          style={{ background: "rgba(0,200,83,0.1)", color: "#00C853", border: "1px solid rgba(0,200,83,0.2)", borderRadius: "4px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                          העבר לבסיס ידע
                        </button>
                      )}
                      {kbSuccess === q.id && (
                        <span style={{ fontSize: "12px", color: "#00C853", fontWeight: 600 }}>הועבר לבסיס הידע בהצלחה</span>
                      )}
                    </div>

                    {/* KB Transfer form */}
                    {kbOpen === q.id && (
                      <div style={{ background: "rgba(0,200,83,0.04)", border: "1px solid rgba(0,200,83,0.12)", borderRadius: "4px", padding: "16px", marginBottom: "16px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#00C853", margin: "0 0 12px" }}>העברה לבסיס ידע</h4>
                        <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "4px" }}>שאלה</label>
                        <textarea
                          value={kbQuestion}
                          onChange={(e) => setKbQuestion(e.target.value)}
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px", color: "#f0f0f5", fontSize: "13px", outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit", marginBottom: "12px", boxSizing: "border-box" }}
                        />
                        <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "4px" }}>תשובה</label>
                        <textarea
                          value={kbAnswer}
                          onChange={(e) => setKbAnswer(e.target.value)}
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "10px", color: "#f0f0f5", fontSize: "13px", outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit", marginBottom: "12px", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                          <div>
                            <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "4px" }}>קטגוריה</label>
                            <select
                              value={kbCategory}
                              onChange={(e) => setKbCategory(e.target.value)}
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "6px 12px", color: "#f0f0f5", fontSize: "12px", outline: "none", cursor: "pointer" }}
                            >
                              {KB_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex: 1, minWidth: "150px" }}>
                            <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "4px" }}>תגיות (מופרדות בפסיק)</label>
                            <input
                              value={kbTags}
                              onChange={(e) => setKbTags(e.target.value)}
                              placeholder="תגית1, תגית2"
                              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "6px 10px", color: "#f0f0f5", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleKbTransfer(q.id)}
                            style={{ background: "#00C853", color: "white", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                          >
                            אשר והעבר
                          </button>
                          <button
                            onClick={() => setKbOpen(null)}
                            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "8px 18px", fontSize: "13px", cursor: "pointer" }}
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing answers */}
                    {q.answers && q.answers.length > 0 && (
                      <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(240,240,245,0.5)", margin: 0 }}>תשובות ({q.answers.length})</h4>
                        {q.answers.map((a) => (
                          <div key={a.id} style={{ background: a.isAdmin ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${a.isAdmin ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.04)"}`, borderRadius: "4px", padding: "14px" }}>
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
                                  <iframe src={getYouTubeEmbedUrl(url)} style={{ width: "100%", height: "300px", borderRadius: "4px", border: "none" }} allowFullScreen />
                                ) : isImageUrl(url) ? (
                                  <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: "4px" }} />
                                ) : (
                                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#5555FF", fontSize: "12px" }}>{url}</a>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin answer form */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <textarea
                        value={answerTexts[q.id] || ""}
                        onChange={(e) => setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="כתוב תשובה כמנהל..."
                        style={{
                          flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px", padding: "10px 14px", color: "#f0f0f5", fontSize: "13px",
                          outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit",
                        }}
                      />
                      <button
                        onClick={() => handleAnswer(q.id)}
                        style={{
                          background: "#0000FF", color: "white", padding: "10px 20px", borderRadius: "4px",
                          border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", alignSelf: "flex-end",
                        }}
                      >
                        שלח תשובה
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
