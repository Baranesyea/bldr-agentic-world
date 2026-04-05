"use client";

import React, { useState, useEffect, useRef } from "react";
import { LinkIcon, ChevronDownIcon } from "@/components/ui/icons";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  loadWebhooks,
  saveWebhooks,
  loadWebhookLogs,
  fillTemplate,
  saveWebhookLog,
  type Webhook,
  type WebhookLog,
} from "@/lib/webhooks";

function WebhookIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="M6 17a4 4 0 0 1 3.33-5.95" />
      <path d="M12.66 5.98A4 4 0 1 1 18.1 12" />
      <path d="M12 16v-4" />
      <path d="M12 8V4" />
    </svg>
  );
}

export default function WebhooksPage() {
  const [tab, setTab] = useState<"manage" | "log">("manage");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [filterName, setFilterName] = useState("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const templateRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setWebhooks(loadWebhooks());
    setLogs(loadWebhookLogs());
  }, []);

  function updateWebhook(id: string, patch: Partial<Webhook>) {
    setWebhooks((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, ...patch } : w));
      saveWebhooks(next);
      return next;
    });
  }

  function handleSave(id: string) {
    saveWebhooks(webhooks);
    setSaved((p) => ({ ...p, [id]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2000);
  }

  async function handleTest(webhook: Webhook) {
    if (!webhook.url) {
      setTestResults((p) => ({ ...p, [webhook.id]: { ok: false, msg: "URL is empty" } }));
      return;
    }
    setTesting((p) => ({ ...p, [webhook.id]: true }));
    const testVars: Record<string, string> = {};
    webhook.variables.forEach((v) => {
      testVars[v.key] = `[${v.key}]`;
    });
    const message = fillTemplate(webhook.messageTemplate, testVars);
    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      const responseText = await res.text().catch(() => "");
      saveWebhookLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        webhookName: webhook.name,
        webhookId: webhook.id,
        event: webhook.event,
        status: res.ok ? "success" : "fail",
        statusCode: res.status,
        messageSent: message,
        variables: testVars,
        response: responseText,
      });
      setLogs(loadWebhookLogs());
      setTestResults((p) => ({
        ...p,
        [webhook.id]: { ok: res.ok, msg: res.ok ? `${res.status} OK` : `${res.status} Error` },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setTestResults((p) => ({ ...p, [webhook.id]: { ok: false, msg } }));
    }
    setTesting((p) => ({ ...p, [webhook.id]: false }));
    setTimeout(() => setTestResults((p) => ({ ...p, [webhook.id]: undefined as unknown as { ok: boolean; msg: string } })), 4000);
  }

  function insertVariable(webhookId: string, varKey: string) {
    const ta = templateRefs.current[webhookId];
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const wh = webhooks.find((w) => w.id === webhookId);
    if (!wh) return;
    const before = wh.messageTemplate.substring(0, start);
    const after = wh.messageTemplate.substring(end);
    const newTemplate = before + `{${varKey}}` + after;
    updateWebhook(webhookId, { messageTemplate: newTemplate });
    setTimeout(() => {
      if (ta) {
        ta.focus();
        const pos = start + varKey.length + 2;
        ta.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  const filteredLogs = filterName === "all" ? logs : logs.filter((l) => l.webhookName === filterName);
  const uniqueNames = Array.from(new Set(logs.map((l) => l.webhookName)));

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #3333FF" : "2px solid transparent",
    color: active ? "#f0f0f5" : "rgba(240,240,245,0.5)",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <WebhookIcon size={28} color="rgba(240,240,245,0.6)" />
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f0f5" }}>
          וובהוקים
        </h1>
      </div>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: "12px", fontSize: "14px" }}>
        ניהול וובהוקים ומעקב אחרי שליחות.
      </p>
      <p style={{ color: "rgba(240,240,245,0.4)", marginBottom: "24px", fontSize: "13px" }}>
        הוובהוק של WhatsApp לביקורות מנוהל גם מ-<a href="/admin/reviews" style={{ color: "#4488FF", textDecoration: "none" }}>עמוד הביקורות</a>.
      </p>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px" }}>
        <button style={tabStyle(tab === "manage")} onClick={() => setTab("manage")}>
          ניהול וובהוקים
        </button>
        <button style={tabStyle(tab === "log")} onClick={() => { setTab("log"); setLogs(loadWebhookLogs()); }}>
          לוג
        </button>
      </div>

      {tab === "manage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4,
                padding: 28,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "4px" }}>
                    {wh.name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", fontFamily: "var(--font-heading-en)" }}>
                    {wh.event}
                  </span>
                </div>
                {/* Toggle */}
                <ToggleSwitch checked={wh.enabled} onChange={(v) => updateWebhook(wh.id, { enabled: v })} size="sm" />
              </div>

              {/* URL */}
              <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "6px" }}>
                Webhook URL
              </label>
              <input
                type="url"
                value={wh.url}
                onChange={(e) => updateWebhook(wh.id, { url: e.target.value })}
                placeholder="https://hooks.example.com/..."
                dir="ltr"
                style={{
                  width: "100%",
                  background: "#0a0a1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  padding: "10px 16px",
                  color: "#f0f0f5",
                  fontSize: "14px",
                  fontFamily: "var(--font-heading-en)",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              {/* Template */}
              <label style={{ display: "block", fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "6px" }}>
                תבנית הודעה
              </label>
              <textarea
                ref={(el) => { templateRefs.current[wh.id] = el; }}
                value={wh.messageTemplate}
                onChange={(e) => updateWebhook(wh.id, { messageTemplate: e.target.value })}
                rows={4}
                style={{
                  width: "100%",
                  background: "#0a0a1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  padding: "10px 16px",
                  color: "#f0f0f5",
                  fontSize: "14px",
                  resize: "vertical",
                  marginBottom: "10px",
                  boxSizing: "border-box",
                  outline: "none",
                  lineHeight: 1.6,
                }}
              />

              {/* Variable chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {wh.variables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(wh.id, v.key)}
                    title={v.description}
                    style={{
                      background: "rgba(0,0,255,0.1)",
                      border: "1px solid rgba(0,0,255,0.2)",
                      borderRadius: 4,
                      padding: "4px 12px",
                      color: "#7777FF",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "var(--font-heading-en)",
                    }}
                  >
                    {`{${v.key}}`}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleSave(wh.id)}
                  style={{
                    background: "#0000FF",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {saved[wh.id] ? "נשמר" : "שמור"}
                </button>
                <button
                  onClick={() => handleTest(wh)}
                  disabled={testing[wh.id]}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#f0f0f5",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4,
                    padding: "8px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: testing[wh.id] ? "not-allowed" : "pointer",
                    opacity: testing[wh.id] ? 0.5 : 1,
                  }}
                >
                  {testing[wh.id] ? "שולח..." : "שלח טסט"}
                </button>
                {testResults[wh.id] && (
                  <span style={{ fontSize: "13px", color: testResults[wh.id].ok ? "#00C853" : "#FF3D00" }}>
                    {testResults[wh.id].msg}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "log" && (
        <div>
          {/* Filter */}
          <div style={{ marginBottom: "16px" }}>
            <select
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              style={{
                background: "#0a0a1a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4,
                padding: "8px 16px",
                color: "#f0f0f5",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="all">כל הוובהוקים</option>
              {uniqueNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(240,240,245,0.7)", fontSize: "14px" }}>
              אין רשומות לוג
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 80px 1fr 60px 32px",
                  gap: "12px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  color: "rgba(240,240,245,0.7)",
                  fontWeight: 600,
                }}
              >
                <span>זמן</span>
                <span>וובהוק</span>
                <span>סטטוס</span>
                <span>הודעה</span>
                <span style={{ fontFamily: "var(--font-heading-en)" }}>Code</span>
                <span />
              </div>

              {filteredLogs.map((log) => (
                <div key={log.id}>
                  <div
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 80px 1fr 60px 32px",
                      gap: "12px",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: expandedLog === log.id ? "12px 12px 0 0" : 12,
                      fontSize: "13px",
                      color: "#f0f0f5",
                      cursor: "pointer",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", fontFamily: "var(--font-heading-en)", direction: "ltr", textAlign: "left" }}>
                      {new Date(log.timestamp).toLocaleString("he-IL")}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.webhookName}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: log.status === "success" ? "#00C853" : "#FF3D00",
                        background: log.status === "success" ? "rgba(0,200,83,0.1)" : "rgba(255,61,0,0.1)",
                        padding: "2px 10px",
                        borderRadius: 6,
                        textAlign: "center",
                        width: "fit-content",
                      }}
                    >
                      {log.status === "success" ? "success" : "fail"}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(240,240,245,0.7)", fontSize: "12px" }}>
                      {log.messageSent.substring(0, 60)}...
                    </span>
                    <span style={{ fontFamily: "var(--font-heading-en)", fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>
                      {log.statusCode ?? "—"}
                    </span>
                    <ChevronDownIcon
                      size={14}
                      color="rgba(240,240,245,0.35)"
                    />
                  </div>

                  {expandedLog === log.id && (
                    <div
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                        padding: "16px",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <span style={{ color: "rgba(240,240,245,0.7)", fontSize: "12px" }}>הודעה מלאה:</span>
                        <pre
                          style={{
                            background: "#0a0a1a",
                            borderRadius: 4,
                            padding: "12px",
                            color: "#f0f0f5",
                            fontSize: "12px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            marginTop: "6px",
                            lineHeight: 1.6,
                          }}
                        >
                          {log.messageSent}
                        </pre>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <span style={{ color: "rgba(240,240,245,0.7)", fontSize: "12px" }}>משתנים:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                          {Object.entries(log.variables).map(([k, v]) => (
                            <span
                              key={k}
                              style={{
                                background: "rgba(0,0,255,0.1)",
                                border: "1px solid rgba(0,0,255,0.15)",
                                borderRadius: 6,
                                padding: "2px 10px",
                                fontSize: "11px",
                                color: "#7777FF",
                                fontFamily: "var(--font-heading-en)",
                              }}
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </div>
                      {log.response && (
                        <div>
                          <span style={{ color: "rgba(240,240,245,0.7)", fontSize: "12px" }}>תגובה:</span>
                          <pre
                            style={{
                              background: "#0a0a1a",
                              borderRadius: 4,
                              padding: "12px",
                              color: "rgba(240,240,245,0.7)",
                              fontSize: "12px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              marginTop: "6px",
                            }}
                          >
                            {log.response}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
