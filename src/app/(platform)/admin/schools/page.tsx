"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsappLink: string | null;
  createdAt: string;
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

export default function AdminSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      if (Array.isArray(data)) setSchools(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleAdd = async () => {
    if (!newName) return;
    try {
      await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug || undefined,
          whatsappLink: newWhatsapp || undefined,
        }),
      });
      setShowAdd(false);
      setNewName("");
      setNewSlug("");
      setNewWhatsapp("");
      fetchSchools();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את בית הספר?")) return;
    try {
      await fetch(`/api/schools/${id}`, { method: "DELETE" });
      fetchSchools();
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "rgba(240,240,245,0.7)", textAlign: "center" }}>
        טוען...
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>
          בתי ספר
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} style={BTN}>
          + בית ספר חדש
        </button>
      </div>

      {showAdd && (
        <div style={{ ...CARD, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "16px" }}>
            בית ספר חדש
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              placeholder="שם בית הספר"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={INPUT}
            />
            <input
              placeholder="Slug (אופציונלי)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              style={{ ...INPUT, direction: "ltr" }}
            />
            <input
              placeholder="קישור וואצאפ (אופציונלי)"
              value={newWhatsapp}
              onChange={(e) => setNewWhatsapp(e.target.value)}
              style={{ ...INPUT, gridColumn: "1 / -1", direction: "ltr" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{ ...BTN, background: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.7)" }}
            >
              ביטול
            </button>
            <button onClick={handleAdd} style={BTN}>
              צור
            </button>
          </div>
        </div>
      )}

      {schools.length === 0 ? (
        <div style={{ ...CARD, textAlign: "center", color: "rgba(240,240,245,0.5)", padding: "60px" }}>
          אין בתי ספר עדיין. לחץ &quot;+ בית ספר חדש&quot; כדי ליצור.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {schools.map((s) => (
            <div
              key={s.id}
              style={{
                ...CARD,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => router.push(`/admin/schools/${s.id}`)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", margin: "0 0 4px 0" }}>
                    {s.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", margin: 0, direction: "ltr", textAlign: "right" }}>
                    /{s.slug}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,59,48,0.6)",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: "4px",
                  }}
                  title="מחק"
                >
                  ×
                </button>
              </div>
              {s.whatsappLink && (
                <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)", margin: "12px 0 0 0" }}>
                  וואצאפ מוגדר
                </p>
              )}
              <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.3)", margin: "8px 0 0 0" }}>
                נוצר: {new Date(s.createdAt).toLocaleDateString("he-IL")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
