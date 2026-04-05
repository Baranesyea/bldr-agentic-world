"use client";

import React, { useState, useEffect } from "react";

interface Review {
  id: string;
  userEmail: string;
  userName: string | null;
  stars: number;
  text: string | null;
  wantsVideo: boolean;
  videoSent: boolean;
  webhookSent: boolean;
  triggerType: string | null;
  createdAt: string;
}

interface Trigger {
  type: string;
  label: string;
  minutesInSystem?: number;
  loginCount?: number;
  enabled: boolean;
}

interface ReviewSettings {
  enabled: boolean;
  triggers: Trigger[];
  webhookUrl: string;
  webhookEnabled: boolean;
  popupTitle: string;
  lowRatingMessage: string;
  highRatingMessage: string;
  videoAcceptedMessage: string;
}

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

export default function ReviewsAdminPage() {
  const [tab, setTab] = useState<"settings" | "reviews">("reviews");
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/reviews/settings").then(r => r.json()),
      fetch("/api/reviews").then(r => r.json()),
    ]).then(([s, r]) => {
      setSettings(s);
      if (Array.isArray(r)) setReviews(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/reviews/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setMsg("נשמר!");
    setTimeout(() => setMsg(""), 3000);
  };

  const avgStars = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : "—";

  const videoRequests = reviews.filter(r => r.wantsVideo).length;

  if (loading || !settings) {
    return (
      <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "rgba(240,240,245,0.5)", textAlign: "center", padding: 60 }}>טוען...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>ביקורות</h1>
      <p style={{ color: "rgba(240,240,245,0.7)", marginBottom: 24, fontSize: 14 }}>
        ניהול ביקורות משתמשים, הגדרת טריגרים ווובהוק.
      </p>

      {msg && (
        <div style={{ background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00C853" }}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "סה״כ ביקורות", value: reviews.length.toString(), color: "#f0f0f5" },
          { label: "ממוצע כוכבים", value: avgStars, color: "#FFD700" },
          { label: "בקשות סרטון", value: videoRequests.toString(), color: "#CE93D8" },
          { label: "5 כוכבים", value: reviews.filter(r => r.stars === 5).length.toString(), color: "#00C853" },
        ].map((s, i) => (
          <div key={i} style={{ ...CARD, marginBottom: 0, textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {([["reviews", "ביקורות"], ["settings", "הגדרות"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 24px", background: "none", border: "none",
              borderBottom: tab === key ? "2px solid #4444ff" : "2px solid transparent",
              color: tab === key ? "#f0f0f5" : "rgba(240,240,245,0.5)",
              fontSize: 14, fontWeight: tab === key ? 600 : 400, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
          {reviews.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(240,240,245,0.5)" }}>אין ביקורות עדיין</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>משתמש</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>דירוג</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>טקסט</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>סרטון</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "rgba(240,240,245,0.5)", fontWeight: 500, fontSize: 12 }}>תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ color: "#f0f0f5", fontSize: 13 }}>{r.userName || "—"}</div>
                        <div style={{ color: "rgba(240,240,245,0.4)", fontSize: 11, direction: "ltr", textAlign: "right" }}>{r.userEmail}</div>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <span style={{ color: "#FFD700", fontSize: 16 }}>
                          {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.7)", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.text || "—"}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        {r.wantsVideo ? (
                          <span style={{
                            fontSize: 11, padding: "2px 10px", borderRadius: 20,
                            background: r.webhookSent ? "rgba(0,200,83,0.1)" : "rgba(255,165,0,0.1)",
                            color: r.webhookSent ? "#00C853" : "#FFA500",
                          }}>
                            {r.webhookSent ? "נשלח" : "ממתין"}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(240,240,245,0.3)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px", color: "rgba(240,240,245,0.5)", fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <>
          {/* Enable/disable */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f5" }}>פופאפ ביקורות פעיל</div>
                <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginTop: 4 }}>
                  {settings.enabled ? "הפופאפ יוצג למשתמשים" : "הפופאפ מושבת"}
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                  background: settings.enabled ? "#00C853" : "rgba(255,255,255,0.1)",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, right: settings.enabled ? 3 : 27, transition: "right 0.2s" }} />
              </button>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>טריגרים</h3>
            {settings.triggers.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 4, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => {
                      const triggers = [...settings.triggers];
                      triggers[i] = { ...triggers[i], enabled: !triggers[i].enabled };
                      setSettings({ ...settings, triggers });
                    }}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                      background: t.enabled ? "#00C853" : "rgba(255,255,255,0.1)",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, right: t.enabled ? 3 : 21, transition: "right 0.2s" }} />
                  </button>
                  <span style={{ color: "#f0f0f5", fontSize: 14 }}>{t.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)" }}>
                  {t.type === "time" ? `${t.minutesInSystem} דקות` : `${t.loginCount} התחברויות`}
                </div>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div style={CARD}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>טקסטים</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>כותרת הפופאפ</label>
              <input style={INPUT} value={settings.popupTitle} onChange={(e) => setSettings({ ...settings, popupTitle: e.target.value })} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>הודעה לדירוג נמוך (1-3 כוכבים)</label>
              <textarea style={{ ...INPUT, minHeight: 80, resize: "vertical" }} value={settings.lowRatingMessage} onChange={(e) => setSettings({ ...settings, lowRatingMessage: e.target.value })} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>הודעה לדירוג גבוה (4-5 כוכבים)</label>
              <textarea style={{ ...INPUT, minHeight: 80, resize: "vertical" }} value={settings.highRatingMessage} onChange={(e) => setSettings({ ...settings, highRatingMessage: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>הודעה אחרי אישור סרטון</label>
              <input style={INPUT} value={settings.videoAcceptedMessage} onChange={(e) => setSettings({ ...settings, videoAcceptedMessage: e.target.value })} />
            </div>
          </div>

          {/* Webhook */}
          <div style={CARD}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", margin: "0 0 16px" }}>וובהוק (WhatsApp)</h3>
            <p style={{ fontSize: 13, color: "rgba(240,240,245,0.4)", marginBottom: 16 }}>
              כשמשתמש מסכים לשלוח סרטון, נשלחת הודעה לוובהוק שלך (למשל Make/Zapier) ששולח הודעת WhatsApp.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => setSettings({ ...settings, webhookEnabled: !settings.webhookEnabled })}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                  background: settings.webhookEnabled ? "#00C853" : "rgba(255,255,255,0.1)",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, right: settings.webhookEnabled ? 3 : 21, transition: "right 0.2s" }} />
              </button>
              <span style={{ color: "#f0f0f5", fontSize: 14 }}>וובהוק פעיל</span>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>כתובת וובהוק</label>
              <input style={{ ...INPUT, direction: "ltr" }} value={settings.webhookUrl} onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })} placeholder="https://hook.make.com/..." />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={BTN}>
            {saving ? "שומר..." : "שמור הגדרות"}
          </button>
        </>
      )}
    </div>
  );
}
