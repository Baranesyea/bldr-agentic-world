"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

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

interface EmailLog {
  id: string;
  resendId: string | null;
  toEmail: string;
  fromEmail: string | null;
  subject: string;
  templateSlug: string | null;
  status: string;
  openedAt: string | null;
  clickedAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
  metadata: Record<string, unknown>;
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
<body style="margin:0;padding:0;background:#050510;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;direction:rtl;text-align:right;">
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
<body style="margin:0;padding:0;background:#050510;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;direction:rtl;text-align:right;">
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
<body style="margin:0;padding:0;background:#050510;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;direction:rtl;text-align:right;">
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
<body style="margin:0;padding:0;background:#050510;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;direction:rtl;text-align:right;">
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
  {
    slug: "plain-text",
    name: "טקסט נקי",
    subject: "{{subject}}",
    variables: [
      { key: "subject", label: "נושא", defaultValue: "עדכון מ-BLDR" },
      { key: "name", label: "שם המשתמש", defaultValue: "חבר/ה" },
      { key: "body", label: "תוכן", defaultValue: "תוכן ההודעה כאן." },
    ],
    bodyHtml: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;direction:rtl;text-align:right;">
  <p style="color:#333;font-size:15px;line-height:1.8;margin:0 0 16px;">
    היי {{name}},
  </p>
  <div style="color:#333;font-size:15px;line-height:1.8;margin:0 0 24px;">
    {{body}}
  </div>
  <p style="color:#333;font-size:15px;line-height:1.8;margin:24px 0 0;">
    תודה,<br>צוות BLDR
  </p>
  <div style="border-top:1px solid #eee;margin-top:32px;padding-top:16px;">
    <p style="color:#999;font-size:12px;margin:0;">BLDR — Agentic World</p>
  </div>
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
  "plain-text": "#999999",
};

/* ─── Visual Editor Component ─── */
function VisualEditor({ html, onChange }: { html: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Extract inner content from the email HTML wrapper
  const extractContent = (fullHtml: string): string => {
    // Find content between the inner card div and its closing
    const match = fullHtml.match(/border-radius:8px;padding:32px 28px;">([\s\S]*?)<\/div>\s*<\/div>\s*<p style="text-align:center/);
    if (match) return match[1].trim();
    // Fallback: try to find content div
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    return bodyMatch ? bodyMatch[1].trim() : fullHtml;
  };

  // Inject content back into the email HTML wrapper
  const injectContent = (fullHtml: string, content: string): string => {
    return fullHtml.replace(
      /(border-radius:8px;padding:32px 28px;">)([\s\S]*?)(<\/div>\s*<\/div>\s*<p style="text-align:center)/,
      `$1\n    ${content}\n  $3`
    );
  };

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = extractContent(html);
      setInitialized(true);
    }
  }, [html, initialized]);

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    syncToParent();
    editorRef.current?.focus();
  };

  const syncToParent = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    onChange(injectContent(html, content));
  };

  const insertLink = () => {
    const url = prompt("הכנס קישור (URL):");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("הכנס קישור לתמונה:");
    if (url) execCmd("insertImage", url);
  };

  const insertButton = () => {
    const text = prompt("טקסט הכפתור:", "לחץ כאן");
    const url = prompt("קישור הכפתור:");
    if (text && url) {
      const btnHtml = `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:#0000FF;color:#fff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;">${text}</a></div>`;
      document.execCommand("insertHTML", false, btnHtml);
      syncToParent();
    }
  };

  const insertVariable = () => {
    const key = prompt("שם המשתנה (למשל: name):");
    if (key) {
      document.execCommand("insertText", false, `{{${key}}}`);
      syncToParent();
    }
  };

  const TOOLBAR_BTN: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    color: "rgba(240,240,245,0.7)",
    padding: "6px 10px",
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    height: 32,
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        padding: "8px 12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "none",
        borderRadius: "4px 4px 0 0",
      }}>
        <button onClick={() => execCmd("bold")} style={{ ...TOOLBAR_BTN, fontWeight: 700 }} title="בולד">B</button>
        <button onClick={() => execCmd("italic")} style={{ ...TOOLBAR_BTN, fontStyle: "italic" }} title="נטוי">I</button>
        <button onClick={() => execCmd("underline")} style={{ ...TOOLBAR_BTN, textDecoration: "underline" }} title="קו תחתון">U</button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        <button onClick={() => execCmd("formatBlock", "h2")} style={TOOLBAR_BTN} title="כותרת">H</button>
        <button onClick={() => execCmd("formatBlock", "p")} style={TOOLBAR_BTN} title="פסקה">P</button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        <button onClick={() => execCmd("justifyRight")} style={TOOLBAR_BTN} title="ימין">⫢</button>
        <button onClick={() => execCmd("justifyCenter")} style={TOOLBAR_BTN} title="מרכז">≡</button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        <button onClick={insertLink} style={TOOLBAR_BTN} title="קישור">🔗</button>
        <button onClick={insertImage} style={TOOLBAR_BTN} title="תמונה">🖼</button>
        <button onClick={insertButton} style={TOOLBAR_BTN} title="כפתור CTA">⬜ כפתור</button>
        <button onClick={insertVariable} style={{ ...TOOLBAR_BTN, fontFamily: "monospace", fontSize: 11 }} title="משתנה דינמי">{"{{x}}"}</button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        <button onClick={() => execCmd("foreColor", "#ffffff")} style={{ ...TOOLBAR_BTN, color: "#fff" }} title="לבן">A</button>
        <button onClick={() => execCmd("foreColor", "#00C853")} style={{ ...TOOLBAR_BTN, color: "#00C853" }} title="ירוק">A</button>
        <button onClick={() => execCmd("foreColor", "#4488FF")} style={{ ...TOOLBAR_BTN, color: "#4488FF" }} title="כחול">A</button>
        <button onClick={() => execCmd("foreColor", "#ff6b6b")} style={{ ...TOOLBAR_BTN, color: "#ff6b6b" }} title="אדום">A</button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncToParent}
        onBlur={syncToParent}
        dir="rtl"
        style={{
          ...INPUT,
          minHeight: 300,
          lineHeight: 1.7,
          fontSize: 15,
          borderRadius: "0 0 4px 4px",
          padding: "20px 24px",
          outline: "none",
          overflowY: "auto",
        }}
      />
    </div>
  );
}

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
  const [tab, setTab] = useState<"templates" | "logs">("templates");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

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

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/email-logs");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch {}
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (tab === "logs" && logs.length === 0) fetchLogs();
  }, [tab, logs.length, fetchLogs]);

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

            {/* Content Editor */}
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>תוכן</h3>
                <div style={{ display: "flex", gap: 0, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => setEditorMode("visual")}
                    style={{
                      padding: "6px 14px", fontSize: 12, border: "none", cursor: "pointer",
                      background: editorMode === "visual" ? "rgba(0,0,255,0.2)" : "rgba(255,255,255,0.03)",
                      color: editorMode === "visual" ? "#8888ff" : "rgba(240,240,245,0.5)",
                      fontWeight: editorMode === "visual" ? 600 : 400,
                    }}
                  >
                    עורך ויזואלי
                  </button>
                  <button
                    onClick={() => setEditorMode("html")}
                    style={{
                      padding: "6px 14px", fontSize: 12, border: "none", cursor: "pointer",
                      background: editorMode === "html" ? "rgba(0,0,255,0.2)" : "rgba(255,255,255,0.03)",
                      color: editorMode === "html" ? "#8888ff" : "rgba(240,240,245,0.5)",
                      fontWeight: editorMode === "html" ? 600 : 400,
                    }}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {editorMode === "html" ? (
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
              ) : (
                <VisualEditor
                  html={editing.bodyHtml}
                  onChange={(html) => setEditing({ ...editing, bodyHtml: html })}
                />
              )}
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

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    sent: { bg: "rgba(68,136,255,0.1)", color: "#4488FF" },
    delivered: { bg: "rgba(0,200,83,0.1)", color: "#00C853" },
    opened: { bg: "rgba(156,39,176,0.1)", color: "#CE93D8" },
    clicked: { bg: "rgba(0,200,83,0.15)", color: "#69F0AE" },
    bounced: { bg: "rgba(255,59,48,0.1)", color: "#ff6b6b" },
    complained: { bg: "rgba(255,59,48,0.15)", color: "#ff4444" },
  };

  const STATUS_LABELS: Record<string, string> = {
    sent: "נשלח",
    delivered: "הגיע",
    opened: "נפתח",
    clicked: "נלחץ",
    bounced: "חזר",
    complained: "דווח כספאם",
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  // ─── List view ───
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", margin: 0 }}>תבניות אימייל</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "templates" && templates.length === 0 && (
            <button onClick={seedDefaults} style={BTN}>
              יצירת תבניות ברירת מחדל
            </button>
          )}
          {tab === "templates" && (
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
          )}
          {tab === "logs" && (
            <button onClick={fetchLogs} style={BTN_SECONDARY}>
              רענן
            </button>
          )}
        </div>
      </div>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: 24, fontSize: 14 }}>
        עצב, ערוך ושלח מיילים ממותגים עם משתנים דינמיים.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {([["templates", "תבניות"], ["logs", "לוג שליחות"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 24px",
              background: "none",
              border: "none",
              borderBottom: tab === key ? "2px solid #4444ff" : "2px solid transparent",
              color: tab === key ? "#f0f0f5" : "rgba(240,240,245,0.5)",
              fontSize: 14,
              fontWeight: tab === key ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          background: "rgba(0,200,83,0.1)",
          border: "1px solid rgba(0,200,83,0.3)",
          borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00C853",
        }}>
          {msg}
        </div>
      )}

      {/* ─── Templates Tab ─── */}
      {tab === "templates" && (
        <>
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
                לחץ על &quot;יצירת תבניות ברירת מחדל&quot; ליצירת 4 תבניות מוכנות: ברוכים הבאים, איפוס סיסמה, מנוי עומד להיגמר ועדכון מערכת.
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
                      {t.slug === "welcome" ? "👋" : t.slug === "password-reset" ? "🔑" : t.slug === "subscription-expiring" ? "⏰" : t.slug === "plain-text" ? "📝" : "📢"}
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
        </>
      )}

      {/* ─── Logs Tab ─── */}
      {tab === "logs" && (
        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
          {logsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>טוען...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>אין שליחות עדיין</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>נמען</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>נושא</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>תבנית</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>סטטוס</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>נפתח</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>נשלח</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const sc = STATUS_COLORS[log.status] || STATUS_COLORS.sent;
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 16px", color: "#f0f0f5", direction: "ltr", textAlign: "right" }}>{log.toEmail}</td>
                        <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.7)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.subject}</td>
                        <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.5)" }}>{log.templateSlug || "—"}</td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <span style={{
                            fontSize: 11, padding: "2px 10px", borderRadius: 20,
                            background: sc.bg, color: sc.color,
                          }}>
                            {STATUS_LABELS[log.status] || log.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", color: log.openedAt ? "#CE93D8" : "rgba(240,240,245,0.3)", fontSize: 12 }}>
                          {formatDate(log.openedAt)}
                        </td>
                        <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.5)", fontSize: 12 }}>
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
