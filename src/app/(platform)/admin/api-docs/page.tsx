"use client";

import React, { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

const SECTION: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
  padding: "24px",
  marginBottom: "20px",
};

const CODE: React.CSSProperties = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px",
  padding: "16px",
  fontFamily: "ui-monospace, Menlo, monospace",
  fontSize: "13px",
  lineHeight: 1.6,
  whiteSpace: "pre",
  overflowX: "auto",
  color: "#e6e6e6",
  direction: "ltr",
  textAlign: "left",
};

const METHOD: Record<string, string> = {
  GET: "#4ade80",
  POST: "#60a5fa",
  PUT: "#fbbf24",
  DELETE: "#f87171",
};

function MethodPill({ method }: { method: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: METHOD[method] + "22",
        color: METHOD[method],
        border: `1px solid ${METHOD[method]}44`,
        padding: "2px 10px",
        borderRadius: "3px",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: "12px",
        fontWeight: 600,
        marginInlineEnd: "8px",
      }}
    >
      {method}
    </span>
  );
}

function CopyAllButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        background: copied ? "rgba(74, 222, 128, 0.15)" : "rgba(51, 51, 255, 0.15)",
        border: `1px solid ${copied ? "rgba(74, 222, 128, 0.4)" : "rgba(51, 51, 255, 0.4)"}`,
        color: copied ? "#4ade80" : "#8888ff",
        padding: "10px 16px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? "הועתק לזיכרון" : "העתק הכל לסוכן"}
    </button>
  );
}

function CodeBlock({ code, id }: { code: string; id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label={`copy ${id}`}
        style={{
          position: "absolute",
          top: 8,
          insetInlineEnd: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 3,
          padding: "4px 8px",
          cursor: "pointer",
          color: "#aaa",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
        }}
      >
        {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        {copied ? "הועתק" : "העתק"}
      </button>
      <pre style={CODE}>{code}</pre>
    </div>
  );
}

function Endpoint({
  method,
  path,
  title,
  description,
  children,
}: {
  method: string;
  path: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={SECTION}>
      <div style={{ marginBottom: 8 }}>
        <MethodPill method={method} />
        <code style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 15, color: "#fff" }}>
          {path}
        </code>
      </div>
      <h3 style={{ fontSize: 18, margin: "8px 0 6px", color: "#fff" }}>{title}</h3>
      <p style={{ color: "#bbb", margin: "0 0 16px", lineHeight: 1.6 }}>{description}</p>
      {children}
    </div>
  );
}

function FieldTable({
  rows,
}: {
  rows: { name: string; type: string; required?: boolean; desc: string }[];
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
        marginBottom: 12,
      }}
    >
      <thead>
        <tr style={{ color: "#888", textAlign: "start" as const }}>
          <th style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "start" }}>שדה</th>
          <th style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "start" }}>סוג</th>
          <th style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "start" }}>חובה</th>
          <th style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "start" }}>תיאור</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "ui-monospace, Menlo, monospace", color: "#fff" }}>
              {r.name}
            </td>
            <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "ui-monospace, Menlo, monospace", color: "#888" }}>
              {r.type}
            </td>
            <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: r.required ? "#f87171" : "#666" }}>
              {r.required ? "כן" : "לא"}
            </td>
            <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#ccc" }}>{r.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ApiDocsPage() {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://app.bldr.co.il";

  const createCurl = `curl -X POST '${baseUrl}/api/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "email": "user@example.com",
    "fullName": "שם מלא",
    "password": "SecurePass123",
    "phone": "0501234567",
    "schoolId": "SCHOOL_UUID",
    "courseIds": ["COURSE_UUID_1", "COURSE_UUID_2"],
    "accessExpiresAt": "2026-12-31T23:59:59Z",
    "expiryMode": "full_lock",
    "priceAmount": 299,
    "billingCycle": "monthly",
    "subscriptionStartedAt": "2026-04-18T00:00:00Z"
  }'`;

  const inviteCurl = `curl -X POST '${baseUrl}/api/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "email": "user@example.com",
    "fullName": "שם מלא",
    "sendInvite": true,
    "schoolId": "SCHOOL_UUID"
  }'`;

  const getCurl = `curl '${baseUrl}/api/v1/users/user@example.com' \\
  -H 'x-api-key: YOUR_API_KEY'`;

  const accessCurl = `curl -X POST '${baseUrl}/api/v1/users/user@example.com/access' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "schoolId": "SCHOOL_UUID",
    "courseIds": ["COURSE_UUID_1"],
    "accessExpiresAt": "2026-12-31T23:59:59Z",
    "expiryMode": "full_lock"
  }'`;

  const revokeCurl = `curl -X POST '${baseUrl}/api/v1/users/user@example.com/access' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "schoolId": "SCHOOL_UUID",
    "removeSchool": true
  }'`;

  const newsPostCurl = `curl -X POST '${baseUrl}/api/news' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "כותרת העדכון",
    "description": "תיאור מפורט של העדכון",
    "imageUrl": "https://..."
  }'`;

  const newsBulkCurl = `curl -X POST '${baseUrl}/api/news' \\
  -H 'Content-Type: application/json' \\
  -d '[
    { "title": "עדכון 1", "description": "..." },
    { "title": "עדכון 2", "description": "..." }
  ]'`;

  const courseAccessCurl = `curl -X POST '${baseUrl}/api/v1/users/user@example.com/access' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "schoolId": "SCHOOL_UUID",
    "courseAccess": [
      { "courseId": "COURSE_UUID_1", "isAvailable": true },
      { "courseId": "COURSE_UUID_2", "isAvailable": false }
    ]
  }'`;

  const agentMarkdown = `# BLDR Platform API

REST API for creating users and managing school/course access from external systems.

Base URL: \`${baseUrl}/api/v1\`

## Authentication

All /api/v1 endpoints require the \`x-api-key\` header matching the \`PUBLIC_API_KEY\` env var on the server.

\`\`\`
x-api-key: YOUR_API_KEY
\`\`\`

The \`/api/news\` endpoint is public and does NOT require authentication.

---

## POST /api/v1/users — Create or update user

Creates a Supabase auth user, syncs to \`users\` + \`members\` tables, optionally attaches to a school and grants course access — all in one call. If the email already exists, updates password (if provided) and merges access.

### Body fields
- \`email\` (string, required) — user email
- \`fullName\` (string, required) — full name
- \`password\` (string, optional) — min 6 chars. If omitted or \`sendInvite=true\`, an invite email is sent instead.
- \`sendInvite\` (boolean, optional) — force invite flow (user sets own password)
- \`phone\` (string, optional) — phone number
- \`schoolId\` (uuid, optional) — school to attach the user to
- \`courseIds\` (uuid[], optional) — courses to grant access to (within the school)
- \`accessExpiresAt\` (ISO date, optional) — access expiry
- \`expiryMode\` ("full_lock" | "partial_lock", optional, default "full_lock") — behavior on expiry
- \`role\` ("member" | "admin" | "tourist", optional, default "member")
- \`priceAmount\` (number, optional) — amount the user pays (per cycle for monthly, total for one_time)
- \`billingCycle\` ("monthly" | "one_time", optional, default "one_time") — recurring vs one-time. Required for cancellation flow.
- \`subscriptionStartedAt\` (ISO date, optional, default = now) — anchor for monthly billing anniversary. Used to compute cancellation effective date.

### Example: create with password
${createCurl}

### Example: send invite
${inviteCurl}

### Response (201 created, 200 if existed)
\`\`\`json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "שם מלא",
    "role": "member",
    "schoolId": "uuid",
    "courseIds": ["uuid"],
    "accessExpiresAt": "2026-12-31T23:59:59.000Z",
    "expiryMode": "full_lock",
    "priceAmount": 299,
    "billingCycle": "monthly",
    "subscriptionStartedAt": "2026-04-18T00:00:00.000Z"
  },
  "created": true,
  "invited": false
}
\`\`\`

---

## GET /api/v1/users/:id — Get user

\`:id\` can be a UUID or email. Returns user, membership, school attachments, course access overrides.

${getCurl}

### Response
\`\`\`json
{
  "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "member", "createdAt": "..." },
  "member": {
    "status": "active", "type": "paid", "phone": "...",
    "schoolId": "uuid", "accessExpiresAt": "...", "expiryMode": "full_lock",
    "priceAmount": 299, "billingCycle": "monthly",
    "subscriptionStartedAt": "...",
    "cancellationRequestedAt": null,
    "cancellationEffectiveAt": null
  },
  "schools": [{ "schoolId": "uuid", "role": "student", "accessExpiresAt": "...", "expiryMode": "full_lock" }],
  "courseAccess": [{ "courseId": "uuid", "schoolId": "uuid", "isAvailable": true }]
}
\`\`\`

---

## POST /api/v1/users/:id/access — Manage access

Add/update school membership, grant or revoke course access. \`:id\` can be UUID or email.

### Body fields
- \`schoolId\` (uuid, optional) — school to attach/detach
- \`courseIds\` (uuid[], optional) — shorthand: all listed courses get \`isAvailable=true\`
- \`courseAccess\` ({courseId, isAvailable}[], optional) — explicit per-course control, supports revoking
- \`removeSchool\` (boolean, optional) — when true + \`schoolId\`, removes the user from the school
- \`accessExpiresAt\` (ISO date | null, optional) — null clears expiry
- \`expiryMode\` ("full_lock" | "partial_lock", optional, default "full_lock")

### Example: add school + courses
${accessCurl}

### Example: per-course control
${courseAccessCurl}

### Example: remove from school
${revokeCurl}

---

## Subscription fields (billing + cancellation)

Set these when creating a monthly-billing user so the user can later cancel from their profile and a webhook is fired:

\`\`\`json
{
  "priceAmount": 299,
  "billingCycle": "monthly",
  "subscriptionStartedAt": "2026-04-18T00:00:00Z"
}
\`\`\`

- \`billingCycle\` must be \`"monthly"\` for the cancellation UI to appear on the user's profile.
- \`subscriptionStartedAt\` is the billing anniversary. If user started 2026-03-03 and cancels 2026-05-05, their access stays until the next anniversary = 2026-06-03.
- One-time purchases: omit \`billingCycle\` or set \`"one_time"\`. Cancellation flow is disabled for them.

When a user cancels, the system fires the \`subscription.canceled\` webhook (configured under /admin/webhooks) with payload variables: \`fullName\`, \`email\`, \`phone\`, \`priceAmount\`, \`billingCycle\`, \`effectiveAt\`, \`cancelledAt\`.

---

## /api/news — Public news feed (no auth)

Stores up to 10 latest items. Used by agents to push updates to the home feed.

### POST /api/news — add news
Accepts a single object or an array. Each item requires \`title\` and \`description\`. \`imageUrl\` is optional.

${newsPostCurl}

Bulk:
${newsBulkCurl}

### GET /api/news — list latest
\`\`\`
curl ${baseUrl}/api/news
\`\`\`

### DELETE /api/news?id=xxx — delete by id
\`\`\`
curl -X DELETE '${baseUrl}/api/news?id=NEWS_ID'
\`\`\`

---

## Error codes
- \`400\` — invalid/missing body (email missing, bad JSON, invalid expiryMode)
- \`401\` — missing or wrong x-api-key
- \`404\` — user not found (on :id routes)
- \`500\` — server env misconfigured (PUBLIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY missing)

---

## Access resolution model

Course availability for a user in a school context resolves in this order:
1. \`userCourseAccess\` — per-user override (wins)
2. \`schoolCourses\` — school-level availability
3. Default: available

\`expiryMode\`:
- \`full_lock\` — locks everything after expiry
- \`partial_lock\` — courses flagged \`availableAfterExpiry=true\` stay open
`;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 980, margin: "0 auto", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <h1 style={{ fontSize: 32, color: "#fff", margin: 0 }}>API Documentation</h1>
        <CopyAllButton markdown={agentMarkdown} />
      </div>
      <p style={{ color: "#aaa", marginBottom: 24, lineHeight: 1.6 }}>
        REST API ליצירת משתמשים וניהול הרשאות לבתי ספר וקורסים ממערכות חיצוניות.
      </p>

      <div style={SECTION}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: "#fff" }}>אימות</h2>
        <p style={{ color: "#ccc", lineHeight: 1.7, marginBottom: 12 }}>
          כל הקריאות דורשות header <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 3 }}>x-api-key</code> עם המפתח המוגדר ב-
          <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 3 }}>PUBLIC_API_KEY</code> ב-env של השרת.
        </p>
        <CodeBlock id="env" code={`# .env.local
PUBLIC_API_KEY=your-long-random-secret-here`} />
        <p style={{ color: "#888", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
          המפתח מועבר ב-header, לא ב-URL. יצירה מומלצת: <code>openssl rand -hex 32</code>.
          החלפת מפתח דורשת עדכון ה-env והפעלה מחדש של השרת.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: "#fff" }}>Base URL</h2>
        <CodeBlock id="base" code={`${baseUrl}/api/v1`} />
      </div>

      <h2 style={{ fontSize: 22, margin: "32px 0 16px", color: "#fff" }}>Endpoints</h2>

      <Endpoint
        method="POST"
        path="/api/v1/users"
        title="יצירת משתמש חדש"
        description="יוצר משתמש ב-Supabase Auth, רושם אותו בטבלאות users ו-members, ויכול לצרף אותו לבית ספר ולקורסים בקריאה אחת. אם המייל כבר קיים — מעדכן את הסיסמה (אם סופקה) וההרשאות."
      >
        <h4 style={{ color: "#fff", margin: "12px 0 8px", fontSize: 14 }}>Body</h4>
        <FieldTable
          rows={[
            { name: "email", type: "string", required: true, desc: "מייל המשתמש" },
            { name: "fullName", type: "string", required: true, desc: "שם מלא" },
            { name: "password", type: "string", desc: "לפחות 6 תווים. אם לא סופק ו-sendInvite=false, נשלח invite אוטומטית" },
            { name: "sendInvite", type: "boolean", desc: "אם true — נשלח מייל הזמנה להגדרת סיסמה (במקום ליצור עם סיסמה)" },
            { name: "schoolId", type: "uuid", desc: "מזהה בית ספר לצירוף המשתמש" },
            { name: "courseIds", type: "uuid[]", desc: "רשימת קורסים להענקת גישה (מתוך בית הספר)" },
            { name: "accessExpiresAt", type: "ISO date", desc: "תאריך פקיעת גישה" },
            { name: "expiryMode", type: "full_lock | partial_lock", desc: "מצב פקיעה. ברירת מחדל: full_lock" },
            { name: "role", type: "member | admin | tourist", desc: "תפקיד ב-users.role. ברירת מחדל: member" },
            { name: "phone", type: "string", desc: "מספר טלפון. עובר לטבלת members" },
            { name: "priceAmount", type: "number", desc: "סכום התשלום (למחזור חודשי או סכום חד-פעמי)" },
            { name: "billingCycle", type: "monthly | one_time", desc: "סוג חיוב. ברירת מחדל: one_time. חובה monthly כדי לאפשר ביטול מנוי מצד המשתמש" },
            { name: "subscriptionStartedAt", type: "ISO date", desc: "תאריך תחילת המנוי (עוגן ליום החיוב החודשי). ברירת מחדל: עכשיו" },
          ]}
        />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>דוגמה: יצירה עם סיסמה</h4>
        <CodeBlock id="create" code={createCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>דוגמה: שליחת הזמנה</h4>
        <CodeBlock id="invite" code={inviteCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>תגובה</h4>
        <CodeBlock
          id="create-response"
          code={`{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "שם מלא",
    "role": "member",
    "schoolId": "uuid",
    "courseIds": ["uuid"],
    "accessExpiresAt": "2026-12-31T23:59:59.000Z",
    "expiryMode": "full_lock"
  },
  "created": true,
  "invited": false
}`}
        />
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/v1/users/:id"
        title="קבלת פרטי משתמש"
        description="מחזיר פרטי משתמש, חברות בבתי ספר והרשאות קורסים. ה-:id יכול להיות UUID או מייל."
      >
        <CodeBlock id="get" code={getCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>תגובה</h4>
        <CodeBlock
          id="get-response"
          code={`{
  "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "member", "createdAt": "..." },
  "member": { "status": "active", "type": "free", "schoolId": "uuid", "accessExpiresAt": "...", "expiryMode": "full_lock" },
  "schools": [
    { "schoolId": "uuid", "role": "student", "accessExpiresAt": "...", "expiryMode": "full_lock" }
  ],
  "courseAccess": [
    { "courseId": "uuid", "schoolId": "uuid", "isAvailable": true }
  ]
}`}
        />
      </Endpoint>

      <Endpoint
        method="POST"
        path="/api/v1/users/:id/access"
        title="ניהול הרשאות"
        description="מוסיף/מעדכן חברות בית ספר או הרשאות קורסים למשתמש קיים. ה-:id יכול להיות UUID או מייל."
      >
        <h4 style={{ color: "#fff", margin: "12px 0 8px", fontSize: 14 }}>Body</h4>
        <FieldTable
          rows={[
            { name: "schoolId", type: "uuid", desc: "מזהה בית ספר" },
            { name: "courseIds", type: "uuid[]", desc: "קורסים להענקת גישה (shorthand — כל הקורסים מקבלים isAvailable=true)" },
            { name: "courseAccess", type: "{courseId, isAvailable}[]", desc: "שליטה מפורשת לכל קורס — מאפשר גם לשלול גישה" },
            { name: "removeSchool", type: "boolean", desc: "אם true + schoolId — מסיר את המשתמש מבית הספר" },
            { name: "accessExpiresAt", type: "ISO date | null", desc: "תאריך פקיעה. null לביטול" },
            { name: "expiryMode", type: "full_lock | partial_lock", desc: "ברירת מחדל: full_lock" },
          ]}
        />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>דוגמה: הוספת בית ספר + קורסים</h4>
        <CodeBlock id="access" code={accessCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>דוגמה: שליטה פר-קורס</h4>
        <CodeBlock id="course-access" code={courseAccessCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>דוגמה: הסרת בית ספר</h4>
        <CodeBlock id="revoke" code={revokeCurl} />
      </Endpoint>

      <div style={SECTION}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: "#fff" }}>קודי שגיאה</h2>
        <FieldTable
          rows={[
            { name: "400", type: "", desc: "גוף הבקשה חסר/לא תקין (email חסר, JSON שגוי, expiryMode לא חוקי)" },
            { name: "401", type: "", desc: "x-api-key חסר או שגוי" },
            { name: "404", type: "", desc: "משתמש לא נמצא (בקריאות ל-:id)" },
            { name: "500", type: "", desc: "PUBLIC_API_KEY או SUPABASE_SERVICE_ROLE_KEY לא מוגדרים בשרת" },
          ]}
        />
      </div>

      <h2 style={{ fontSize: 22, margin: "32px 0 16px", color: "#fff" }}>חדשות (ללא אימות)</h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        endpoint ציבורי לשליחת עדכונים למסך הראשי. לא דורש x-api-key. שומר עד 10 עדכונים אחרונים.
      </p>

      <Endpoint
        method="POST"
        path="/api/news"
        title="הוספת עדכון חדשות"
        description="מקבל אובייקט יחיד או מערך. כל פריט חייב title ו-description. imageUrl אופציונלי."
      >
        <h4 style={{ color: "#fff", margin: "12px 0 8px", fontSize: 14 }}>עדכון יחיד</h4>
        <CodeBlock id="news-single" code={newsPostCurl} />
        <h4 style={{ color: "#fff", margin: "16px 0 8px", fontSize: 14 }}>מספר עדכונים (batch)</h4>
        <CodeBlock id="news-bulk" code={newsBulkCurl} />
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api/news"
        title="קריאת חדשות"
        description="מחזיר את 10 העדכונים האחרונים במערך."
      >
        <CodeBlock id="news-get" code={`curl '${baseUrl}/api/news'`} />
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/api/news?id=xxx"
        title="מחיקת עדכון"
        description="מחיקה לפי id של העדכון."
      >
        <CodeBlock id="news-delete" code={`curl -X DELETE '${baseUrl}/api/news?id=NEWS_ID'`} />
      </Endpoint>

      <div style={SECTION}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: "#fff" }}>מודל ההרשאות</h2>
        <p style={{ color: "#ccc", lineHeight: 1.8, marginBottom: 8 }}>
          סדר העדיפות ברזולוציית גישה לקורס:
        </p>
        <ol style={{ color: "#ccc", lineHeight: 1.8, paddingInlineStart: 20 }}>
          <li>
            <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 3 }}>userCourseAccess</code> — override פר-משתמש (מנצח)
          </li>
          <li>
            <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 3 }}>schoolCourses</code> — זמינות ברמת בית הספר
          </li>
          <li>ברירת מחדל: זמין</li>
        </ol>
        <p style={{ color: "#888", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
          <strong>expiryMode:</strong> <code>full_lock</code> נועל הכל בפקיעה. <code>partial_lock</code> משאיר קורסים עם <code>availableAfterExpiry=true</code> פתוחים.
        </p>
      </div>
    </div>
  );
}
