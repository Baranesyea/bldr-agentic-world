"use client";

import { useState, useEffect, useCallback } from "react";
import { ShineBorder } from "@/components/ui/shine-border";
import {
  loadQuestions,
  addQuestion,
  addAnswer,
  addForumNotification,
  searchKnowledgeBase,
  type ForumQuestion,
  type ForumAnswer,
} from "@/lib/forum";

interface LessonDiscussionProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseName: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem("bldr_user_profile");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        name: p.name || "משתמש",
        avatarUrl: p.avatarUrl || "",
        role: p.role || "student",
      };
    }
  } catch {}
  return { name: "משתמש", avatarUrl: "", role: "student" };
}

function MediaRenderer({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}`}
        style={{
          width: "100%",
          maxWidth: 560,
          height: 315,
          borderRadius: 12,
          border: "none",
          marginTop: 8,
        }}
        allowFullScreen
      />
    );
  }
  if (isImageUrl(url)) {
    return (
      <img
        src={url}
        alt=""
        style={{
          maxWidth: "100%",
          borderRadius: 12,
          marginTop: 8,
        }}
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#3333FF", marginTop: 8, display: "inline-block" }}
    >
      {url}
    </a>
  );
}

function StatusBadge({ status }: { status: ForumQuestion["status"] }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: "ממתין", bg: "rgba(255,179,0,0.15)", color: "#FFB300" },
    answered: { label: "נענה", bg: "rgba(0,200,83,0.15)", color: "#00C853" },
    closed: { label: "סגור", bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ src, name, size = 32 }: { src: string; name: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(0,0,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.45,
        fontWeight: 700,
        color: "#3333FF",
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

export function LessonDiscussion({
  courseId,
  lessonId,
  lessonTitle,
  courseName,
}: LessonDiscussionProps) {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "searching" | "found" | "success">("idle");
  const [kbAnswer, setKbAnswer] = useState<string>("");

  const refresh = useCallback(() => {
    const all = loadQuestions().filter(
      (q) => q.courseId === courseId && q.lessonId === lessonId
    );
    setQuestions(all);
  }, [courseId, lessonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const user = getUserProfile();

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    setPhase("searching");

    setTimeout(() => {
      const result = searchKnowledgeBase(title + " " + content);
      if (result) {
        setKbAnswer(result.answer);
        setPhase("found");
      } else {
        postQuestion();
      }
    }, 1500);
  };

  const postQuestion = () => {
    const q: ForumQuestion = {
      id: crypto.randomUUID(),
      courseId,
      lessonId,
      lessonTitle,
      courseName,
      userId: crypto.randomUUID(),
      userName: user.name,
      userAvatar: user.avatarUrl,
      title: title.trim(),
      content: content.trim(),
      mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
      createdAt: new Date().toISOString(),
      status: "pending",
      answers: [],
    };
    addQuestion(q);
    addForumNotification(q.title, lessonTitle);
    setTitle("");
    setContent("");
    setMediaUrl("");
    setPhase("success");
    refresh();
    setTimeout(() => setPhase("idle"), 2500);
  };

  const handleAnswer = (questionId: string) => {
    const text = answerTexts[questionId]?.trim();
    if (!text) return;
    const answer: ForumAnswer = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      userName: user.name,
      userAvatar: user.avatarUrl,
      content: text,
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      isAdmin: user.role === "admin",
    };
    addAnswer(questionId, answer);
    setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
    refresh();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#f0f0f5",
    fontSize: 14,
    outline: "none",
    direction: "rtl",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 24px",
    background: "#0000FF",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div style={{ direction: "rtl", marginTop: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>
          דיון
        </h3>
        <span
          style={{
            background: "rgba(0,0,255,0.15)",
            color: "#3333FF",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {questions.length}
        </span>
      </div>

      {/* Ask Form */}
      {phase === "idle" && (
        <div style={{ ...cardStyle, marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת השאלה"
            style={inputStyle}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="תאר את השאלה שלך..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="קישור לתמונה או וידאו (אופציונלי)"
            style={inputStyle}
          />
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button onClick={handleSubmit} style={btnPrimary}>
              שלח שאלה
            </button>
          </div>
        </div>
      )}

      {/* Searching */}
      {phase === "searching" && (
        <div style={{ marginBottom: 24 }}>
          <ShineBorder
            borderRadius={16}
            borderWidth={2}
            color={["#0000FF", "#3333FF", "#6666FF"]}
          >
            <div
              style={{
                ...cardStyle,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#3333FF",
                  animation: "pulse-blue 1.5s infinite",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
                מחפש תשובה בבסיס הידע...
              </span>
            </div>
          </ShineBorder>
        </div>
      )}

      {/* KB Answer Found */}
      {phase === "found" && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 24,
            background: "rgba(0,0,255,0.06)",
            border: "1px solid rgba(0,0,255,0.15)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3333FF", marginBottom: 8 }}>
            נמצאה תשובה בבסיס הידע
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>
            {kbAnswer}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setTitle("");
                setContent("");
                setMediaUrl("");
                setPhase("idle");
              }}
              style={btnPrimary}
            >
              הבנתי, תודה!
            </button>
            <button
              onClick={postQuestion}
              style={{
                ...btnPrimary,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              שאל בכל זאת
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {phase === "success" && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 24,
            background: "rgba(0,200,83,0.06)",
            border: "1px solid rgba(0,200,83,0.15)",
            textAlign: "center",
            padding: 20,
          }}
        >
          <span style={{ color: "#00C853", fontWeight: 700, fontSize: 15 }}>
            השאלה נשלחה בהצלחה!
          </span>
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q) => {
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} style={cardStyle}>
              {/* Question Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Avatar src={q.userAvatar} name={q.userName} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700 }}>
                    {q.userName}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                    {timeAgo(q.createdAt)}
                  </span>
                  <div style={{ marginRight: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <StatusBadge status={q.status} />
                    {q.answers.length > 0 && (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {q.answers.length} תשובות
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f5", marginBottom: 4 }}>
                  {q.title}
                </div>
                {!isExpanded && (
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {q.content}
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {q.content}
                  </div>
                  {q.mediaUrls.map((url, i) => (
                    <MediaRenderer key={i} url={url} />
                  ))}

                  {/* Answers */}
                  {q.answers.length > 0 && (
                    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      {q.answers.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 12,
                            padding: 14,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Avatar src={a.userAvatar} name={a.userName} size={26} />
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700 }}>
                              {a.userName}
                            </span>
                            {a.isAdmin && (
                              <span
                                style={{
                                  background: "rgba(0,0,255,0.15)",
                                  color: "#3333FF",
                                  padding: "1px 8px",
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                מנהל
                              </span>
                            )}
                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                              {timeAgo(a.createdAt)}
                            </span>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {a.content}
                          </div>
                          {a.mediaUrls.map((url, i) => (
                            <MediaRenderer key={i} url={url} />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Input */}
                  <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                    <textarea
                      value={answerTexts[q.id] || ""}
                      onChange={(e) =>
                        setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="כתוב תשובה..."
                      rows={2}
                      style={{ ...inputStyle, flex: 1, resize: "vertical" }}
                    />
                    <button
                      onClick={() => handleAnswer(q.id)}
                      style={{
                        ...btnPrimary,
                        padding: "10px 16px",
                        alignSelf: "flex-end",
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
    </div>
  );
}
