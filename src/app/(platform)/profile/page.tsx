"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrophyIcon, BookIcon, FireIcon, NotebookIcon, SettingsIcon } from "@/components/ui/icons";
import { getTouristData, useUser } from "@/hooks/useUser";

interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  avatarGenerated: boolean;
  profession?: string;
  learningGoal?: string;
  city?: string;
  age?: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  avatarUrl: "",
  role: "",
  avatarGenerated: false,
};

const INPUT_STYLE: React.CSSProperties = {
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

const BTN_PRIMARY: React.CSSProperties = {
  background: "#0000FF",
  color: "white",
  padding: "10px 24px",
  borderRadius: "4px",
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
  borderRadius: "4px",
  fontWeight: 600,
  fontSize: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
};

export default function ProfilePage() {
  const { profile: authProfile } = useUser();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editProfession, setEditProfession] = useState("");
  const [editLearningGoal, setEditLearningGoal] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAge, setEditAge] = useState("");
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [genError, setGenError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      const currentEmail = cached.email || "";
      const stored = localStorage.getItem("bldr_user_profile");

      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify the stored profile belongs to the current user
        if (parsed.email && currentEmail && parsed.email !== currentEmail) {
          // Stale profile from a different user — discard it
          localStorage.removeItem("bldr_user_profile");
        } else {
          // Fill Google avatar if user hasn't set a custom one
          if (!parsed.avatarUrl && cached.avatar_url) {
            parsed.avatarUrl = cached.avatar_url;
            // Persist so it's available next load
            localStorage.setItem("bldr_user_profile", JSON.stringify(parsed));
          }
          setProfile(parsed);
          setEditName(parsed.name);
          setEditProfession(parsed.profession || "");
          setEditLearningGoal(parsed.learningGoal || "");
          setEditCity(parsed.city || "");
          setEditAge(parsed.age ? String(parsed.age) : "");
          return; // loaded successfully
        }
      }

      // No valid stored profile — initialize from auth cache
      const initial: UserProfile = {
        ...DEFAULT_PROFILE,
        name: cached.full_name || "",
        email: currentEmail,
        avatarUrl: cached.avatar_url || "",
      };
      setProfile(initial);
      setEditName(initial.name);
    } catch {}
    try {
      const settings = JSON.parse(localStorage.getItem("bldr_user_settings") || "{}");
      if (typeof settings.autoPlayNext === "boolean") setAutoPlayNext(settings.autoPlayNext);
    } catch {}
  }, []);

  // Update profile reactively when auth data arrives (fixes race condition)
  useEffect(() => {
    if (!authProfile) return;
    setProfile((prev) => {
      // Only update if profile is still default/empty or belongs to this user
      if (prev.email && prev.email !== authProfile.email) return prev;
      const updated = {
        ...prev,
        name: prev.name || authProfile.full_name || "",
        email: prev.email || authProfile.email || "",
        avatarUrl: prev.avatarUrl || authProfile.avatar_url || "",
      };
      if (updated.name !== prev.name || updated.email !== prev.email || updated.avatarUrl !== prev.avatarUrl) {
        localStorage.setItem("bldr_user_profile", JSON.stringify(updated));
        if (!editName && updated.name) setEditName(updated.name);
      }
      return updated;
    });
  }, [authProfile]);

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

  const generateCanvasAvatar = (gender: "male" | "female", refImage?: HTMLImageElement): string => {
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

    if (refImage) {
      // Draw reference image as base, cropped to circle area
      ctx.save();
      ctx.beginPath();
      ctx.arc(256, 256, 220, 0, Math.PI * 2);
      ctx.clip();
      // Cover the circle with the reference image
      const scale = Math.max(440 / refImage.width, 440 / refImage.height);
      const w = refImage.width * scale;
      const h = refImage.height * scale;
      ctx.drawImage(refImage, 256 - w / 2, 256 - h / 2, w, h);
      ctx.restore();
      // Overlay gradient for style
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      ctx.globalAlpha = 1;
    } else {
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
      ctx.beginPath();
      ctx.arc(256, 180, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(256, 420, 130, 150, 0, Math.PI, 0);
      ctx.fill();
    }

    // Initials overlay
    const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
    ctx.fillStyle = refImage ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)";
    ctx.font = `bold ${refImage ? 80 : 120}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillText(initials, 256, refImage ? 420 : 256);
    ctx.shadowBlur = 0;

    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const handleGenerateAvatar = async (gender: "male" | "female") => {
    setShowGenderPicker(false);
    setGenerating(true);
    setGenError("");

    // Get reference image from avatar settings
    let referenceImageUrl = "";
    try {
      const avatarSettings = JSON.parse(localStorage.getItem("bldr_avatar_settings") || "{}");
      if (avatarSettings.referenceImageUrl) referenceImageUrl = avatarSettings.referenceImageUrl;
    } catch {}

    // Try to load reference image
    if (referenceImageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = referenceImageUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          setTimeout(reject, 5000); // 5s timeout
        });
        const url = generateCanvasAvatar(gender, img);
        saveProfile({ avatarUrl: url });
        setGenerating(false);
        return;
      } catch {
        // Reference image failed to load, continue without it
      }
    }

    // Generate without reference
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
    <div className="profile-page" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .profile-page { padding: 16px !important; }
          .profile-page > div { padding: 20px !important; }
        }
      `}</style>
      {/* Avatar & Name Section */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "32px", marginBottom: "24px" }}>
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
                  borderRadius: "4px",
                  padding: "6px 12px",
                  color: "rgba(240,240,245,0.7)",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                העלה תמונה
              </button>
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
                    borderRadius: "4px",
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
                    borderRadius: "4px",
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
                <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>יוצר אווטאר...</span>
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
              <p style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)", textAlign: "center", maxWidth: "140px" }}>
                העלה תמונה או צור אווטאר
              </p>
            )}
          </div>

          {/* Profile Info */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {editing ? (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>שם</label>
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
                    color: "rgba(240,240,245,0.7)",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#3333FF"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,240,245,0.7)"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)" }}>{profile.email}</span>
              <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)" }}>(לא ניתן לשינוי)</span>
            </div>

            <span style={{
              fontSize: "12px",
              color: "#7777FF",
              background: "rgba(0,0,255,0.15)",
              padding: "2px 10px",
              borderRadius: "4px",
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

      {/* Extra Profile Fields */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5", marginBottom: "16px" }}>פרטים נוספים</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>מה אתם עושים בחיים המקצועיים?</label>
            <textarea
              rows={2}
              value={editProfession}
              onChange={(e) => setEditProfession(e.target.value)}
              style={{ ...INPUT_STYLE, resize: "none" as const, fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>איך הלמידה כאן עוזרת לכם?</label>
            <textarea
              rows={2}
              value={editLearningGoal}
              onChange={(e) => setEditLearningGoal(e.target.value)}
              style={{ ...INPUT_STYLE, resize: "none" as const, fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>מאיפה אתם?</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)", display: "block", marginBottom: "6px" }}>גיל</label>
              <input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                style={INPUT_STYLE}
                min={1}
                max={120}
              />
            </div>
          </div>
          <button
            onClick={() => saveProfile({
              profession: editProfession,
              learningGoal: editLearningGoal,
              city: editCity,
              age: editAge ? parseInt(editAge) : undefined,
            })}
            style={{ ...BTN_PRIMARY, alignSelf: "flex-start" }}
          >
            שמור פרטים
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "שיעורים שהושלמו", value: "21" },
          { label: "רצף ימים", value: "7" },
          { label: "הערות", value: "12" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "16px", textAlign: "center" }}>
            <div style={{ marginBottom: "4px", color: "rgba(240,240,245,0.7)", display: "flex", justifyContent: "center" }}>{statIcons[s.label]}</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "rgba(240,240,245,0.7)" }}>{s.label}</div>
          </div>
        ))}
      </div>


      {/* Settings */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <SettingsIcon size={18} color="rgba(240,240,245,0.6)" />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f5" }}>הגדרות</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <p style={{ fontSize: "14px", color: "#f0f0f5", marginBottom: "2px" }}>מעבר אוטומטי לשיעור הבא</p>
            <p style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>לאחר סיום שיעור, עבור אוטומטית לשיעור הבא</p>
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
              borderRadius: "4px",
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

      {/* Danger Zone */}
      <div style={{
        background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
        borderRadius: "4px", padding: "24px", marginTop: "24px",
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ef4444", marginBottom: "8px" }}>אזור מסוכן</h2>
        <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "16px" }}>
          מחיקת החשבון היא פעולה בלתי הפיכה.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: "10px 20px", borderRadius: "4px",
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}
        >
          מחק חשבון
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            padding: "16px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0e0e22", borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.2)",
              padding: "36px 32px", maxWidth: "440px", width: "100%",
              direction: "rtl",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: "36px", textAlign: "center", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "14px", textAlign: "center" }}>
              האם אתה בטוח שאתה רוצה למחוק את החשבון?
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(240,240,245,0.7)", lineHeight: 1.7, textAlign: "center", marginBottom: "28px" }}>
              אם תמחק את החשבון לא יהיה לך גישה לתכנים שפתוחים לך עכשיו,
              ולא תקבל התראות על תכנים חדשים שעולים למערכת.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)", color: "#fff",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer",
                }}
              >
                ביטול
              </button>
              <button
                onClick={async () => {
                  // Delete account in DB
                  try {
                    const tourist = getTouristData();
                    const res = await fetch("/api/account/delete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: tourist?.email || profile.email,
                        fullName: tourist?.name || profile.name,
                        userType: tourist ? "tourist" : "member",
                        deletedBy: "user",
                      }),
                    });
                    if (!res.ok) console.error("Delete failed:", await res.text());
                  } catch (err) {
                    console.error("Delete error:", err);
                  }

                  // Clear all local data
                  const keysToRemove = [
                    "bldr_tourist", "bldr_user_profile", "bldr_profile_cache",
                    "bldr_user_settings", "bldr_completed_lessons", "bldr_notes",
                    "bldr_trial", "bldr_calendar_events", "bldr_onboarding_v4",
                    "bldr_current_user_id",
                  ];
                  keysToRemove.forEach(k => localStorage.removeItem(k));

                  // Sign out via Supabase
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } catch {}
                  window.location.replace("/login");
                }}
                style={{
                  flex: 1, padding: "12px", borderRadius: "8px",
                  border: "none", background: "#ef4444", color: "#fff",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}
              >
                מחק חשבון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
