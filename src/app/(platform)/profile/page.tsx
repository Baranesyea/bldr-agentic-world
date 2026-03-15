"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrophyIcon, BookIcon, FireIcon, NotebookIcon, SettingsIcon } from "@/components/ui/icons";

interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  avatarGenerated: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "ערן בראון",
  email: "eran@bldr.co.il",
  avatarUrl: "",
  role: "Architect",
  avatarGenerated: false,
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN_PRIMARY: React.CSSProperties = {
  background: "#0000FF",
  color: "white",
  padding: "10px 24px",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: "14px",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 0 15px rgba(0,0,255,0.2)",
};

const BTN_SECONDARY: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "#f0f0f5",
  padding: "10px 24px",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [genError, setGenError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bldr_user_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        setEditName(parsed.name);
      } else {
        setEditName(DEFAULT_PROFILE.name);
      }
    } catch {}
    try {
      const settings = JSON.parse(localStorage.getItem("bldr_user_settings") || "{}");
      if (typeof settings.autoPlayNext === "boolean") setAutoPlayNext(settings.autoPlayNext);
    } catch {}
  }, []);

  const saveProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    localStorage.setItem("bldr_user_profile", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      saveProfile({ name: editName.trim() });
      setEditing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      saveProfile({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const generateCanvasAvatar = (gender: "male" | "female"): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, gender === "female" ? "#4a0072" : "#000066");
    grad.addColorStop(0.5, gender === "female" ? "#7b2fbe" : "#0000CC");
    grad.addColorStop(1, gender === "female" ? "#c74bff" : "#3333FF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle pattern
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 80 + 20, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Avatar silhouette
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    // Head
    ctx.beginPath();
    ctx.arc(256, 180, 80, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.ellipse(256, 420, 130, 150, 0, Math.PI, 0);
    ctx.fill();

    // Initials
    const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 256, 256);

    return canvas.toDataURL("image/png");
  };

  const handleGenerateAvatar = async (gender: "male" | "female") => {
    setShowGenderPicker(false);
    setGenerating(true);
    setGenError("");

    // Check if API key exists
    let apiKey = "";
    try {
      const keys = JSON.parse(localStorage.getItem("bldr_api_keys") || "[]");
      const nanoBanana = keys.find((k: { label: string; value: string }) =>
        k.label.toLowerCase().includes("nano banana")
      );
      if (nanoBanana?.value) apiKey = nanoBanana.value;
    } catch {}

    // Always fallback to canvas for now — API integration pending
    // When the real Nano Banana 2 API URL is configured, uncomment the API block below
    /*
    if (apiKey) {
      try {
        let referenceImageUrl = "";
        try {
          const avatarSettings = JSON.parse(localStorage.getItem("bldr_avatar_settings") || "{}");
          if (avatarSettings.referenceImageUrl) referenceImageUrl = avatarSettings.referenceImageUrl;
        } catch {}
        const res = await fetch("/api/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gender, apiKey, referenceImageUrl, userName: profile.name }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          saveProfile({ avatarUrl: data.imageUrl });
          setGenerating(false);
          return;
        }
      } catch {}
    }
    */

    // Generate canvas avatar
    setTimeout(() => {
      const url = generateCanvasAvatar(gender);
      saveProfile({ avatarUrl: url });
      setGenerating(false);
    }, 800);
  };

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const statIcons: Record<string, React.ReactNode> = {
    "נקודות מוניטין": <TrophyIcon size={20} />,
    "שיעורים שהושלמו": <BookIcon size={20} />,
    "רצף ימים": <FireIcon size={20} />,
    "הערות": <NotebookIcon size={20} />,
  };

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Avatar & Name Section */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "32px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              {generating ? (
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,0,255,0.2), rgba(100,0,255,0.2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid rgba(0,0,255,0.3)",
                  boxShadow: "0 0 30px rgba(0,0,255,0.25)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid rgba(255,255,255,0.1)",
                    borderTopColor: "#3333FF",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt="אווטאר"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(0,0,255,0.3)",
                    boxShadow: "0 0 20px rgba(0,0,255,0.15)",
                  }}
                />
              ) : (
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0000FF, #3333FF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "white",
                  border: "3px solid rgba(0,0,255,0.3)",
                  boxShadow: "0 0 20px rgba(0,0,255,0.15)",
                }}>
                  {initials}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "rgba(240,240,245,0.6)",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                העלה תמונה
              </button>
              {!generating && (
                <button
                  onClick={() => setShowGenderPicker(true)}
                  style={{
                    background: "rgba(0,0,255,0.1)",
                    border: "1px solid rgba(0,0,255,0.25)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    color: "#3333FF",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  צור אווטאר
                </button>
              )}
            </div>

            {/* Gender picker */}
            {showGenderPicker && !generating && (
              <div style={{
                display: "flex",
                gap: "8px",
                marginTop: "4px",
              }}>
                <button
                  onClick={() => handleGenerateAvatar("male")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,255,0.25)",
                    background: "rgba(0,0,255,0.08)",
                    color: "#f0f0f5",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="7" r="5"/>
                    <path d="M17 22H7c0-3.3 2.2-6 5-6s5 2.7 5 6z"/>
                  </svg>
                  זכר
                </button>
                <button
                  onClick={() => handleGenerateAvatar("female")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(180,0,255,0.25)",
                    background: "rgba(180,0,255,0.08)",
                    color: "#f0f0f5",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="7" r="5"/>
                    <path d="M17 22H7c0-3.3 2.2-6 5-6s5 2.7 5 6z"/>
                    <path d="M9 3c1 1 2.5 1.5 3 1.5S14 4 15 3"/>
                  </svg>
                  נקבה
                </button>
              </div>
            )}

            {/* Loading animation */}
            {generating && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid rgba(0,0,255,0.15)",
                  borderTopColor: "#0000FF",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)" }}>יוצר אווטאר...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Error message */}
            {genError && (
              <p style={{ fontSize: "11px", color: "#FF3D00", textAlign: "center", maxWidth: "180px", marginTop: "4px" }}>
                {genError}
              </p>
            )}

            {!profile.avatarUrl && !generating && !showGenderPicker && (
              <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.25)", textAlign: "center", maxWidth: "140px" }}>
                העלה תמונה או צור אווטאר
              </p>
            )}
          </div>

          {/* Profile Info */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {editing ? (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "6px" }}>שם</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                    autoFocus
                    style={INPUT_STYLE}
                  />
                  <button onClick={handleSaveName} style={{ ...BTN_PRIMARY, padding: "10px 16px", fontSize: "13px" }}>שמור</button>
                  <button onClick={() => { setEditing(false); setEditName(profile.name); }} style={{ ...BTN_SECONDARY, padding: "10px 16px", fontSize: "13px" }}>ביטול</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5" }}>{profile.name}</h1>
                <button
                  onClick={() => { setEditing(true); setEditName(profile.name); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(240,240,245,0.35)",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#3333FF"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.35)"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontSize: "14px", color: "rgba(240,240,245,0.5)" }}>{profile.email}</span>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.2)" }}>(לא ניתן לשינוי)</span>
            </div>

            <span style={{
              fontSize: "12px",
              color: "#3333FF",
              background: "rgba(0,0,255,0.15)",
              padding: "2px 10px",
              borderRadius: "8px",
              display: "inline-block",
              fontFamily: "var(--font-heading-en)",
            }}>
              {profile.role}
            </span>

            {saved && (
              <span style={{ marginRight: "12px", fontSize: "13px", color: "#00C853", fontWeight: 600 }}>נשמר!</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "נקודות מוניטין", value: "450" },
          { label: "שיעורים שהושלמו", value: "21" },
          { label: "רצף ימים", value: "7" },
          { label: "הערות", value: "12" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ marginBottom: "4px", color: "rgba(240,240,245,0.6)", display: "flex", justifyContent: "center" }}>{statIcons[s.label]}</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.35)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginBottom: "16px" }}>תגים</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["Early Adopter", "Course Completer", "7-Day Streak", "Community Helper"].map((badge) => (
            <span key={badge} style={{ background: "rgba(255,255,255,0.04)", color: "rgba(240,240,245,0.6)", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-heading-en)" }}>{badge}</span>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <SettingsIcon size={18} color="rgba(240,240,245,0.6)" />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5" }}>הגדרות</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <p style={{ fontSize: "14px", color: "#f0f0f5", marginBottom: "2px" }}>מעבר אוטומטי לשיעור הבא</p>
            <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.35)" }}>לאחר סיום שיעור, עבור אוטומטית לשיעור הבא</p>
          </div>
          <button
            onClick={() => {
              const next = !autoPlayNext;
              setAutoPlayNext(next);
              const settings = JSON.parse(localStorage.getItem("bldr_user_settings") || "{}");
              settings.autoPlayNext = next;
              localStorage.setItem("bldr_user_settings", JSON.stringify(settings));
            }}
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              position: "relative",
              background: autoPlayNext ? "#0000FF" : "rgba(255,255,255,0.1)",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: "3px",
              transition: "right 0.2s, left 0.2s",
              ...(autoPlayNext ? { left: "3px" } : { left: "23px" }),
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}
