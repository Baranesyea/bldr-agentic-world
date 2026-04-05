"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Variable {
  key: string;
  label: string;
  defaultValue: string;
}

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: Variable[];
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

const DEFAULT_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    slug: "welcome",
    name: "ברוכים הבאים",
    subject: "ברוך הבא ל-BLDR, {{name}}!",
    variables: [
      { key: "name", label: "שם המשתמש", defaultValue: "חבר/ה" },
      { key: "loginUrl", label: "קישור התחברות", defaultValue: "https://app.bldr.co.il/login" },
    ],
    bodyHtml: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050510;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:28px;margin:0;">BLDR</h1>
    <p style="color:rgba(240,240,245,0.5);font-size:13px;margin:4px 0 0;">Agentic World</p>
  </div>
  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:32px 28px;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">היי {{name}}, ברוך הבא! 🎉</h2>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      אנחנו שמחים שהצטרפת ל-BLDR — המועדון לאנשים שבונים בעידן האג׳נטי.
    </p>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      כאן תמצא קורסים, כלים, קהילה ותוכן שיעזרו לך להפוך בינה מלאכותית ליתרון תחרותי אמיתי.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{loginUrl}}" style="display:inline-block;background:#0000FF;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">
        כניסה למערכת
      </a>
    </div>
  </div>
  <p style="text-align:center;color:rgba(240,240,245,0.3);font-size:12px;margin-top:32px;">
    © BLDR Agentic World
  </p>
</div>
</body>
</html>`,
  },
  {
    slug: "password-reset",
    name: "איפוס סיסמה",
    subject: "איפוס סיסמה — BLDR",
    variables: [
      { key: "name", label: "שם המשתמש", defaultValue: "חבר/ה" },
      { key: "resetUrl", label: "קישור איפוס", defaultValue: "#" },
    ],
    bodyHtml: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050510;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:28px;margin:0;">BLDR</h1>
    <p style="color:rgba(240,240,245,0.5);font-size:13px;margin:4px 0 0;">Agentic World</p>
  </div>
  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:32px 28px;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">איפוס סיסמה</h2>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      היי {{name}}, קיבלנו בקשה לאפס את הסיסמה שלך. לחץ על הכפתור למטה כדי ליצור סיסמה חדשה:
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{resetUrl}}" style="display:inline-block;background:#0000FF;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">
        איפוס סיסמה
      </a>
    </div>
    <p style="color:rgba(240,240,245,0.4);font-size:13px;line-height:1.6;">
      אם לא ביקשת לאפס סיסמה, אפשר להתעלם מהמייל הזה.
    </p>
  </div>
  <p style="text-align:center;color:rgba(240,240,245,0.3);font-size:12px;margin-top:32px;">
    © BLDR Agentic World
  </p>
</div>
</body>
</html>`,
  },
  {
    slug: "subscription-expiring",
    name: "המנוי עומד להיגמר",
    subject: "{{name}}, המנוי שלך עומד להיגמר",
    variables: [
      { key: "name", label: "שם המשתמש", defaultValue: "חבר/ה" },
      { key: "expiryDate", label: "תאריך תפוגה", defaultValue: "01/01/2026" },
      { key: "renewUrl", label: "קישור חידוש", defaultValue: "https://app.bldr.co.il" },
    ],
    bodyHtml: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050510;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:28px;margin:0;">BLDR</h1>
    <p style="color:rgba(240,240,245,0.5);font-size:13px;margin:4px 0 0;">Agentic World</p>
  </div>
  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:32px 28px;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">המנוי שלך עומד להיגמר ⏰</h2>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 16px;">
      היי {{name}}, רצינו לעדכן שהמנוי שלך ב-BLDR יסתיים ב-<strong style="color:#fff;">{{expiryDate}}</strong>.
    </p>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      כדי להמשיך לגשת לכל הקורסים, הכלים והקהילה — חדש את המנוי עכשיו:
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{renewUrl}}" style="display:inline-block;background:#0000FF;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">
        חידוש מנוי
      </a>
    </div>
  </div>
  <p style="text-align:center;color:rgba(240,240,245,0.3);font-size:12px;margin-top:32px;">
    © BLDR Agentic World
  </p>
</div>
</body>
</html>`,
  },
  {
    slug: "system-update",
    name: "עדכון מערכת",
    subject: "חדש ב-BLDR: {{updateTitle}}",
    variables: [
      { key: "name", label: "שם המשתמש", defaultValue: "חבר/ה" },
      { key: "updateTitle", label: "כותרת העדכון", defaultValue: "תכונות חדשות" },
      { key: "updateBody", label: "תוכן העדכון", defaultValue: "הוספנו תכונות חדשות למערכת." },
      { key: "ctaUrl", label: "קישור CTA", defaultValue: "https://app.bldr.co.il/dashboard" },
      { key: "ctaText", label: "טקסט כפתור", defaultValue: "צפה בעדכונים" },
    ],
    bodyHtml: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050510;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:28px;margin:0;">BLDR</h1>
    <p style="color:rgba(240,240,245,0.5);font-size:13px;margin:4px 0 0;">Agentic World</p>
  </div>
  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:32px 28px;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">{{updateTitle}}</h2>
    <p style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      היי {{name}},
    </p>
    <div style="color:rgba(240,240,245,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
      {{updateBody}}
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{ctaUrl}}" style="display:inline-block;background:#0000FF;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">
        {{ctaText}}
      </a>
    </div>
  </div>
  <p style="text-align:center;color:rgba(240,240,245,0.3);font-size:12px;margin-top:32px;">
    © BLDR Agentic World
  </p>
</div>
</body>
</html>`,
  },
];

/* ─── Styles ─── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 4,
  padding: "28px",
  marginBottom: 24,
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4,
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const LABEL: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(240,240,245,0.7)",
  marginBottom: 6,
  display: "block",
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "10px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const BTN_SECONDARY: React.CSSProperties = {
  ...BTN,
  background: "rgba(255,255,255,0.06)",
};

const SLUG_COLORS: Record<string, string> = {
  welcome: "#00C853",
  "password-reset": "#FFA500",
  "subscription-expiring": "#FF6B6B",
  "system-update": "#4488FF",
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/email-templates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const seedDefaults = async () => {
    for (const t of DEFAULT_TEMPLATES) {
      // Check if slug already exists
      if (templates.some((x) => x.slug === t.slug)) continue;
      await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
    }
    await fetchTemplates();
    setMsg("תבניות ברירת מחדל נוצרו!");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        await fetchTemplates();
        setEditing(null);
        setMsg("התבנית נשמרה!");
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את התבנית?")) return;
    await fetch("/api/email-templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchTemplates();
  };

  const handleSendTest = async () => {
    if (!editing || !testEmail) return;
    setSendingTest(true);
    try {
      const res = await fetch("/api/email-templates/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: editing.id,
          toEmail: testEmail,
          variables: testVars,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("מייל בדיקה נשלח!");
      } else {
        setMsg(`שגיאה: ${data.error}`);
      }
    } catch {
      setMsg("שגיאה בשליחת מייל בדיקה");
    }
    setSendingTest(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const getPreviewHtml = () => {
    if (!editing) return "";
    let html = editing.bodyHtml;
    for (const v of editing.variables as Variable[]) {
      const val = testVars[v.key] || v.defaultValue || `{{${v.key}}}`;
      html = html.replace(new RegExp(`{{${v.key}}}`, "g"), val);
    }
    return html;
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing({ ...t });
    setShowPreview(false);
    const vars: Record<string, string> = {};
    for (const v of t.variables as Variable[]) {
      vars[v.key] = v.defaultValue || "";
    }
    setTestVars(vars);
  };

  const addVariable = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      variables: [...(editing.variables as Variable[]), { key: "", label: "", defaultValue: "" }],
    });
  };

  const updateVariable = (idx: number, field: keyof Variable, value: string) => {
    if (!editing) return;
    const vars = [...(editing.variables as Variable[])];
    vars[idx] = { ...vars[idx], [field]: value };
    setEditing({ ...editing, variables: vars });
  };

  const removeVariable = (idx: number) => {
    if (!editing) return;
    const vars = [...(editing.variables as Variable[])];
    vars.splice(idx, 1);
    setEditing({ ...editing, variables: vars });
  };

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "rgba(240,240,245,0.5)", textAlign: "center", padding: 60 }}>טוען...</div>
      </div>
    );
  }

  // ─── Editor view ───
  if (editing) {
    return (
      <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setEditing(null)} style={{ ...BTN_SECONDARY, padding: "8px 16px" }}>
              ← חזרה
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>
              {editing.name || "תבנית חדשה"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{ ...BTN_SECONDARY, padding: "8px 16px" }}
            >
              {showPreview ? "עורך" : "תצוגה מקדימה"}
            </button>
            <button onClick={handleSave} disabled={saving} style={BTN}>
              {saving ? "שומר..." : "שמור תבנית"}
            </button>
          </div>
        </div>

        {msg && (
          <div style={{
            background: msg.includes("שגיאה") ? "rgba(255,59,48,0.1)" : "rgba(0,200,83,0.1)",
            border: `1px solid ${msg.includes("שגיאה") ? "rgba(255,59,48,0.3)" : "rgba(0,200,83,0.3)"}`,
            borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13,
            color: msg.includes("שגיאה") ? "#ff6b6b" : "#00C853",
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: 24 }}>
          {/* Left: Editor */}
          <div>
            {/* Basic fields */}
            <div style={CARD}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>פרטי תבנית</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={LABEL}>שם התבנית</label>
                  <input
                    style={INPUT}
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="למשל: ברוכים הבאים"
                  />
                </div>
                <div>
                  <label style={LABEL}>מזהה (slug)</label>
                  <input
                    style={{ ...INPUT, direction: "ltr" }}
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="e.g. welcome"
                  />
                </div>
              </div>
              <div>
                <label style={LABEL}>נושא המייל (Subject)</label>
                <input
                  style={INPUT}
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="למשל: ברוך הבא ל-BLDR, {{name}}!"
                />
                <p style={{ fontSize: 11, color: "rgba(240,240,245,0.4)", marginTop: 4 }}>
                  {"השתמש ב-{{שם_משתנה}} להכנסת ערכים דינמיים"}
                </p>
              </div>
            </div>

            {/* Variables */}
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>משתנים דינמיים</h3>
                <button onClick={addVariable} style={{ ...BTN_SECONDARY, padding: "6px 14px", fontSize: 12 }}>
                  + הוסף משתנה
                </button>
              </div>
              {(editing.variables as Variable[]).length === 0 ? (
                <p style={{ color: "rgba(240,240,245,0.4)", fontSize: 13 }}>אין משתנים. לחץ "הוסף משתנה" להוספה.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(editing.variables as Variable[]).map((v, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
                      <div>
                        {i === 0 && <label style={LABEL}>מפתח (key)</label>}
                        <input
                          style={{ ...INPUT, direction: "ltr", fontSize: 13 }}
                          value={v.key}
                          onChange={(e) => updateVariable(i, "key", e.target.value)}
                          placeholder="name"
                        />
                      </div>
                      <div>
                        {i === 0 && <label style={LABEL}>תיאור</label>}
                        <input
                          style={{ ...INPUT, fontSize: 13 }}
                          value={v.label}
                          onChange={(e) => updateVariable(i, "label", e.target.value)}
                          placeholder="שם המשתמש"
                        />
                      </div>
                      <div>
                        {i === 0 && <label style={LABEL}>ערך ברירת מחדל</label>}
                        <input
                          style={{ ...INPUT, fontSize: 13 }}
                          value={v.defaultValue}
                          onChange={(e) => updateVariable(i, "defaultValue", e.target.value)}
                          placeholder="חבר/ה"
                        />
                      </div>
                      <button
                        onClick={() => removeVariable(i)}
                        style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 18, padding: "8px" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HTML Editor */}
            <div style={CARD}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>תוכן HTML</h3>
              <textarea
                value={editing.bodyHtml}
                onChange={(e) => setEditing({ ...editing, bodyHtml: e.target.value })}
                style={{
                  ...INPUT,
                  minHeight: 400,
                  fontFamily: "monospace",
                  fontSize: 13,
                  direction: "ltr",
                  textAlign: "left",
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />
            </div>

            {/* Send test */}
            <div style={CARD}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>שליחת בדיקה</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(editing.variables as Variable[]).map((v) => (
                  <div key={v.key}>
                    <label style={LABEL}>{v.label} ({`{{${v.key}}}`})</label>
                    <input
                      style={INPUT}
                      value={testVars[v.key] || ""}
                      onChange={(e) => setTestVars({ ...testVars, [v.key]: e.target.value })}
                      placeholder={v.defaultValue}
                    />
                  </div>
                ))}
                <div>
                  <label style={LABEL}>שלח לכתובת</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...INPUT, direction: "ltr" }}
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                    <button
                      onClick={handleSendTest}
                      disabled={sendingTest || !testEmail || !editing.id}
                      style={{ ...BTN, whiteSpace: "nowrap", opacity: !editing.id ? 0.5 : 1 }}
                    >
                      {sendingTest ? "שולח..." : "שלח בדיקה"}
                    </button>
                  </div>
                  {!editing.id && (
                    <p style={{ fontSize: 11, color: "rgba(255,165,0,0.7)", marginTop: 4 }}>שמור את התבנית לפני שליחת בדיקה</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div style={{ position: "sticky", top: 20, height: "fit-content" }}>
              <div style={{
                ...CARD,
                padding: 0,
                overflow: "hidden",
              }}>
                {/* Preview header bar */}
                <div style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
                  <span style={{ fontSize: 12, color: "rgba(240,240,245,0.5)", marginRight: 8 }}>
                    {editing.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => testVars[key] || (editing.variables as Variable[]).find((v) => v.key === key)?.defaultValue || `{{${key}}}`)}
                  </span>
                </div>
                <iframe
                  srcDoc={getPreviewHtml()}
                  style={{
                    width: "100%",
                    height: 600,
                    border: "none",
                    background: "#050510",
                  }}
                  title="Email preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", margin: 0 }}>תבניות אימייל</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {templates.length === 0 && (
            <button onClick={seedDefaults} style={BTN}>
              יצירת תבניות ברירת מחדל
            </button>
          )}
          <button
            onClick={() => {
              setEditing({
                id: "",
                slug: "",
                name: "",
                subject: "",
                bodyHtml: DEFAULT_TEMPLATES[0]!.bodyHtml!,
                variables: [],
                isActive: true,
                updatedAt: "",
                createdAt: "",
              });
              setTestVars({});
            }}
            style={BTN}
          >
            + תבנית חדשה
          </button>
        </div>
      </div>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: 32, fontSize: 14 }}>
        עצב, ערוך ושלח מיילים ממותגים עם משתנים דינמיים.
      </p>

      {msg && (
        <div style={{
          background: "rgba(0,200,83,0.1)",
          border: "1px solid rgba(0,200,83,0.3)",
          borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00C853",
        }}>
          {msg}
        </div>
      )}

      {templates.length === 0 ? (
        <div style={{
          ...CARD,
          textAlign: "center",
          padding: "60px 28px",
        }}>
          <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 15, marginBottom: 16 }}>
            אין תבניות עדיין
          </p>
          <p style={{ color: "rgba(240,240,245,0.4)", fontSize: 13, marginBottom: 24 }}>
            לחץ על "יצירת תבניות ברירת מחדל" ליצירת 4 תבניות מוכנות: ברוכים הבאים, איפוס סיסמה, מנוי עומד להיגמר ועדכון מערכת.
          </p>
          <button onClick={seedDefaults} style={BTN}>
            יצירת תבניות ברירת מחדל
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{
                ...CARD,
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => openEdit(t)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,255,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `${SLUG_COLORS[t.slug] || "#4488FF"}15`,
                  border: `1px solid ${SLUG_COLORS[t.slug] || "#4488FF"}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}>
                  {t.slug === "welcome" ? "👋" : t.slug === "password-reset" ? "🔑" : t.slug === "subscription-expiring" ? "⏰" : "📢"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 2, direction: "ltr", textAlign: "right" }}>
                    {t.slug} · {(t.variables as Variable[]).length} משתנים
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: t.isActive ? "rgba(0,200,83,0.1)" : "rgba(255,59,48,0.1)",
                  color: t.isActive ? "#00C853" : "#ff6b6b",
                  border: `1px solid ${t.isActive ? "rgba(0,200,83,0.2)" : "rgba(255,59,48,0.2)"}`,
                }}>
                  {t.isActive ? "פעיל" : "מושבת"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,59,48,0.2)",
                    borderRadius: 4,
                    color: "#ff6b6b",
                    fontSize: 12,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
