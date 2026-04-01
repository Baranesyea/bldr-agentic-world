"use client";

import React, { useState, useEffect, useRef } from "react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { saveImage, getImage } from "@/lib/image-store";

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  audioUrl: string;
  position: "top" | "bottom" | "left" | "right";
}

interface OnboardingSettings {
  welcomeTitle: string;
  welcomeSubtitle: string;
  soundEnabled?: boolean;
  soundDefault: boolean;
  welcomeAudioUrl?: string;
}

const DEFAULT_STEPS: TourStep[] = [
  { id: "step-1", targetSelector: "[data-nav='/dashboard']", title: "הלימודים", description: "כאן תמצא את כל הקורסים שלך, ממוינים בצורה נוחה כמו נטפליקס", audioUrl: "", position: "left" },
  { id: "step-2", targetSelector: "[data-nav='/notebook']", title: "המחברת", description: "כל ההערות שלך מכל השיעורים במקום אחד", audioUrl: "", position: "left" },
  { id: "step-3", targetSelector: "[data-nav='/calendar']", title: "לוח שנה", description: "כל האירועים והמפגשים החיים שלנו", audioUrl: "", position: "left" },
  { id: "step-4", targetSelector: "[data-nav='/qa']", title: "שאלות ותשובות", description: "שאל שאלות, קבל תשובות מהקהילה ומהצוות", audioUrl: "", position: "left" },
  { id: "step-5", targetSelector: "[data-nav='/profile']", title: "הפרופיל שלך", description: "עדכן את הפרטים שלך, הגדרות והעדפות", audioUrl: "", position: "left" },
];

const DEFAULT_SETTINGS: OnboardingSettings = {
  welcomeTitle: "ברוכים הבאים ל-Agentic World",
  welcomeSubtitle: "המועדון לאנשים שבונים בעידן האגנטי",
  soundEnabled: false,
  soundDefault: true,
  welcomeAudioUrl: "",
};

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
  padding: "20px",
  marginBottom: "12px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  padding: "10px 12px",
  color: "#f0f0f5",
  fontSize: "14px",
  outline: "none",
  direction: "rtl",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(240,240,245,0.7)",
  marginBottom: "4px",
  display: "block",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  cursor: "pointer",
};

const UPLOAD_BTN_STYLE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  padding: "8px 14px",
  color: "rgba(240,240,245,0.7)",
  fontSize: "13px",
  cursor: "pointer",
  transition: "border-color 0.2s",
  width: "100%",
};

/** Read a file as data URL */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Audio upload component with play preview */
function AudioUpload({
  label,
  audioUrl,
  onUpload,
  onClear,
}: {
  label: string;
  audioUrl: string;
  onUpload: (idbUrl: string) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState("");

  // Resolve idb:// URLs
  useEffect(() => {
    if (!audioUrl) { setResolvedUrl(""); return; }
    if (audioUrl.startsWith("idb://")) {
      const id = audioUrl.slice(6);
      getImage(id).then((data) => setResolvedUrl(data || ""));
    } else {
      setResolvedUrl(audioUrl);
    }
  }, [audioUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const id = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await saveImage(id, dataUrl);
      onUpload(`idb://${id}`);
    } catch (err) {
      console.error("Failed to upload audio:", err);
    }
    setUploading(false);
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const togglePlay = () => {
    if (!resolvedUrl) return;
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
    } else {
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {audioUrl ? (
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={togglePlay}
            style={{
              ...UPLOAD_BTN_STYLE,
              flex: 1,
              justifyContent: "center",
              borderColor: playing ? "rgba(51,51,255,0.4)" : "rgba(255,255,255,0.1)",
              color: playing ? "#3333FF" : "rgba(240,240,245,0.6)",
            }}
          >
            <span style={{ fontSize: "16px" }}>{playing ? "⏸" : "▶"}</span>
            <span>{playing ? "מנגן..." : "השמע"}</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ ...UPLOAD_BTN_STYLE, flex: 1, justifyContent: "center" }}
          >
            <span style={{ fontSize: "14px" }}>🔄</span>
            <span>החלף</span>
          </button>
          <button
            onClick={onClear}
            style={{
              ...UPLOAD_BTN_STYLE,
              flex: 0, padding: "8px 12px",
              borderColor: "rgba(255,59,48,0.2)",
              color: "rgba(255,120,120,0.8)",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={UPLOAD_BTN_STYLE}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(51,51,255,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
        >
          <span style={{ fontSize: "16px" }}>🎵</span>
          <span>{uploading ? "מעלה..." : "העלה קובץ אודיו"}</span>
        </button>
      )}
    </div>
  );
}

export default function OnboardingAdminPage() {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [settings, setSettings] = useState<OnboardingSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const storedSteps = localStorage.getItem("bldr_onboarding_steps");
      if (storedSteps) {
        const parsed: TourStep[] = JSON.parse(storedSteps);
        // Migrate old href selectors to data-nav
        let migrated = false;
        for (const step of parsed) {
          if (step.targetSelector.startsWith("[href='")) {
            step.targetSelector = step.targetSelector.replace("[href='", "[data-nav='");
            migrated = true;
          }
        }
        if (migrated) {
          localStorage.setItem("bldr_onboarding_steps", JSON.stringify(parsed));
        }
        setSteps(parsed);
      } else {
        setSteps(DEFAULT_STEPS);
        localStorage.setItem("bldr_onboarding_steps", JSON.stringify(DEFAULT_STEPS));
      }
    } catch {
      setSteps(DEFAULT_STEPS);
    }

    try {
      const storedSettings = localStorage.getItem("bldr_onboarding_settings");
      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      }
    } catch {}
  }, []);

  const updateStep = (index: number, field: keyof TourStep, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSteps(updated);
  };

  const addStep = () => {
    const newStep: TourStep = {
      id: `step-${Date.now()}`,
      targetSelector: "",
      title: "",
      description: "",
      audioUrl: "",
      position: "left",
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    localStorage.setItem("bldr_onboarding_steps", JSON.stringify(steps));
    localStorage.setItem("bldr_onboarding_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const previewStep = (index: number) => {
    const step = steps[index];
    if (!step?.targetSelector) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setPreviewIndex(index);
      setTimeout(() => setPreviewIndex(null), 2000);
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem("bldr_onboarding_done");
  };

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
            ניהול אונבורדינג
          </h1>
          <p style={{ color: "rgba(240,240,245,0.7)", fontSize: "14px" }}>
            הגדר את שלבי סיור המערכת למשתמשים חדשים
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={resetOnboarding}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              padding: "10px 16px",
              color: "rgba(240,240,245,0.7)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            אפס סיור
          </button>
          <button
            onClick={handleSave}
            style={{
              background: saved ? "#00C853" : "#0000FF",
              border: "none",
              borderRadius: "4px",
              padding: "10px 24px",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.3s",
            }}
          >
            {saved ? "נשמר!" : "שמור"}
          </button>
        </div>
      </div>

      {/* Welcome settings */}
      <div style={{ ...CARD_STYLE, marginBottom: "28px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>
          הגדרות מסך פתיחה
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={LABEL_STYLE}>כותרת</label>
            <input
              style={INPUT_STYLE}
              value={settings.welcomeTitle}
              onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>תת כותרת</label>
            <input
              style={INPUT_STYLE}
              value={settings.welcomeSubtitle}
              onChange={(e) => setSettings({ ...settings, welcomeSubtitle: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4 }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5" }}>סאונד בסיור</span>
            <ToggleSwitch checked={settings.soundEnabled ?? false} onChange={(v) => setSettings({ ...settings, soundEnabled: v })} size="sm" />
            {!settings.soundEnabled && (
              <span style={{ fontSize: "12px", color: "rgba(240,240,245,0.7)" }}>מוחבא מהמשתמשים</span>
            )}
          </div>
          {settings.soundEnabled && (
            <>
              <AudioUpload
                label="אודיו מסך פתיחה"
                audioUrl={settings.welcomeAudioUrl || ""}
                onUpload={(url) => setSettings({ ...settings, welcomeAudioUrl: url })}
                onClear={() => setSettings({ ...settings, welcomeAudioUrl: "" })}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)" }}>סאונד מופעל כברירת מחדל למשתמש</span>
                <ToggleSwitch checked={settings.soundDefault} onChange={(v) => setSettings({ ...settings, soundDefault: v })} size="sm" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Steps list */}
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f5", marginBottom: "16px" }}>
        שלבי הסיור ({steps.length})
      </h2>

      {steps.map((step, index) => (
        <div key={step.id} style={{
          ...CARD_STYLE,
          borderColor: previewIndex === index ? "rgba(51,51,255,0.5)" : "rgba(255,255,255,0.06)",
          transition: "border-color 0.3s",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "rgba(51,51,255,0.15)", color: "#3333FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700,
              }}>
                {index + 1}
              </span>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0f0f5" }}>
                {step.title || "שלב ללא שם"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                style={{
                  background: "none", border: "none", color: index === 0 ? "rgba(240,240,245,0.15)" : "rgba(240,240,245,0.5)",
                  cursor: index === 0 ? "default" : "pointer", fontSize: "18px", padding: "4px 8px",
                }}
              >
                ▲
              </button>
              <button
                onClick={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                style={{
                  background: "none", border: "none", color: index === steps.length - 1 ? "rgba(240,240,245,0.15)" : "rgba(240,240,245,0.5)",
                  cursor: index === steps.length - 1 ? "default" : "pointer", fontSize: "18px", padding: "4px 8px",
                }}
              >
                ▼
              </button>
              <button
                onClick={() => previewStep(index)}
                style={{
                  background: "rgba(51,51,255,0.1)", border: "1px solid rgba(51,51,255,0.2)",
                  borderRadius: "4px", padding: "4px 12px",
                  color: "#3333FF", fontSize: "12px", cursor: "pointer",
                }}
              >
                תצוגה מקדימה
              </button>
              <button
                onClick={() => deleteStep(index)}
                style={{
                  background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)",
                  borderRadius: "4px", padding: "4px 12px",
                  color: "#ff6b6b", fontSize: "12px", cursor: "pointer",
                }}
              >
                מחק
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={LABEL_STYLE}>כותרת</label>
              <input
                style={INPUT_STYLE}
                value={step.title}
                onChange={(e) => updateStep(index, "title", e.target.value)}
                placeholder="כותרת השלב"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>סלקטור CSS</label>
              <input
                style={{ ...INPUT_STYLE, direction: "ltr", textAlign: "left", fontFamily: "monospace", fontSize: "13px" }}
                value={step.targetSelector}
                onChange={(e) => updateStep(index, "targetSelector", e.target.value)}
                placeholder="[data-nav='/dashboard']"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={LABEL_STYLE}>תיאור</label>
              <textarea
                style={{ ...INPUT_STYLE, minHeight: "60px", resize: "vertical" }}
                value={step.description}
                onChange={(e) => updateStep(index, "description", e.target.value)}
                placeholder="תיאור השלב"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>מיקום טולטיפ</label>
              <select
                style={SELECT_STYLE}
                value={step.position}
                onChange={(e) => updateStep(index, "position", e.target.value)}
              >
                <option value="top">למעלה</option>
                <option value="bottom">למטה</option>
                <option value="left">שמאל</option>
                <option value="right">ימין</option>
              </select>
            </div>
            {settings.soundEnabled && (
              <AudioUpload
                label="אודיו לשלב"
                audioUrl={step.audioUrl}
                onUpload={(url) => updateStep(index, "audioUrl", url)}
                onClear={() => updateStep(index, "audioUrl", "")}
              />
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addStep}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "2px dashed rgba(255,255,255,0.1)",
          borderRadius: "4px",
          padding: "20px",
          color: "rgba(240,240,245,0.7)",
          fontSize: "14px",
          cursor: "pointer",
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(51,51,255,0.3)"; e.currentTarget.style.color = "#3333FF"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(240,240,245,0.7)"; }}
      >
        + הוסף שלב
      </button>
    </div>
  );
}
