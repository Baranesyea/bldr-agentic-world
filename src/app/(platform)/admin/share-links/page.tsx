"use client";

import { useState, useEffect } from "react";

interface ShareLink {
  id: string;
  name: string;
  code: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  videoUrl: string;
  createdAt: string;
  uses: number;
  status: "active" | "disabled";
}

interface Course {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    lessons: Array<{ id: string; title: string; videoUrl: string }>;
  }>;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export default function ShareLinksPage() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bldr_share_links");
    if (stored) setLinks(JSON.parse(stored));

    const coursesStored = localStorage.getItem("bldr_courses");
    if (coursesStored) setCourses(JSON.parse(coursesStored));
  }, []);

  const save = (updated: ShareLink[]) => {
    setLinks(updated);
    localStorage.setItem("bldr_share_links", JSON.stringify(updated));
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const allLessons = selectedCourse?.chapters.flatMap(ch => ch.lessons) ?? [];
  const selectedLesson = allLessons.find(l => l.id === selectedLessonId);

  const handleGenerate = () => {
    if (!name.trim() || !selectedCourseId || !selectedLessonId || !selectedLesson) return;
    const code = generateCode();
    const newLink: ShareLink = {
      id: Date.now().toString(),
      name: name.trim(),
      code,
      courseId: selectedCourseId,
      lessonId: selectedLessonId,
      lessonTitle: selectedLesson.title,
      videoUrl: selectedLesson.videoUrl,
      createdAt: new Date().toISOString(),
      uses: 0,
      status: "active",
    };
    save([newLink, ...links]);
    const url = `${window.location.origin}/watch/${code}`;
    setGeneratedLink(url);
    setName("");
    setSelectedCourseId("");
    setSelectedLessonId("");
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/watch/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleStatus = (id: string) => {
    save(links.map(l => l.id === id ? { ...l, status: l.status === "active" ? "disabled" : "active" } : l));
  };

  const deleteLink = (id: string) => {
    save(links.filter(l => l.id !== id));
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "24px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const canGenerate = name.trim() && selectedCourseId && selectedLessonId;

  return (
    <div style={{ padding: "32px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
        קישורי שיתוף סרטונים
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", fontSize: "14px", marginBottom: "32px" }}>
        צור קישורי שיתוף שמאפשרים גישה לסרטון ספציפי ללידים חיצוניים
      </p>

      {/* Create Link Form */}
      <div style={{ ...cardStyle, marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "20px" }}>צור קישור חדש</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "6px" }}>
              שם הקמפיין
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="לדוגמה: פייסבוק אפריל 2026"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "6px" }}>
              קורס
            </label>
            <select
              value={selectedCourseId}
              onChange={e => { setSelectedCourseId(e.target.value); setSelectedLessonId(""); }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">בחר קורס...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {selectedCourseId && (
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "6px" }}>
                שיעור
              </label>
              <select
                value={selectedLessonId}
                onChange={e => setSelectedLessonId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">בחר שיעור...</option>
                {selectedCourse?.chapters.map(ch => (
                  <optgroup key={ch.id} label={ch.title}>
                    {ch.lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              padding: "12px 24px", borderRadius: "4px", border: "none",
              background: canGenerate ? "#0000FF" : "rgba(0,0,255,0.3)",
              color: "#fff", fontSize: "14px", fontWeight: 600,
              cursor: canGenerate ? "pointer" : "not-allowed",
              alignSelf: "flex-start",
            }}
          >
            צור קישור
          </button>

          {generatedLink && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 16px", borderRadius: "4px",
              background: "rgba(0,0,255,0.08)", border: "1px solid rgba(0,0,255,0.2)",
            }}>
              <span style={{ flex: 1, color: "rgba(240,240,245,0.8)", fontSize: "13px", wordBreak: "break-all" }}>
                {generatedLink}
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedLink); setCopied("new"); setTimeout(() => setCopied(null), 2000); }}
                style={{
                  padding: "6px 14px", borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)", color: "#fff",
                  fontSize: "12px", cursor: "pointer", flexShrink: 0,
                }}
              >
                {copied === "new" ? "הועתק!" : "העתק"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Links Table */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "20px" }}>קישורים פעילים</h2>

        {links.length === 0 ? (
          <p style={{ color: "rgba(240,240,245,0.35)", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>
            אין קישורי שיתוף עדיין. צור אחד למעלה.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["שם", "שיעור", "קוד", "נוצר", "שימושים", "סטטוס", "פעולות"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "right", color: "rgba(240,240,245,0.35)", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px", color: "#fff" }}>{link.name}</td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {link.lessonTitle}
                    </td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)", fontFamily: "monospace" }}>{link.code}</td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)", whiteSpace: "nowrap" }}>
                      {new Date(link.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td style={{ padding: "12px", color: "rgba(240,240,245,0.6)" }}>{link.uses}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "6px",
                        fontSize: "11px", fontWeight: 600,
                        background: link.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: link.status === "active" ? "#22c55e" : "#ef4444",
                      }}>
                        {link.status === "active" ? "פעיל" : "מושבת"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => copyLink(link.code)} style={{
                          padding: "4px 10px", borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.6)",
                          fontSize: "11px", cursor: "pointer",
                        }}>
                          {copied === link.code ? "הועתק!" : "העתק"}
                        </button>
                        <button onClick={() => toggleStatus(link.id)} style={{
                          padding: "4px 10px", borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.6)",
                          fontSize: "11px", cursor: "pointer",
                        }}>
                          {link.status === "active" ? "השבת" : "הפעל"}
                        </button>
                        <button onClick={() => deleteLink(link.id)} style={{
                          padding: "4px 10px", borderRadius: "6px",
                          border: "1px solid rgba(239,68,68,0.2)",
                          background: "rgba(239,68,68,0.08)", color: "#ef4444",
                          fontSize: "11px", cursor: "pointer",
                        }}>
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
