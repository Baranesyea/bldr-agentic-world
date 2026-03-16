"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SearchIcon, PlusIcon, TrashIcon, EditIcon, CopyIcon, ChevronDownIcon, CheckIcon, ImportIcon } from "@/components/ui/icons";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: "manual" | "from_user_question";
}

const STORAGE_KEY = "bldr_knowledge_base";
const CATEGORIES = ["כללי", "טכני", "קורסים", "חשבון", "תשלומים", "אחר"];

const CATEGORY_COLORS: Record<string, string> = {
  "כללי": "rgba(255,255,255,0.2)",
  "טכני": "#0000FF",
  "קורסים": "#7B2FFF",
  "חשבון": "#00C853",
  "תשלומים": "#FFB300",
  "אחר": "rgba(240,240,245,0.3)",
};

const SAMPLE_ENTRIES: KBEntry[] = [
  {
    id: "sample-1",
    question: "איך מאפסים סיסמה?",
    answer: "יש ללחוץ על \"שכחתי סיסמה\" בדף ההתחברות. מייל עם קישור לאיפוס יישלח לכתובת המייל הרשומה. הקישור תקף ל-24 שעות.",
    category: "חשבון",
    tags: ["סיסמה", "התחברות"],
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
    source: "manual",
  },
  {
    id: "sample-2",
    question: "איך ניגשים לקורסים?",
    answer: "לאחר ההתחברות, יש ללחוץ על \"קורסים\" בתפריט הצדדי. הקורסים הזמינים יופיעו ברשימה. יש ללחוץ על הקורס הרצוי כדי להתחיל ללמוד.",
    category: "קורסים",
    tags: ["קורסים", "גישה"],
    createdAt: "2026-03-10T11:00:00Z",
    updatedAt: "2026-03-10T11:00:00Z",
    source: "manual",
  },
  {
    id: "sample-3",
    question: "אילו אמצעי תשלום מתקבלים?",
    answer: "אנחנו מקבלים כרטיסי אשראי (ויזה, מאסטרקארד, אמריקן אקספרס), PayPal, והעברה בנקאית. ניתן לשלם בתשלומים עד 12 תשלומים.",
    category: "תשלומים",
    tags: ["תשלום", "כרטיס אשראי"],
    createdAt: "2026-03-11T09:00:00Z",
    updatedAt: "2026-03-11T09:00:00Z",
    source: "manual",
  },
  {
    id: "sample-4",
    question: "איך מגישים מטלות?",
    answer: "בכל שיעור שיש בו מטלה, יופיע כפתור \"הגש מטלה\" בתחתית העמוד. ניתן להעלות קבצים (PDF, Word, תמונות) או לכתוב טקסט ישירות. המרצה יקבל התראה ויבדוק את המטלה.",
    category: "קורסים",
    tags: ["מטלות", "הגשה"],
    createdAt: "2026-03-12T14:00:00Z",
    updatedAt: "2026-03-12T14:00:00Z",
    source: "from_user_question",
  },
  {
    id: "sample-5",
    question: "איך יוצרים קשר עם התמיכה?",
    answer: "ניתן לפנות אלינו דרך הצ׳אט בפלטפורמה (אייקון הצ׳אט בתפריט), דרך מייל support@bldr.co.il, או בטלפון 03-1234567 בימים א-ה בין 9:00-17:00.",
    category: "כללי",
    tags: ["תמיכה", "יצירת קשר"],
    createdAt: "2026-03-13T08:00:00Z",
    updatedAt: "2026-03-13T08:00:00Z",
    source: "manual",
  },
  {
    id: "sample-6",
    question: "איך מקבלים תעודת סיום קורס?",
    answer: "תעודת סיום מונפקת אוטומטית לאחר צפייה ב-100% מהשיעורים והגשת כל המטלות. ניתן להוריד את התעודה מדף הפרופיל תחת \"התעודות שלי\".",
    category: "קורסים",
    tags: ["תעודה", "סיום"],
    createdAt: "2026-03-14T16:00:00Z",
    updatedAt: "2026-03-14T16:00:00Z",
    source: "from_user_question",
  },
];

function genId() {
  return "kb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function loadEntries(): KBEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ENTRIES));
    return SAMPLE_ENTRIES;
  }
  try { return JSON.parse(raw); } catch { return []; }
}

function saveEntries(entries: KBEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // Quick add form
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("כללי");
  const [customCategory, setCustomCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);

  // Search/filter
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("הכל");
  const [sort, setSort] = useState<"newest" | "alpha" | "updated">("newest");

  // Expand/edit state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk import
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    setMounted(true);
  }, []);

  const persist = useCallback((next: KBEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  // Stats
  const allCategories = useMemo(() => [...new Set(entries.map(e => e.category))], [entries]);
  const lastUpdated = useMemo(() => {
    if (!entries.length) return null;
    return entries.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b).updatedAt;
  }, [entries]);

  // Filtered/sorted
  const filtered = useMemo(() => {
    let list = entries;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => e.question.toLowerCase().includes(s) || e.answer.toLowerCase().includes(s));
    }
    if (filterCat !== "הכל") {
      list = list.filter(e => e.category === filterCat);
    }
    if (sort === "newest") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "alpha") list = [...list].sort((a, b) => a.question.localeCompare(b.question));
    else list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return list;
  }, [entries, search, filterCat, sort]);

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) return;
    const cat = category === "__custom" ? customCategory.trim() || "אחר" : category;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const entry: KBEntry = { id: genId(), question: question.trim(), answer: answer.trim(), category: cat, tags, createdAt: now, updatedAt: now, source: "manual" };
    persist([entry, ...entries]);
    setQuestion(""); setAnswer(""); setTagsInput(""); setCategory("כללי"); setCustomCategory("");
    setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 2000);
  };

  const handleDelete = (id: string) => {
    persist(entries.filter(e => e.id !== id));
    setDeleteConfirm(null);
  };

  const handleEditSave = (id: string) => {
    persist(entries.map(e => e.id === id ? { ...e, question: editQ, answer: editA, updatedAt: new Date().toISOString() } : e));
    setEditingId(null);
  };

  const handleCopy = async (entry: KBEntry) => {
    const text = `שאלה: ${entry.question}\nתשובה: ${entry.answer}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const parseBulk = (text: string) => {
    const blocks = text.split(/\n\n+/);
    const results: { q: string; a: string }[] = [];
    for (const block of blocks) {
      const qMatch = block.match(/^ש:\s*(.+)/m);
      const aMatch = block.match(/^ת:\s*(.+)/m);
      if (qMatch && aMatch) results.push({ q: qMatch[1].trim(), a: aMatch[1].trim() });
    }
    return results;
  };

  const handleBulkImport = () => {
    const parsed = parseBulk(bulkText);
    if (!parsed.length) return;
    const now = new Date().toISOString();
    const newEntries = parsed.map(p => ({
      id: genId(),
      question: p.q,
      answer: p.a,
      category: "כללי",
      tags: [],
      createdAt: now,
      updatedAt: now,
      source: "manual" as const,
    }));
    persist([...newEntries, ...entries]);
    setBulkText("");
    setBulkPreview([]);
  };

  useEffect(() => {
    setBulkPreview(parseBulk(bulkText));
  }, [bulkText]);

  if (!mounted) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f5",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    direction: "rtl",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 24px",
    borderRadius: "4px",
    border: "none",
    background: "#0000FF",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };

  const btnSmall: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(240,240,245,0.6)",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  };

  const catColor = (cat: string) => CATEGORY_COLORS[cat] || "rgba(240,240,245,0.3)";

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>בסיס ידע</h1>
      <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "14px", marginBottom: "24px" }}>המוח של המערכת — שאלות, תשובות ומידע</p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {[
          { label: "סה״כ ערכים", value: entries.length },
          { label: "קטגוריות", value: allCategories.length },
          { label: "עדכון אחרון", value: lastUpdated ? formatDate(lastUpdated) : "—" },
        ].map(s => (
          <div key={s.label} style={{ padding: "14px 20px", borderRadius: "4px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", minWidth: "140px" }}>
            <div style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Add */}
      <div style={{
        padding: "24px",
        borderRadius: "4px",
        background: "rgba(0,0,255,0.04)",
        border: "1px solid rgba(0,0,255,0.15)",
        boxShadow: "0 0 40px rgba(0,0,255,0.06)",
        backdropFilter: "blur(12px)",
        marginBottom: "28px",
        position: "relative",
      }}>
        {successFlash && (
          <div style={{
            position: "absolute", top: "12px", left: "12px",
            padding: "8px 16px", borderRadius: "4px",
            background: "rgba(0,200,83,0.15)", border: "1px solid rgba(0,200,83,0.3)",
            color: "#00C853", fontSize: "13px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <CheckIcon size={14} /> נוסף בהצלחה
          </div>
        )}
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <PlusIcon size={16} /> הוספה מהירה
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea rows={2} placeholder="השאלה..." value={question} onChange={e => setQuestion(e.target.value)} style={inputStyle} />
          <textarea rows={4} placeholder="התשובה..." value={answer} onChange={e => setAnswer(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "140px", cursor: "pointer" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom">קטגוריה חדשה...</option>
            </select>
            {category === "__custom" && (
              <input placeholder="שם קטגוריה" value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "160px" }} />
            )}
            <input placeholder="תגיות (מופרדות בפסיק)" value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "160px" }} />
          </div>
          <div>
            <button onClick={handleAdd} disabled={!question.trim() || !answer.trim()} style={{ ...btnPrimary, opacity: (!question.trim() || !answer.trim()) ? 0.4 : 1 }}>
              <PlusIcon size={14} /> הוסף לבסיס הידע
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <SearchIcon size={16} color="rgba(240,240,245,0.35)" />
          <input
            placeholder="חיפוש בשאלות ותשובות..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: "16px" }}
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "120px", cursor: "pointer" }}>
          <option value="הכל">כל הקטגוריות</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{ ...inputStyle, width: "auto", minWidth: "130px", cursor: "pointer" }}>
          <option value="newest">חדשים ראשון</option>
          <option value="alpha">לפי א-ב</option>
          <option value="updated">לפי עדכון</option>
        </select>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(240,240,245,0.4)", fontSize: "15px" }}>
          {entries.length === 0
            ? "אין ערכים בבסיס הידע. התחל להוסיף שאלות ותשובות!"
            : "לא נמצאו תוצאות לחיפוש."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          {filtered.map(entry => {
            const expanded = expandedId === entry.id;
            const editing = editingId === entry.id;
            const confirming = deleteConfirm === entry.id;
            const answerLines = entry.answer.split("\n");
            const truncated = !expanded && answerLines.length > 3;
            const displayAnswer = truncated ? answerLines.slice(0, 3).join("\n") + "..." : entry.answer;

            return (
              <div
                key={entry.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  borderRight: `4px solid ${catColor(entry.category)}`,
                  padding: "20px 24px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  cursor: editing ? "default" : "pointer",
                }}
                onClick={() => { if (!editing) setExpandedId(expanded ? null : entry.id); }}
              >
                {/* Question */}
                {editing ? (
                  <textarea rows={2} value={editQ} onChange={e => setEditQ(e.target.value)} style={{ ...inputStyle, marginBottom: "8px", fontWeight: 700, fontSize: "15px" }} onClick={e => e.stopPropagation()} />
                ) : (
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>{entry.question}</div>
                )}

                {/* Answer */}
                {editing ? (
                  <textarea rows={4} value={editA} onChange={e => setEditA(e.target.value)} style={{ ...inputStyle, marginBottom: "8px" }} onClick={e => e.stopPropagation()} />
                ) : (
                  <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", lineHeight: 1.7, marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                    {displayAnswer}
                    {truncated && (
                      <span style={{ color: "#0000FF", marginRight: "4px", fontWeight: 600 }}> הצג עוד</span>
                    )}
                  </div>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                  {/* Category badge */}
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: catColor(entry.category),
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}>{entry.category}</span>

                  {/* Source badge */}
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: entry.source === "manual" ? "rgba(0,0,255,0.15)" : "rgba(123,47,255,0.15)",
                    color: entry.source === "manual" ? "#6B8AFF" : "#B57FFF",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}>{entry.source === "manual" ? "ידני" : "משאלת משתמש"}</span>

                  {/* Tags */}
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(240,240,245,0.5)",
                      fontSize: "11px",
                    }}>{t}</span>
                  ))}

                  <span style={{ color: "rgba(240,240,245,0.3)", marginRight: "auto" }}>{formatDate(entry.createdAt)}</span>
                </div>

                {/* Actions - show on expand */}
                {(expanded || editing) && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }} onClick={e => e.stopPropagation()}>
                    {editing ? (
                      <>
                        <button onClick={() => handleEditSave(entry.id)} style={{ ...btnSmall, background: "rgba(0,0,255,0.15)", color: "#6B8AFF", borderColor: "rgba(0,0,255,0.3)" }}>
                          <CheckIcon size={12} /> שמור
                        </button>
                        <button onClick={() => setEditingId(null)} style={btnSmall}>ביטול</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(entry.id); setEditQ(entry.question); setEditA(entry.answer); }} style={btnSmall}>
                          <EditIcon size={12} /> ערוך
                        </button>
                        <button onClick={() => handleCopy(entry)} style={btnSmall}>
                          {copiedId === entry.id ? <><CheckIcon size={12} /> הועתק</> : <><CopyIcon size={12} /> העתק</>}
                        </button>
                        {confirming ? (
                          <>
                            <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "12px", alignSelf: "center" }}>בטוח?</span>
                            <button onClick={() => handleDelete(entry.id)} style={{ ...btnSmall, color: "#FF4444", borderColor: "rgba(255,68,68,0.3)" }}>כן, מחק</button>
                            <button onClick={() => setDeleteConfirm(null)} style={btnSmall}>ביטול</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(entry.id)} style={{ ...btnSmall, color: "#FF4444" }}>
                            <TrashIcon size={12} /> מחק
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Import */}
      <div style={{
        padding: "24px",
        borderRadius: "4px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginTop: "20px",
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ImportIcon size={16} /> ייבוא מרובה
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.4)", marginBottom: "12px" }}>
          הדבק שאלות ותשובות בפורמט: ש: שאלה ↵ ת: תשובה (שורה ריקה בין ערכים)
        </p>
        <textarea
          rows={6}
          placeholder={"ש: שאלה ראשונה?\nת: תשובה ראשונה.\n\nש: שאלה שנייה?\nת: תשובה שנייה."}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          style={inputStyle}
        />
        {bulkPreview.length > 0 && (
          <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: "4px", background: "rgba(0,0,255,0.06)", border: "1px solid rgba(0,0,255,0.15)", fontSize: "13px", color: "rgba(240,240,245,0.6)" }}>
            זוהו <strong style={{ color: "#fff" }}>{bulkPreview.length}</strong> ערכים לייבוא
          </div>
        )}
        <button onClick={handleBulkImport} disabled={bulkPreview.length === 0} style={{ ...btnPrimary, marginTop: "8px", opacity: bulkPreview.length === 0 ? 0.4 : 1 }}>
          <ImportIcon size={14} /> ייבא
        </button>
      </div>
    </div>
  );
}
