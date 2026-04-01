"use client";

import React, { useState } from "react";

const LOCAL_STORAGE_KEYS = [
  "bldr_courses",
  "bldr_course_order",
  "bldr_user_profile",
  "bldr_user_settings",
  "bldr_api_keys",
  "bldr_brand_settings",
  "bldr_avatar_settings",
  "bldr_thumb_defaults",
  "bldr_forum_questions",
  "bldr_knowledge_base",
  "bldr_notes",
  "bldr_notifications",
  "bldr_feedback",
  "bldr_ideas",
  "bldr_case_studies",
  "bldr_case_study_requests",
  "bldr_promo_links",
  "bldr_events",
  "bldr_prompt_logs",
  "bldr_news",
];

async function exportIndexedDB(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const result: Record<string, string> = {};
    try {
      const request = indexedDB.open("bldr_images", 1);
      request.onerror = () => resolve(result);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("images")) { resolve(result); return; }
        const tx = db.transaction("images", "readonly");
        const store = tx.objectStore("images");
        const getAll = store.getAll();
        const getAllKeys = store.getAllKeys();
        getAll.onsuccess = () => {
          getAllKeys.onsuccess = () => {
            const keys = getAllKeys.result;
            const values = getAll.result;
            for (let i = 0; i < keys.length; i++) {
              result[String(keys[i])] = values[i];
            }
            resolve(result);
          };
        };
        getAll.onerror = () => resolve(result);
      };
    } catch {
      resolve(result);
    }
  });
}

async function importIndexedDB(images: Record<string, string>): Promise<number> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("bldr_images", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images");
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("images", "readwrite");
        const store = tx.objectStore("images");
        let count = 0;
        for (const [key, value] of Object.entries(images)) {
          store.put(value, key);
          count++;
        }
        tx.oncomplete = () => resolve(count);
        tx.onerror = () => resolve(count);
      };
      request.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export default function MigratePage() {
  const [status, setStatus] = useState("");
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setStatus("מייצא מידע...");

    const data: Record<string, unknown> = {};

    // Export localStorage
    for (const key of LOCAL_STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (value) {
        try { data[key] = JSON.parse(value); } catch { data[key] = value; }
      }
    }

    // Export IndexedDB images
    setStatus("מייצא תמונות...");
    const images = await exportIndexedDB();
    if (Object.keys(images).length > 0) {
      data["__indexeddb_images"] = images;
    }

    // Download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bldr-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const keyCount = Object.keys(data).length;
    const imageCount = Object.keys(images).length;
    setStatus(`ייצוא הושלם! ${keyCount} מפתחות, ${imageCount} תמונות`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus("מייבא מידע...");

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let keyCount = 0;
      let imageCount = 0;

      for (const [key, value] of Object.entries(data)) {
        if (key === "__indexeddb_images") {
          setStatus("מייבא תמונות...");
          imageCount = await importIndexedDB(value as Record<string, string>);
          continue;
        }

        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        keyCount++;
      }

      setStatus(`ייבוא הושלם! ${keyCount} מפתחות, ${imageCount} תמונות. מרענן...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setStatus(`שגיאה: ${err instanceof Error ? err.message : "קובץ לא תקין"}`);
    }

    setImporting(false);
    e.target.value = "";
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 4,
    padding: 28,
  };

  const btn: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: 4,
    border: "none",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f5", marginBottom: 8 }}>
        ייצוא וייבוא מידע
      </h1>
      <p style={{ color: "rgba(240,240,245,0.7)", fontSize: 14, marginBottom: 32 }}>
        העבר את כל המידע מהמערכת המקומית לאתר החי — קורסים, הגדרות, תמונות והכל
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Export */}
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f5", marginBottom: 8 }}>
            ייצוא
          </h2>
          <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
            מוריד קובץ JSON עם כל המידע שלך — קורסים, פרקים, שיעורים, הגדרות, תמונות ממוזערות
          </p>
          <button
            onClick={handleExport}
            style={{ ...btn, background: "#0000FF", color: "#fff" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              הורד קובץ ייצוא
            </span>
          </button>
        </div>

        {/* Import */}
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f5", marginBottom: 8 }}>
            ייבוא
          </h2>
          <p style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
            העלה קובץ שיוצא מהמערכת — כל המידע ייטען אוטומטית
          </p>
          <label style={{
            ...btn,
            background: "rgba(255,255,255,0.06)",
            color: "#f0f0f5",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "inline-flex", alignItems: "center", gap: 8,
            opacity: importing ? 0.5 : 1,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {importing ? "מייבא..." : "העלה קובץ ייצוא"}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div style={{
          marginTop: 20,
          padding: "12px 16px",
          borderRadius: 4,
          background: status.includes("שגיאה") ? "rgba(255,59,48,0.1)" : "rgba(0,200,83,0.1)",
          border: `1px solid ${status.includes("שגיאה") ? "rgba(255,59,48,0.3)" : "rgba(0,200,83,0.3)"}`,
          color: status.includes("שגיאה") ? "#ff6b6b" : "#00C853",
          fontSize: 13,
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
