"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface AdminTask {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "done";
  createdAt: string;
}

interface InputRow {
  title: string;
  description: string;
}

const STORAGE_KEY = "bldr_admin_tasks";
const NEXT_ID_KEY = "bldr_admin_tasks_next_id";

function getIdeas(): AdminTask[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveIdeas(ideas: AdminTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function getNextId(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(localStorage.getItem(NEXT_ID_KEY) || "1", 10);
}

function setNextId(n: number) {
  localStorage.setItem(NEXT_ID_KEY, String(n));
}

function formatId(n: number): string {
  return `TASK-${String(n).padStart(3, "0")}`;
}

export default function TasksPage() {
  const [ideas, setIdeas] = useState<AdminTask[]>([]);
  const [rows, setRows] = useState<InputRow[]>([{ title: "", description: "" }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [mounted, setMounted] = useState(false);
  const rowRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIdeas(getIdeas());
    setMounted(true);
  }, []);

  const persist = useCallback((updated: AdminTask[]) => {
    setIdeas(updated);
    saveIdeas(updated);
  }, []);

  const handleRowKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitAll();
    } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const newRows = [...rows];
      newRows.splice(idx + 1, 0, { title: "", description: "" });
      setRows(newRows);
      setTimeout(() => rowRefs.current[idx + 1]?.focus(), 0);
    }
  };

  const submitAll = () => {
    const valid = rows.filter((r) => r.title.trim() || r.description.trim());
    if (valid.length === 0) return;
    let nextId = getNextId();
    const now = new Date().toISOString();
    const newIdeas: AdminTask[] = valid.map((r) => {
      const idea: AdminTask = {
        id: formatId(nextId),
        title: r.title.trim(),
        description: r.description.trim(),
        status: "backlog",
        createdAt: now,
      };
      nextId++;
      return idea;
    });
    setNextId(nextId);
    persist([...newIdeas, ...ideas]);
    setRows([{ title: "", description: "" }]);
  };

  const updateRow = (idx: number, field: keyof InputRow, val: string) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setRows(newRows);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) {
      setRows([{ title: "", description: "" }]);
      return;
    }
    setRows(rows.filter((_, i) => i !== idx));
  };

  const moveIdea = (id: string, to: "backlog" | "done") => {
    persist(ideas.map((i) => (i.id === id ? { ...i, status: to } : i)));
  };

  const deleteIdea = (id: string) => {
    persist(ideas.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const startEdit = (idea: AdminTask) => {
    if (expandedId === idea.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(idea.id);
    setEditTitle(idea.title);
    setEditDesc(idea.description);
  };

  const saveEdit = (id: string) => {
    persist(
      ideas.map((i) =>
        i.id === id ? { ...i, title: editTitle, description: editDesc } : i
      )
    );
    setExpandedId(null);
  };

  const backlog = ideas.filter((i) => i.status === "backlog");
  const done = ideas.filter((i) => i.status === "done");

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "4px",
    border: "1px solid rgba(0,0,255,0.15)",
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f5",
    fontSize: "14px",
    outline: "none",
  };

  const cardBase: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "16px",
    cursor: "pointer",
    transition: "border-color 0.2s",
  };

  const btnSmall: React.CSSProperties = {
    padding: "4px 12px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(240,240,245,0.7)",
    fontSize: "12px",
    cursor: "pointer",
  };

  const btnDanger: React.CSSProperties = {
    ...btnSmall,
    color: "rgba(255,80,80,0.7)",
    border: "1px solid rgba(255,80,80,0.15)",
  };

  if (!mounted) return null;

  const renderCard = (idea: AdminTask) => {
    const isDone = idea.status === "done";
    const expanded = expandedId === idea.id;
    return (
      <div
        key={idea.id}
        style={{
          ...cardBase,
          borderRight: isDone
            ? "4px solid rgba(0,200,83,0.4)"
            : "4px solid rgba(0,0,255,0.3)",
        }}
        onClick={() => startEdit(idea)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(240,240,245,0.7)",
            }}
          >
            {idea.id}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
            {new Date(idea.createdAt).toLocaleDateString("he-IL")}
          </span>
        </div>

        {expanded ? (
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ ...inputStyle, fontWeight: 700 }}
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => saveEdit(idea.id)}
                style={{ ...btnSmall, background: "rgba(0,0,255,0.15)", color: "#fff" }}
              >
                שמור
              </button>
              <button onClick={() => setExpandedId(null)} style={btnSmall}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, color: "#f0f0f5", fontSize: "15px", marginBottom: "4px" }}>
              {idea.title}
            </div>
            {idea.description && (
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(240,240,245,0.7)",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {idea.description}
              </div>
            )}
          </>
        )}

        <div
          style={{ display: "flex", gap: "8px", marginTop: "12px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {isDone ? (
            <button onClick={() => moveIdea(idea.id, "backlog")} style={btnSmall}>
              החזר
            </button>
          ) : (
            <button
              onClick={() => moveIdea(idea.id, "done")}
              style={{ ...btnSmall, color: "rgba(0,200,83,0.8)", border: "1px solid rgba(0,200,83,0.2)" }}
            >
              {"בוצע ✓"}
            </button>
          )}
          <button onClick={() => deleteIdea(idea.id)} style={btnDanger}>
            מחק
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
        משימות
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "28px", fontSize: "14px" }}>
        ניהול משימות לביצוע
      </p>

      {/* Quick Add */}
      <div
        style={{
          background: "rgba(0,0,255,0.03)",
          border: "1px solid rgba(0,0,255,0.15)",
          borderRadius: "4px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                ref={(el) => { rowRefs.current[idx] = el; }}
                placeholder="כותרת"
                value={row.title}
                onChange={(e) => updateRow(idx, "title", e.target.value)}
                onKeyDown={(e) => handleRowKey(e, idx)}
                style={{ ...inputStyle, flex: "0 0 35%" }}
              />
              <input
                placeholder="תיאור"
                value={row.description}
                onChange={(e) => updateRow(idx, "description", e.target.value)}
                onKeyDown={(e) => handleRowKey(e, idx)}
                style={inputStyle}
              />
              <button
                onClick={() => removeRow(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(240,240,245,0.7)",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0 4px",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
            Enter = שורה חדשה | Cmd+Enter = שלח הכל
          </span>
          <button
            onClick={submitAll}
            style={{
              padding: "8px 20px",
              borderRadius: "4px",
              border: "1px solid rgba(0,0,255,0.3)",
              background: "rgba(0,0,255,0.15)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            הוסף
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Backlog */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5" }}>רעיונות</h2>
            <span
              style={{
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "4px",
                background: "rgba(0,0,255,0.15)",
                color: "rgba(200,200,255,0.8)",
              }}
            >
              {backlog.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {backlog.map(renderCard)}
            {backlog.length === 0 && (
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", textAlign: "center", padding: "32px 0" }}>
                אין משימות בהמתנה
              </p>
            )}
          </div>
        </div>

        {/* Done */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5" }}>בוצע</h2>
            <span
              style={{
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "4px",
                background: "rgba(0,200,83,0.15)",
                color: "rgba(0,200,83,0.8)",
              }}
            >
              {done.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {done.map(renderCard)}
            {done.length === 0 && (
              <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", textAlign: "center", padding: "32px 0" }}>
                אין משימות שהושלמו
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
