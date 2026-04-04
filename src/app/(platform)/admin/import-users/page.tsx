"use client";

import React, { useState, useRef, useEffect } from "react";
import { TARGET_FIELDS } from "@/lib/user-import";

// ── Styles ──────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  padding: 32,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 4,
  border: "none",
  background: "#0000FF",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const BTN_SECONDARY: React.CSSProperties = {
  ...BTN,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(240,240,245,0.7)",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "rgba(240,240,245,0.7)",
  marginBottom: 8,
  fontWeight: 500,
};

// ── Types ──────────────────────────────────────────────────────────
interface ParsedRow { [key: string]: string }
interface School { id: string; name: string }
interface Course { id: string; title: string; status: string }

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS = [
  "העלאת קובץ",
  "מיפוי שדות",
  "שיוך לבית ספר",
  "זמינות קורסים",
  "הגבלת זמן",
  "תצוגה מקדימה",
];

export default function ImportUsersPage() {
  const [step, setStep] = useState<Step>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1: File
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Step 2: Mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Step 3: School
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");

  // Step 4: Course availability
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseAvailability, setCourseAvailability] = useState<Record<string, boolean>>({});

  // Step 5: Time limit
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [expiryMode, setExpiryMode] = useState<"full_lock" | "partial_lock">("full_lock");
  const [afterExpiryCourses, setAfterExpiryCourses] = useState<Record<string, boolean>>({});

  // Step 6: Result
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ successCount: number; failCount: number; errors: { email: string; error: string }[] } | null>(null);

  // Fetch schools and courses
  useEffect(() => {
    fetch("/api/schools").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSchools(data);
    }).catch(() => {});
    fetch("/api/courses").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setCourses(data);
        const avail: Record<string, boolean> = {};
        data.forEach((c: Course) => { avail[c.id] = true; });
        setCourseAvailability(avail);
      }
    }).catch(() => {});
  }, []);

  // Step 1: Upload file
  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import-users", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setHeaders(data.headers);
      setPreviewRows(data.previewRows);
      setTotalRows(data.totalRows);
      setMapping(data.suggestedMapping || {});
      setStep(2);
    } catch (err) {
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Validate mapping
  const isMappingValid = () => {
    return Object.values(mapping).includes("email");
  };

  // Step 6: Execute import
  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));
      formData.append("importedBy", profile.id || "");
      if (selectedSchool) formData.append("schoolId", selectedSchool);
      formData.append("courseAvailability", JSON.stringify(courseAvailability));
      if (hasTimeLimit && expiresAt) {
        formData.append("accessExpiresAt", new Date(expiresAt).toISOString());
        formData.append("expiryMode", expiryMode);
      }

      const res = await fetch("/api/import-users/execute", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch {
      alert("שגיאה בייבוא");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", marginBottom: "8px" }}>
        ייבוא משתמשים
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.5)", marginBottom: "32px" }}>
        העלה קובץ CSV או Excel עם רשימת משתמשים
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const isActive = step === s;
          const isDone = step > s;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: "4px",
                borderRadius: "2px",
                background: isDone ? "#0000FF" : isActive ? "rgba(0,0,255,0.5)" : "rgba(255,255,255,0.06)",
                marginBottom: "8px",
                transition: "background 0.3s",
              }} />
              <span style={{
                fontSize: "11px",
                color: isActive ? "#f0f0f5" : "rgba(240,240,245,0.4)",
                fontWeight: isActive ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: File Upload ── */}
      {step === 1 && (
        <div style={CARD}>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
            style={{
              border: "2px dashed rgba(255,255,255,0.1)",
              borderRadius: "4px",
              padding: "48px 32px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,255,0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📄</div>
            <p style={{ fontSize: "15px", color: "#f0f0f5", fontWeight: 500, marginBottom: "4px" }}>
              {file ? file.name : "גרור קובץ לכאן או לחץ לבחירה"}
            </p>
            <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.4)" }}>
              CSV, XLSX
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              onClick={handleFileUpload}
              disabled={!file || uploading}
              style={{ ...BTN, opacity: !file || uploading ? 0.5 : 1 }}
            >
              {uploading ? "מעלה..." : "המשך"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Field Mapping ── */}
      {step === 2 && (
        <div style={CARD}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "8px" }}>
            מיפוי שדות
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginBottom: "20px" }}>
            מפה כל עמודה מהקובץ לשדה המתאים. אימייל הוא שדה חובה.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {headers.map((header) => (
              <div key={header} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{
                  flex: "0 0 180px",
                  fontSize: "14px",
                  color: "#f0f0f5",
                  fontWeight: 500,
                  direction: "ltr",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {header}
                </span>
                <span style={{ color: "rgba(240,240,245,0.3)", fontSize: "16px" }}>→</span>
                <select
                  value={mapping[header] || "skip"}
                  onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                  style={{ ...INPUT, flex: 1 }}
                >
                  {TARGET_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label} {f.required ? "(חובה)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <>
              <h4 style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", marginBottom: "8px" }}>
                תצוגה מקדימה ({totalRows} שורות)
              </h4>
              <div style={{ overflow: "auto", maxHeight: "200px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "right", color: "rgba(240,240,245,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {headers.map((h) => (
                          <td key={h} style={{ padding: "6px 12px", color: "rgba(240,240,245,0.7)", borderBottom: "1px solid rgba(255,255,255,0.03)", whiteSpace: "nowrap" }}>
                            {row[h] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button onClick={() => setStep(1)} style={BTN_SECONDARY}>חזרה</button>
            <button
              onClick={() => setStep(3)}
              disabled={!isMappingValid()}
              style={{ ...BTN, opacity: !isMappingValid() ? 0.5 : 1 }}
            >
              המשך
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: School Assignment ── */}
      {step === 3 && (
        <div style={CARD}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "8px" }}>
            שיוך לבית ספר
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginBottom: "20px" }}>
            בחר לאיזה בית ספר לשייך את המשתמשים המיובאים (אופציונלי)
          </p>

          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            style={{ ...INPUT, maxWidth: "400px" }}
          >
            <option value="">ללא שיוך לבית ספר</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button onClick={() => setStep(2)} style={BTN_SECONDARY}>חזרה</button>
            <button onClick={() => setStep(4)} style={BTN}>המשך</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Course Availability ── */}
      {step === 4 && (
        <div style={CARD}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "8px" }}>
            זמינות קורסים
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginBottom: "20px" }}>
            בחר אילו קורסים יהיו זמינים למשתמשים המיובאים. כל הקורסים מסומנים כברירת מחדל.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {courses.map((c) => (
              <label
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  opacity: courseAvailability[c.id] ? 1 : 0.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={courseAvailability[c.id] ?? true}
                  onChange={() =>
                    setCourseAvailability({ ...courseAvailability, [c.id]: !courseAvailability[c.id] })
                  }
                  style={{ width: "16px", height: "16px" }}
                />
                <span style={{ color: "#f0f0f5", fontSize: "14px", fontWeight: 500 }}>{c.title}</span>
                <span style={{
                  fontSize: "11px", color: "rgba(240,240,245,0.4)",
                  padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "10px",
                }}>
                  {c.status === "active" ? "פעיל" : c.status === "draft" ? "טיוטה" : c.status}
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button onClick={() => setStep(3)} style={BTN_SECONDARY}>חזרה</button>
            <button onClick={() => setStep(5)} style={BTN}>המשך</button>
          </div>
        </div>
      )}

      {/* ── Step 5: Time Limit ── */}
      {step === 5 && (
        <div style={CARD}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "8px" }}>
            הגבלת זמן
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginBottom: "20px" }}>
            הגדר תקופת שימוש מוגבלת למשתמשים המיובאים (אופציונלי)
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hasTimeLimit}
              onChange={() => setHasTimeLimit(!hasTimeLimit)}
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ color: "#f0f0f5", fontSize: "14px", fontWeight: 500 }}>הגבלת זמן שימוש</span>
          </label>

          {hasTimeLimit && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <label style={LABEL}>תאריך תפוגה</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={{ ...INPUT, maxWidth: "250px" }}
                />
              </div>

              <div>
                <label style={LABEL}>מה קורה לאחר התפוגה?</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "16px",
                    background: expiryMode === "full_lock" ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${expiryMode === "full_lock" ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}>
                    <input
                      type="radio"
                      checked={expiryMode === "full_lock"}
                      onChange={() => setExpiryMode("full_lock")}
                      style={{ marginTop: "2px" }}
                    />
                    <div>
                      <div style={{ color: "#f0f0f5", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
                        נעילה מלאה
                      </div>
                      <div style={{ color: "rgba(240,240,245,0.5)", fontSize: "12px" }}>
                        כל התכנים ננעלים ומופיע פופאפ הרשמה שלא ניתן לסגור
                      </div>
                    </div>
                  </label>
                  <label style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "16px",
                    background: expiryMode === "partial_lock" ? "rgba(0,0,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${expiryMode === "partial_lock" ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}>
                    <input
                      type="radio"
                      checked={expiryMode === "partial_lock"}
                      onChange={() => setExpiryMode("partial_lock")}
                      style={{ marginTop: "2px" }}
                    />
                    <div>
                      <div style={{ color: "#f0f0f5", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
                        נעילה חלקית
                      </div>
                      <div style={{ color: "rgba(240,240,245,0.5)", fontSize: "12px" }}>
                        רק קורסים נבחרים נשארים זמינים, השאר ננעלים
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {expiryMode === "partial_lock" && (
                <div>
                  <label style={LABEL}>קורסים שישארו זמינים לאחר תפוגה:</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {courses.map((c) => (
                      <label
                        key={c.id}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={afterExpiryCourses[c.id] ?? false}
                          onChange={() =>
                            setAfterExpiryCourses({ ...afterExpiryCourses, [c.id]: !afterExpiryCourses[c.id] })
                          }
                          style={{ width: "14px", height: "14px" }}
                        />
                        <span style={{ color: "rgba(240,240,245,0.7)", fontSize: "13px" }}>{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <button onClick={() => setStep(4)} style={BTN_SECONDARY}>חזרה</button>
            <button onClick={() => setStep(6)} style={BTN}>המשך</button>
          </div>
        </div>
      )}

      {/* ── Step 6: Preview & Confirm ── */}
      {step === 6 && (
        <div style={CARD}>
          {result ? (
            <>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "16px" }}>
                הייבוא הושלם!
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div style={{ padding: "20px", background: "rgba(0,200,83,0.06)", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#00C853" }}>{result.successCount}</div>
                  <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>הצליחו</div>
                </div>
                <div style={{ padding: "20px", background: "rgba(255,59,48,0.06)", borderRadius: "4px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#ff6b6b" }}>{result.failCount}</div>
                  <div style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)" }}>נכשלו</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", marginBottom: "8px" }}>שגיאות:</h4>
                  <div style={{ maxHeight: "200px", overflow: "auto" }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{ padding: "6px 12px", fontSize: "12px", color: "rgba(255,59,48,0.8)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        {err.email}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setHeaders([]);
                  setPreviewRows([]);
                  setResult(null);
                }}
                style={BTN}
              >
                ייבוא נוסף
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f5", marginTop: 0, marginBottom: "20px" }}>
                סיכום ואישור
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>קובץ</span>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>{file?.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>מספר שורות</span>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>{totalRows}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>בית ספר</span>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>
                    {selectedSchool ? schools.find(s => s.id === selectedSchool)?.name : "ללא"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>קורסים זמינים</span>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>
                    {Object.values(courseAvailability).filter(Boolean).length} / {courses.length}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px" }}>הגבלת זמן</span>
                  <span style={{ color: "#f0f0f5", fontSize: "13px", fontWeight: 500 }}>
                    {hasTimeLimit ? `עד ${expiresAt} (${expiryMode === "full_lock" ? "נעילה מלאה" : "נעילה חלקית"})` : "ללא"}
                  </span>
                </div>

                {/* Mapping summary */}
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <span style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px", display: "block", marginBottom: "8px" }}>מיפוי שדות:</span>
                  {Object.entries(mapping).filter(([, v]) => v !== "skip").map(([col, target]) => (
                    <div key={col} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "rgba(240,240,245,0.6)", marginBottom: "2px" }}>
                      <span style={{ direction: "ltr" }}>{col}</span>
                      <span>→</span>
                      <span>{TARGET_FIELDS.find(f => f.value === target)?.label || target}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(5)} style={BTN_SECONDARY}>חזרה</button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{ ...BTN, opacity: importing ? 0.6 : 1 }}
                >
                  {importing ? "מייבא..." : `ייבוא ${totalRows} משתמשים`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
