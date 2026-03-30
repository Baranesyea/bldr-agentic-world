"use client";

import { useState } from "react";

export default function ExportPage() {
  const [status, setStatus] = useState("לחץ על הכפתור כדי לייצא את כל המידע");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleExport = async () => {
    setRunning(true);
    setStatus("מייצא...");
    setLogs([]);
    let count = 0;

    try {
      // 1. Export localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        let value;
        try {
          value = JSON.parse(localStorage.getItem(key)!);
        } catch {
          value = localStorage.getItem(key);
        }
        const res = await fetch("/api/export-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, type: "localStorage" }),
        });
        const r = await res.json();
        addLog(`localStorage: ${key} — ${r.ok ? "✅" : "❌ " + r.error}`);
        count++;
      }

      // 2. Export IndexedDB
      const dbs = await indexedDB.databases();
      for (const dbInfo of dbs) {
        if (!dbInfo.name) continue;
        const db: IDBDatabase = await new Promise((resolve, reject) => {
          const req = indexedDB.open(dbInfo.name!);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        for (const storeName of Array.from(db.objectStoreNames)) {
          const items = await new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          const key = `${dbInfo.name}__${storeName}`;
          const res = await fetch("/api/export-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value: items, type: "indexedDB" }),
          });
          const r = await res.json();
          addLog(`IndexedDB: ${key} — ${r.ok ? "✅" : "❌ " + r.error}`);
          count++;
        }
        db.close();
      }

      setStatus(`ייצוא הושלם! ${count} פריטים יוצאו בהצלחה 🎉`);
    } catch (e) {
      setStatus(`שגיאה: ${e instanceof Error ? e.message : String(e)}`);
    }
    setRunning(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif", direction: "rtl" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>ייצוא מידע</h1>
      <p style={{ fontSize: 18, marginBottom: 24, color: "#666" }}>{status}</p>
      <button
        onClick={handleExport}
        disabled={running}
        style={{
          padding: "16px 48px",
          fontSize: 20,
          background: running ? "#999" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 12,
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        {running ? "מייצא..." : "ייצא הכל"}
      </button>
      {logs.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#111",
            color: "#0f0",
            borderRadius: 8,
            maxHeight: 400,
            overflow: "auto",
            fontSize: 14,
            fontFamily: "monospace",
            direction: "ltr",
            textAlign: "left",
          }}
        >
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
