"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuestionIcon, PlusIcon, TrashIcon, EditIcon, CheckIcon } from "@/components/ui/icons";
import { useUser } from "@/hooks/useUser";

interface QAEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  tags: string[];
  createdAt: string;
}

export default function QAPageClient() {
  const { isAdmin } = useUser();
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add/Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const s = search.toLowerCase();
    return entries.filter((e) =>
      e.question.toLowerCase().includes(s) || e.answer.toLowerCase().includes(s)
    );
  }, [entries, search]);

  const handleSave = async () => {
    if (!formQuestion.trim() || !formAnswer.trim() || saving) return;
    setSaving(true);

    try {
      if (editingId) {
        await fetch("/api/knowledge", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, question: formQuestion.trim(), answer: formAnswer.trim() }),
        });
        setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, question: formQuestion.trim(), answer: formAnswer.trim() } : e));
      } else {
        const res = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: formQuestion.trim(), answer: formAnswer.trim() }),
        });
        const entry = await res.json();
        if (entry.id) setEntries((prev) => [entry, ...prev]);
      }
      resetForm();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את השאלה?")) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleEdit = (entry: QAEntry) => {
    setEditingId(entry.id);
    setFormQuestion(entry.question);
    setFormAnswer(entry.answer);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormQuestion("");
    setFormAnswer("");
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען...</div>;
  }

  return (
    <div className="qa-page" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .qa-page { padding: 16px !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f0f0f5", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <QuestionIcon size={24} /> שאלות ותשובות
        </h1>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#0000FF", color: "white", border: "none",
              padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <PlusIcon size={14} /> הוסף שאלה
          </button>
        )}
      </div>

      <p style={{ color: "rgba(240,240,245,0.5)", marginBottom: "24px", fontSize: "14px" }}>
        כאן יופיעו שאלות שחוזרות על עצמן עם תשובות מפורטות
      </p>

      {/* Admin add/edit form */}
      {isAdmin && showForm && (
        <div style={{
          background: "rgba(0,0,255,0.04)",
          border: "1px solid rgba(0,0,255,0.15)",
          borderRadius: 6,
          padding: "20px",
          marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5", marginBottom: 14, margin: "0 0 14px" }}>
            {editingId ? "עריכת שאלה" : "שאלה חדשה"}
          </h3>
          <input
            value={formQuestion}
            onChange={(e) => setFormQuestion(e.target.value)}
            placeholder="השאלה..."
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4, padding: "10px 14px", color: "#f0f0f5", fontSize: 14, outline: "none",
              marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
          <textarea
            value={formAnswer}
            onChange={(e) => setFormAnswer(e.target.value)}
            placeholder="התשובה..."
            rows={4}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4, padding: "10px 14px", color: "#f0f0f5", fontSize: 14, outline: "none",
              resize: "vertical", marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !formQuestion.trim() || !formAnswer.trim()}
              style={{
                background: "#0000FF", color: "white", border: "none",
                padding: "8px 20px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "שומר..." : editingId ? "עדכן" : "שמור"}
            </button>
            <button
              onClick={resetForm}
              style={{
                background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "8px 20px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {entries.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש שאלות..."
          style={{
            width: "100%", background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "4px", padding: "10px 16px", color: "#f0f0f5", fontSize: "14px",
            outline: "none", marginBottom: "20px", boxSizing: "border-box",
          }}
        />
      )}

      {/* Q&A list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "rgba(240,240,245,0.5)" }}>
          <QuestionIcon size={48} color="rgba(240,240,245,0.15)" />
          <p style={{ marginTop: "16px", fontSize: "15px" }}>
            ממש בקרוב תתחילו לראות כאן שאלות ותשובות מפורטות.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                style={{
                  background: "#0a0a1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{
                    color: "#5555FF", fontSize: 16, fontWeight: 700, flexShrink: 0,
                    transition: "transform 0.2s",
                    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}>
                    ›
                  </span>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5", margin: 0, flex: 1 }}>
                    {entry.question}
                  </h3>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(240,240,245,0.4)" }}
                        title="ערוך"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,59,48,0.5)" }}
                        title="מחק"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {expanded && (
                  <div style={{
                    padding: "0 20px 20px 20px",
                    paddingRight: "46px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <p style={{
                      fontSize: "14px",
                      color: "rgba(240,240,245,0.7)",
                      lineHeight: 1.8,
                      margin: "16px 0 0",
                      whiteSpace: "pre-wrap",
                    }}>
                      {entry.answer}
                    </p>
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
