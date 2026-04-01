"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadQuestions,
  saveQuestions,
  addQuestion,
  addAnswer,
  searchKnowledgeBase,
  addForumNotification,
  deleteQuestion,
  deleteAnswer,
  transferToKnowledgeBase,
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
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem("bldr_user_profile");
    if (raw) {
      const p = JSON.parse(raw);
      return { name: p.name || "משתמש", avatarUrl: p.avatarUrl || "", role: p.role || "student" };
    }
  } catch {}
  return { name: "משתמש", avatarUrl: "", role: "student" };
}

function Avatar({ src, name, size = 24 }: { src: string; name: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
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
        color: "#7777FF",
        flexShrink: 0,
      }}
    >
      {name.charAt(0)}
    </div>
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
    <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function countAllAnswers(answers: ForumAnswer[]): number {
  let count = 0;
  for (const a of answers) {
    count += 1;
    if (a.replies && a.replies.length > 0) count += countAllAnswers(a.replies);
  }
  return count;
}

function collectAllAnswerTexts(answers: ForumAnswer[]): string[] {
  const texts: string[] = [];
  for (const a of answers) {
    texts.push(a.content);
    if (a.replies && a.replies.length > 0) texts.push(...collectAllAnswerTexts(a.replies));
  }
  return texts;
}

/* ── Nested Answer Component ── */
function AnswerItem({
  answer,
  depth,
  questionId,
  isAdmin,
  onReply,
  onDeleteAnswer,
}: {
  answer: ForumAnswer;
  depth: number;
  questionId: string;
  isAdmin: boolean;
  onReply: (questionId: string, parentAnswerId: string, text: string) => void;
  onDeleteAnswer: (questionId: string, answerId: string) => void;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const maxDepth = 4;

  return (
    <div style={{ paddingRight: depth > 0 ? 16 : 0 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 4,
          padding: "8px 10px",
          marginTop: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Avatar src={answer.userAvatar} name={answer.userName} size={20} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700 }}>{answer.userName}</span>
          {answer.isAdmin && (
            <span
              style={{
                background: "rgba(0,0,255,0.15)",
                color: "#7777FF",
                padding: "0px 6px",
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              מנהל
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{timeAgo(answer.createdAt)}</span>
          {isAdmin && (
            <button
              onClick={() => onDeleteAnswer(questionId, answer.id)}
              style={{
                marginRight: "auto",
                background: "rgba(255,60,60,0.1)",
                border: "none",
                color: "rgba(255,80,80,0.7)",
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 4,
                padding: "1px 5px",
                lineHeight: 1,
              }}
              title="מחק תשובה"
            >
              ×
            </button>
          )}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {answer.content}
        </div>
        {depth < maxDepth && (
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(240,240,245,0.7)",
              fontSize: 10,
              cursor: "pointer",
              padding: "4px 0 0",
              fontWeight: 600,
            }}
          >
            הגב
          </button>
        )}
        {showReplyInput && (
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="כתוב תגובה..."
              style={{
                flex: 1,
                padding: "6px 8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "#f0f0f5",
                fontSize: 11,
                outline: "none",
                direction: "rtl",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyText.trim()) {
                  onReply(questionId, answer.id, replyText.trim());
                  setReplyText("");
                  setShowReplyInput(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (replyText.trim()) {
                  onReply(questionId, answer.id, replyText.trim());
                  setReplyText("");
                  setShowReplyInput(false);
                }
              }}
              style={{
                padding: "6px 10px",
                background: "#0000FF",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              שלח
            </button>
          </div>
        )}
      </div>
      {/* Nested replies */}
      {answer.replies &&
        answer.replies.map((r) => (
          <AnswerItem
            key={r.id}
            answer={r}
            depth={depth + 1}
            questionId={questionId}
            isAdmin={isAdmin}
            onReply={onReply}
            onDeleteAnswer={onDeleteAnswer}
          />
        ))}
    </div>
  );
}

/* ── Main Component ── */
export function LessonDiscussion({ courseId, lessonId, lessonTitle, courseName }: LessonDiscussionProps) {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "searching" | "found" | "success">("idle");
  const [kbAnswer, setKbAnswer] = useState("");
  const [kbTransferId, setKbTransferId] = useState<string | null>(null);
  const [kbEditQuestion, setKbEditQuestion] = useState("");
  const [kbEditAnswer, setKbEditAnswer] = useState("");
  const [kbSuccess, setKbSuccess] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const all = loadQuestions().filter((q) => q.courseId === courseId && q.lessonId === lessonId);
    setQuestions(all);
  }, [courseId, lessonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const user = getUserProfile();
  const isAdmin = user.role === "admin" || user.role === "Architect";

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMediaUrl("");
    setStep(1);
    setShowForm(false);
    setPhase("idle");
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    setPhase("searching");
    setShowForm(false);

    setTimeout(() => {
      const result = searchKnowledgeBase(title + " " + content);
      if (result) {
        setKbAnswer(result.answer);
        setPhase("found");
      } else {
        postQuestion();
      }
    }, 2000);
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
    // Track question_asked analytics event
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "question_asked",
        eventData: { lessonId, courseId },
        sessionId: typeof sessionStorage !== "undefined" ? sessionStorage.getItem("bldr_analytics_session") : null,
        pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      }),
    }).catch(() => {});
    setPhase("success");
    refresh();
    setTimeout(() => resetForm(), 2500);
  };

  const handleDirectAnswer = (questionId: string) => {
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
      isAdmin: user.role === "admin" || user.role === "Architect",
      replies: [],
    };
    addAnswer(questionId, answer);
    setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
    refresh();
  };

  const handleNestedReply = (questionId: string, parentAnswerId: string, text: string) => {
    const reply: ForumAnswer = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      userName: user.name,
      userAvatar: user.avatarUrl,
      content: text,
      mediaUrls: [],
      createdAt: new Date().toISOString(),
      isAdmin: user.role === "admin" || user.role === "Architect",
      replies: [],
    };
    addAnswer(questionId, reply, parentAnswerId);
    refresh();
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(questionId);
    if (expandedId === questionId) setExpandedId(null);
    refresh();
  };

  const handleDeleteAnswer = (questionId: string, answerId: string) => {
    deleteAnswer(questionId, answerId);
    refresh();
  };

  const handleOpenKbTransfer = (q: ForumQuestion) => {
    setKbTransferId(q.id);
    setKbEditQuestion(q.title + "\n" + q.content);
    setKbEditAnswer(collectAllAnswerTexts(q.answers).join("\n\n"));
  };

  const handleSubmitKbTransfer = () => {
    if (!kbTransferId) return;
    transferToKnowledgeBase(kbTransferId, kbEditQuestion, kbEditAnswer);
    setKbSuccess(kbTransferId);
    setKbTransferId(null);
    setTimeout(() => setKbSuccess(null), 2500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    color: "#f0f0f5",
    fontSize: 12,
    outline: "none",
    direction: "rtl",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "7px 14px",
    background: "#0000FF",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "7px 14px",
    background: "transparent",
    color: "rgba(240,240,245,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  };

  /* Step indicator dots */
  const StepDots = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s === step ? "#0000FF" : "rgba(255,255,255,0.15)",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={{ direction: "rtl", paddingBottom: 80 }}>
      <style>{`
        @keyframes searchPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,0,255,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,0,255,0.6); }
        }
        @keyframes searchSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 16px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f5" }}>דיון</span>
        {questions.length > 0 && (
          <span
            style={{
              background: "rgba(0,0,255,0.15)",
              color: "#7777FF",
              padding: "1px 7px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {questions.length}
          </span>
        )}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* ── Search Animation ── */}
        {phase === "searching" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: 12 }}>
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: "50%",
                  background: "rgba(0,0,255,0.3)",
                  animation: "searchPulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2px dashed rgba(0,0,255,0.6)",
                  animation: "searchSpin 2s linear infinite",
                }}
              />
            </div>
            <span style={{ color: "rgba(240,240,245,0.7)", fontSize: 12 }}>מחפש תשובה בבסיס הידע...</span>
          </div>
        )}

        {/* ── KB Answer Found ── */}
        {phase === "found" && (
          <div
            style={{
              background: "rgba(0,0,255,0.06)",
              border: "1px solid rgba(0,0,255,0.15)",
              borderRadius: 4,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7777FF", marginBottom: 6 }}>נמצאה תשובה בבסיס הידע</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, marginBottom: 10, whiteSpace: "pre-wrap" }}>
              {kbAnswer}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={resetForm} style={btnPrimary}>
                הבנתי, תודה!
              </button>
              <button onClick={postQuestion} style={btnSecondary}>
                שאל בכל זאת
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {phase === "success" && (
          <div
            style={{
              background: "rgba(0,200,83,0.06)",
              border: "1px solid rgba(0,200,83,0.15)",
              borderRadius: 4,
              textAlign: "center",
              padding: 14,
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#00C853", fontWeight: 700, fontSize: 12 }}>השאלה נשלחה בהצלחה!</span>
          </div>
        )}

        {/* ── Ask Button / Form ── */}
        {phase === "idle" && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              padding: "8px 0",
              background: "rgba(0,0,255,0.1)",
              color: "#7777FF",
              border: "1px solid rgba(0,0,255,0.2)",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              marginBottom: questions.length > 0 ? 12 : 0,
            }}
          >
            שאל שאלה
          </button>
        )}

        {/* ── Wizard Form ── */}
        {phase === "idle" && showForm && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 4,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <StepDots />

            {step === 1 && (
              <>
                <label style={{ fontSize: 11, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  כותרת השאלה
                </label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: איך עושים..." style={inputStyle} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 6 }}>
                  <button onClick={() => title.trim() && setStep(2)} style={{ ...btnPrimary, opacity: title.trim() ? 1 : 0.4 }}>
                    הבא
                  </button>
                  <button onClick={resetForm} style={btnSecondary}>
                    ביטול
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <label style={{ fontSize: 11, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  תאר את השאלה שלך
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="פרט כאן..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 6 }}>
                  <button onClick={() => content.trim() && setStep(3)} style={{ ...btnPrimary, opacity: content.trim() ? 1 : 0.4 }}>
                    הבא
                  </button>
                  <button onClick={() => setStep(1)} style={btnSecondary}>
                    חזרה
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <label style={{ fontSize: 11, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  קישור לתמונה או וידאו (אופציונלי)
                </label>
                <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  <button onClick={handleSubmit} style={btnPrimary}>
                    שלח שאלה
                  </button>
                  <button
                    onClick={() => {
                      setMediaUrl("");
                      handleSubmit();
                    }}
                    style={btnSecondary}
                  >
                    דלג ושלח
                  </button>
                  <button onClick={() => setStep(2)} style={btnSecondary}>
                    חזרה
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Questions List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map((q) => {
            const isExpanded = expandedId === q.id;
            const totalAnswers = countAllAnswers(q.answers);
            return (
              <div
                key={q.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  padding: 10,
                }}
              >
                {/* Collapsed header */}
                <div onClick={() => setExpandedId(isExpanded ? null : q.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Avatar src={q.userAvatar} name={q.userName} size={20} />
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>{q.userName}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{timeAgo(q.createdAt)}</span>
                    <div style={{ marginRight: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#f0f0f5" }}>{q.title}</span>
                    {totalAnswers > 0 && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{totalAnswers} תשובות</span>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 8 }}>
                      {q.content}
                    </div>

                    {/* Admin controls for question */}
                    {isAdmin && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          style={{
                            padding: "3px 8px",
                            background: "rgba(255,60,60,0.1)",
                            border: "1px solid rgba(255,60,60,0.2)",
                            borderRadius: 6,
                            color: "rgba(255,80,80,0.8)",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          מחק שאלה
                        </button>
                        <button
                          onClick={() => handleOpenKbTransfer(q)}
                          style={{
                            padding: "3px 8px",
                            background: "rgba(0,100,255,0.1)",
                            border: "1px solid rgba(0,100,255,0.2)",
                            borderRadius: 6,
                            color: "rgba(80,140,255,0.8)",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          העבר לבסיס ידע
                        </button>
                      </div>
                    )}

                    {/* KB Transfer inline form */}
                    {kbTransferId === q.id && (
                      <div
                        style={{
                          background: "rgba(0,100,255,0.05)",
                          border: "1px solid rgba(0,100,255,0.15)",
                          borderRadius: 4,
                          padding: 10,
                          marginBottom: 8,
                        }}
                      >
                        <label style={{ fontSize: 10, color: "rgba(240,240,245,0.7)", marginBottom: 4, display: "block" }}>שאלה</label>
                        <textarea
                          value={kbEditQuestion}
                          onChange={(e) => setKbEditQuestion(e.target.value)}
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical", minHeight: 40, marginBottom: 6 }}
                        />
                        <label style={{ fontSize: 10, color: "rgba(240,240,245,0.7)", marginBottom: 4, display: "block" }}>תשובה</label>
                        <textarea
                          value={kbEditAnswer}
                          onChange={(e) => setKbEditAnswer(e.target.value)}
                          rows={3}
                          style={{ ...inputStyle, resize: "vertical", minHeight: 50, marginBottom: 6 }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={handleSubmitKbTransfer} style={{ ...btnPrimary, fontSize: 10, padding: "5px 10px" }}>
                            שלח לבסיס הידע
                          </button>
                          <button onClick={() => setKbTransferId(null)} style={{ ...btnSecondary, fontSize: 10, padding: "5px 10px" }}>
                            ביטול
                          </button>
                        </div>
                      </div>
                    )}

                    {/* KB Transfer success */}
                    {kbSuccess === q.id && (
                      <div
                        style={{
                          background: "rgba(0,200,83,0.06)",
                          border: "1px solid rgba(0,200,83,0.15)",
                          borderRadius: 4,
                          textAlign: "center",
                          padding: 8,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ color: "#00C853", fontWeight: 700, fontSize: 11 }}>הועבר לבסיס הידע בהצלחה!</span>
                      </div>
                    )}

                    {/* Answers */}
                    {q.answers.map((a) => (
                      <AnswerItem
                        key={a.id}
                        answer={a}
                        depth={0}
                        questionId={q.id}
                        isAdmin={isAdmin}
                        onReply={handleNestedReply}
                        onDeleteAnswer={handleDeleteAnswer}
                      />
                    ))}

                    {/* Direct answer input */}
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <input
                        value={answerTexts[q.id] || ""}
                        onChange={(e) => setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="כתוב תגובה..."
                        style={{ ...inputStyle, flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDirectAnswer(q.id);
                        }}
                      />
                      <button onClick={() => handleDirectAnswer(q.id)} style={{ ...btnPrimary, padding: "7px 10px" }}>
                        שלח
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {questions.length === 0 && !showForm && phase === "idle" && (
          <p style={{ fontSize: 11, color: "rgba(240,240,245,0.7)", textAlign: "center", marginTop: 8 }}>
            אין שאלות עדיין לשיעור הזה
          </p>
        )}
      </div>
    </div>
  );
}
