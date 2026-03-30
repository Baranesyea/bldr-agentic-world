"use client";

import React, { useState, useEffect } from "react";

interface Member {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "inactive";
  type: "free" | "paid";
  pricePaid: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
  padding: "24px",
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "10px 22px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"free" | "paid">("free");
  const [newPrice, setNewPrice] = useState(0);
  const [newNotes, setNewNotes] = useState("");

  // Edit form
  const [editType, setEditType] = useState<"free" | "paid">("free");
  const [editPrice, setEditPrice] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editName, setEditName] = useState("");

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async () => {
    if (!newEmail || !newName) return;
    try {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName,
          type: newType,
          pricePaid: newPrice,
          notes: newNotes,
        }),
      });
      setShowAdd(false);
      setNewEmail("");
      setNewName("");
      setNewType("free");
      setNewPrice(0);
      setNewNotes("");
      fetchMembers();
    } catch {}
  };

  const toggleStatus = async (member: Member) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, status: newStatus }),
      });
      fetchMembers();
    } catch {}
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditType(member.type);
    setEditPrice(member.pricePaid);
    setEditNotes(member.notes || "");
    setEditName(member.fullName);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          fullName: editName,
          type: editType,
          pricePaid: editPrice,
          notes: editNotes,
        }),
      });
      setEditingId(null);
      fetchMembers();
    } catch {}
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("he-IL");
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "rgba(240,240,245,0.5)", textAlign: "center" }}>
        טוען...
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>
          ניהול סטודנטים
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} style={BTN}>
          + הוסף סטודנט
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ ...CARD, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "16px" }}>
            סטודנט חדש
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              placeholder="אימייל"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={INPUT}
            />
            <input
              placeholder="שם מלא"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={INPUT}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "free" | "paid")}
              style={INPUT}
            >
              <option value="free">חינם</option>
              <option value="paid">בתשלום</option>
            </select>
            <input
              type="number"
              placeholder="מחיר"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              style={INPUT}
            />
            <input
              placeholder="הערות"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              style={{ ...INPUT, gridColumn: "1 / -1" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{ ...BTN, background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.6)" }}
            >
              ביטול
            </button>
            <button onClick={handleAdd} style={BTN}>
              שמור
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...CARD, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["שם", "אימייל", "סטטוס", "סוג", "מחיר", "תאריך הצטרפות", "פעולות"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    color: "rgba(240,240,245,0.4)",
                    fontWeight: 500,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "rgba(240,240,245,0.3)" }}>
                  אין סטודנטים עדיין
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr
                key={m.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {editingId === m.id ? (
                  <>
                    <td style={{ padding: "10px 16px" }}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...INPUT, padding: "6px 10px" }} />
                    </td>
                    <td style={{ padding: "10px 16px", color: "#f0f0f5" }}>{m.email}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                        background: m.status === "active" ? "rgba(0,200,83,0.12)" : "rgba(255,59,48,0.12)",
                        color: m.status === "active" ? "#00C853" : "#ff6b6b",
                      }}>
                        {m.status === "active" ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <select value={editType} onChange={(e) => setEditType(e.target.value as "free" | "paid")} style={{ ...INPUT, padding: "6px 10px" }}>
                        <option value="free">חינם</option>
                        <option value="paid">בתשלום</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} style={{ ...INPUT, padding: "6px 10px", width: "80px" }} />
                    </td>
                    <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.5)" }}>{formatDate(m.createdAt)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={saveEdit} style={{ ...BTN, padding: "6px 14px", fontSize: "12px" }}>
                          שמור
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ ...BTN, padding: "6px 14px", fontSize: "12px", background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.6)" }}
                        >
                          ביטול
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 500 }}>{m.fullName}</td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.6)", direction: "ltr", textAlign: "right" }}>{m.email}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggleStatus(m)}
                        style={{
                          padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                          border: "none", cursor: "pointer",
                          background: m.status === "active" ? "rgba(0,200,83,0.12)" : "rgba(255,59,48,0.12)",
                          color: m.status === "active" ? "#00C853" : "#ff6b6b",
                        }}
                      >
                        {m.status === "active" ? "פעיל" : "לא פעיל"}
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.6)" }}>
                      {m.type === "paid" ? "בתשלום" : "חינם"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.6)" }}>
                      {m.pricePaid > 0 ? `${m.pricePaid} ₪` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>
                      {formatDate(m.createdAt)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => startEdit(m)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "4px",
                          padding: "6px 14px",
                          color: "rgba(240,240,245,0.6)",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        עריכה
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
