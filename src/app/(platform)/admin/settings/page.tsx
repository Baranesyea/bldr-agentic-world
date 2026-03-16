"use client";

import React, { useState, useEffect, useCallback } from "react";
import { type BrandSettings } from "@/lib/thumbnail-generator";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "28px",
  marginBottom: "24px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const HEADING_STYLE: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#ffffff",
  marginBottom: "20px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(240,240,245,0.6)",
  marginBottom: "6px",
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN_STYLE: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  appearance: "none" as const,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(240,240,245,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "32px",
};

interface ApiKey {
  label: string;
  value: string;
}

interface AvatarSettings {
  referenceImageUrl: string;
  defaultGender: "male" | "female";
  maxGenerationsPerUser: number;
}

const DEFAULT_AVATAR: AvatarSettings = {
  referenceImageUrl: "",
  defaultGender: "male",
  maxGenerationsPerUser: 1,
};

const DEFAULT_BRAND: BrandSettings = {
  brandName: "",
  primaryColor: "#1a1aff",
  secondaryColor: "#4444ff",
  accentColor: "#00ccff",
  logoUrl: "",
  logoColor: "#ffffff",
  gradientStartColor: "#1a1aff",
  gradientEndColor: "#4444ff",
  gradientDirection: "to right",
};

const DEFAULT_KEYS: ApiKey[] = [
  { label: "מפתח API של Google", value: "" },
  { label: "מפתח API של Nano Banana 2", value: "" },
];

function maskValue(val: string): string {
  if (val.length <= 4) return val ? "****" : "";
  return "\u2022".repeat(val.length - 4) + val.slice(-4);
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(DEFAULT_KEYS);
  const [editingKey, setEditingKey] = useState<Record<number, string>>({});
  const [savedKeyFlash, setSavedKeyFlash] = useState<number | null>(null);

  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandSaved, setBrandSaved] = useState(false);

  const [avatar, setAvatar] = useState<AvatarSettings>(DEFAULT_AVATAR);
  const [avatarSaved, setAvatarSaved] = useState(false);

  interface PaymentSettings {
    monthlyPrice: number;
    growWebhookSecret: string;
  }
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    monthlyPrice: 99,
    growWebhookSecret: "",
  });
  const [paymentSaved, setPaymentSaved] = useState(false);

  interface ThumbDefaults {
    defaultStyle: string;
    referenceUrls: string[];
    promptNotes: string;
  }
  const [thumbDefaults, setThumbDefaults] = useState<ThumbDefaults>({
    defaultStyle: "Gradient",
    referenceUrls: [""],
    promptNotes: "",
  });
  const [thumbDefaultsSaved, setThumbDefaultsSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem("bldr_api_keys");
      if (storedKeys) setApiKeys(JSON.parse(storedKeys));
      const storedBrand = localStorage.getItem("bldr_brand_settings");
      if (storedBrand) setBrand(JSON.parse(storedBrand));
      const storedAvatar = localStorage.getItem("bldr_avatar_settings");
      if (storedAvatar) setAvatar(JSON.parse(storedAvatar));
      const storedThumbDefaults = localStorage.getItem("bldr_thumb_defaults");
      if (storedThumbDefaults) setThumbDefaults(JSON.parse(storedThumbDefaults));
      const storedPayment = localStorage.getItem("bldr_payment_settings");
      if (storedPayment) setPaymentSettings(JSON.parse(storedPayment));
    } catch {
      // ignore
    }
  }, []);

  const saveApiKey = (index: number) => {
    const newKeys = [...apiKeys];
    if (editingKey[index] !== undefined) {
      newKeys[index] = { ...newKeys[index], value: editingKey[index] };
    }
    setApiKeys(newKeys);
    localStorage.setItem("bldr_api_keys", JSON.stringify(newKeys));
    setEditingKey((prev) => {
      const n = { ...prev };
      delete n[index];
      return n;
    });
    setSavedKeyFlash(index);
    setTimeout(() => setSavedKeyFlash(null), 1500);
  };

  const saveBrand = useCallback(() => {
    localStorage.setItem("bldr_brand_settings", JSON.stringify(brand));
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 1500);
  }, [brand]);

  const updateBrand = (key: keyof BrandSettings, val: string) => {
    setBrand((prev) => ({ ...prev, [key]: val }));
  };

  const gradientDirs = ["to right", "to left", "to bottom", "to top", "diagonal"];

  const colorField = (
    label: string,
    key: keyof BrandSettings,
    value: string
  ) => (
    <div style={{ flex: 1, minWidth: "160px" }}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => updateBrand(key, e.target.value)}
          style={{
            width: "40px",
            height: "40px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            background: "transparent",
            cursor: "pointer",
            padding: "2px",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => updateBrand(key, e.target.value)}
          style={{ ...INPUT_STYLE, flex: 1 }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: "8px",
        }}
      >
        הגדרות
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "32px", fontSize: "14px" }}>
        ניהול מפתחות API, הגדרות מותג ויצירת תמונות ממוזערות.
      </p>

      {/* ============ SECTION 1: API KEYS ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>מפתחות API</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {apiKeys.map((key, i) => {
            const isEditing = editingKey[i] !== undefined;
            return (
              <div
                key={key.label}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={LABEL_STYLE}>{key.label}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingKey[i]}
                      onChange={(e) =>
                        setEditingKey((prev) => ({
                          ...prev,
                          [i]: e.target.value,
                        }))
                      }
                      placeholder="הדבק מפתח API..."
                      style={INPUT_STYLE}
                    />
                  ) : (
                    <div
                      onClick={() =>
                        setEditingKey((prev) => ({
                          ...prev,
                          [i]: key.value,
                        }))
                      }
                      style={{
                        ...INPUT_STYLE,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        letterSpacing: "1px",
                        color: key.value
                          ? "rgba(240,240,245,0.5)"
                          : "rgba(240,240,245,0.2)",
                      }}
                    >
                      {key.value ? maskValue(key.value) : "לחץ להזנת מפתח..."}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={BTN_STYLE} onClick={() => saveApiKey(i)}>
                      שמור
                    </button>
                    <button
                      style={{
                        ...BTN_STYLE,
                        background: "rgba(255,255,255,0.06)",
                      }}
                      onClick={() =>
                        setEditingKey((prev) => {
                          const n = { ...prev };
                          delete n[i];
                          return n;
                        })
                      }
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div style={{ height: "40px", display: "flex", alignItems: "center" }}>
                    {savedKeyFlash === i && (
                      <span
                        style={{
                          color: "#44ff88",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        נשמר!
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ SECTION 2: BRAND SETTINGS ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>הגדרות מותג</h2>

        <div style={{ marginBottom: "20px" }}>
          <label style={LABEL_STYLE}>שם המותג</label>
          <input
            type="text"
            value={brand.brandName}
            onChange={(e) => updateBrand("brandName", e.target.value)}
            placeholder="שם המותג שלך..."
            style={INPUT_STYLE}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {colorField("צבע ראשי", "primaryColor", brand.primaryColor)}
          {colorField("צבע משני", "secondaryColor", brand.secondaryColor)}
          {colorField("צבע הדגשה", "accentColor", brand.accentColor)}
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label style={LABEL_STYLE}>כתובת לוגו</label>
            <input
              type="text"
              value={brand.logoUrl}
              onChange={(e) => updateBrand("logoUrl", e.target.value)}
              placeholder="https://..."
              style={INPUT_STYLE}
            />
          </div>
          {colorField("צבע לוגו", "logoColor", brand.logoColor)}
        </div>

        {brand.logoUrl && (
          <div
            style={{
              marginBottom: "20px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <label style={{ ...LABEL_STYLE, marginBottom: "10px" }}>
              תצוגת לוגו
            </label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logoUrl}
              alt="Logo preview"
              style={{
                maxHeight: "60px",
                maxWidth: "200px",
                objectFit: "contain",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              ...LABEL_STYLE,
              fontSize: "14px",
              fontWeight: 600,
              color: "rgba(240,240,245,0.8)",
              marginBottom: "12px",
            }}
          >
            הגדרות גרדיאנט
          </label>
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            {colorField("צבע התחלה", "gradientStartColor", brand.gradientStartColor)}
            {colorField("צבע סיום", "gradientEndColor", brand.gradientEndColor)}
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={LABEL_STYLE}>כיוון</label>
              <select
                value={brand.gradientDirection}
                onChange={(e) => updateBrand("gradientDirection", e.target.value)}
                style={SELECT_STYLE}
              >
                {gradientDirs.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{
              height: "40px",
              borderRadius: "8px",
              background: `linear-gradient(${brand.gradientDirection === "diagonal" ? "135deg" : brand.gradientDirection}, ${brand.gradientStartColor}, ${brand.gradientEndColor})`,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        <button style={BTN_STYLE} onClick={saveBrand}>
          {brandSaved ? "נשמר!" : "שמור הגדרות מותג"}
        </button>
      </div>

      {/* ============ SECTION 3: AVATAR REFERENCE ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>תמונת אווטאר</h2>
        <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.5 }}>
          העלה תמונת רפרנס ליצירת אווטארים אוטומטיים. כל משתמש יכול ליצור אווטאר פעם אחת. תמונת הרפרנס ובחירת המגדר נשלחות עם הפרומפט ליצירה.
        </p>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div style={{ flex: 2, minWidth: "250px" }}>
            <label style={LABEL_STYLE}>כתובת תמונת רפרנס</label>
            <input
              type="text"
              value={avatar.referenceImageUrl}
              onChange={(e) => setAvatar((p) => ({ ...p, referenceImageUrl: e.target.value }))}
              placeholder="https://... או הדבק כתובת תמונה"
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={LABEL_STYLE}>מגדר ברירת מחדל</label>
            <select
              value={avatar.defaultGender}
              onChange={(e) => setAvatar((p) => ({ ...p, defaultGender: e.target.value as "male" | "female" }))}
              style={SELECT_STYLE}
            >
              <option value="male">גבר</option>
              <option value="female">אישה</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={LABEL_STYLE}>מקסימום יצירות למשתמש</label>
            <input
              type="number"
              min={1}
              max={5}
              value={avatar.maxGenerationsPerUser}
              onChange={(e) => setAvatar((p) => ({ ...p, maxGenerationsPerUser: parseInt(e.target.value) || 1 }))}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {avatar.referenceImageUrl && (
          <div style={{ marginBottom: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <label style={{ ...LABEL_STYLE, marginBottom: "12px" }}>תצוגה מקדימה</label>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.referenceImageUrl}
                alt="Avatar reference"
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(0,0,255,0.3)", boxShadow: "0 0 20px rgba(0,0,255,0.15)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.6)", marginBottom: "8px" }}>
                  תמונת הרפרנס הזו תישלח עם הפרומפט ליצירת AI כשמשתמש חדש יוצר את האווטאר שלו.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(0,0,255,0.1)", color: "#3333FF", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                    מגדר: {avatar.defaultGender === "male" ? "גבר" : "אישה"}
                  </span>
                  <span style={{ background: "rgba(255,179,0,0.1)", color: "#FFB300", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                    מקסימום {avatar.maxGenerationsPerUser}x למשתמש
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          style={BTN_STYLE}
          onClick={() => {
            localStorage.setItem("bldr_avatar_settings", JSON.stringify(avatar));
            setAvatarSaved(true);
            setTimeout(() => setAvatarSaved(false), 1500);
          }}
        >
          {avatarSaved ? "נשמר!" : "שמור הגדרות אווטאר"}
        </button>
      </div>

      {/* ============ SECTION 4: THUMBNAIL DEFAULTS ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>ברירות מחדל לתמונות ממוזערות</h2>
        <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.5 }}>
          הגדר סגנון ברירת מחדל ותמונות רפרנס לתמונות ממוזערות של קורסים. ההגדרות משמשות ביצירת תמונות ממוזערות בעת יצירת קורס.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={LABEL_STYLE}>סגנון ברירת מחדל</label>
          <select
            value={thumbDefaults.defaultStyle}
            onChange={(e) => setThumbDefaults((p) => ({ ...p, defaultStyle: e.target.value }))}
            style={SELECT_STYLE}
          >
            {["Minimal", "Bold", "Cinematic", "Gradient"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={LABEL_STYLE}>תמונות רפרנס</label>
          <p style={{ color: "rgba(240,240,245,0.35)", fontSize: "12px", marginBottom: "10px" }}>
            הוסף כתובות תמונות רפרנס להגדרת האווירה. אלו יישלחו עם כל פרומפט ליצירת תמונות ממוזערות.
          </p>
          {thumbDefaults.referenceUrls.map((url, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const updated = [...thumbDefaults.referenceUrls];
                  updated[i] = e.target.value;
                  setThumbDefaults((p) => ({ ...p, referenceUrls: updated }));
                }}
                placeholder="https://... הדבק כתובת תמונת רפרנס"
                style={{ ...INPUT_STYLE, flex: 1 }}
              />
              {thumbDefaults.referenceUrls.length > 1 && (
                <button
                  onClick={() => {
                    const updated = thumbDefaults.referenceUrls.filter((_, j) => j !== i);
                    setThumbDefaults((p) => ({ ...p, referenceUrls: updated }));
                  }}
                  style={{ background: "rgba(255,61,0,0.1)", color: "#FF3D00", border: "none", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setThumbDefaults((p) => ({ ...p, referenceUrls: [...p.referenceUrls, ""] }))}
            style={{ ...BTN_STYLE, background: "rgba(255,255,255,0.06)", fontSize: "12px", padding: "6px 14px" }}
          >
            + הוסף רפרנס
          </button>
        </div>

        {/* Reference previews */}
        {thumbDefaults.referenceUrls.some((u) => u.trim()) && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            {thumbDefaults.referenceUrls.filter((u) => u.trim()).map((url, i) => (
              <div key={i} style={{ width: "160px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Reference ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={LABEL_STYLE}>הערות לפרומפט</label>
          <textarea
            value={thumbDefaults.promptNotes}
            onChange={(e) => setThumbDefaults((p) => ({ ...p, promptNotes: e.target.value }))}
            placeholder="לדוגמה: אווירה קולנועית כהה, הדגשות זוהר כחול, טקסט בולט, עקבי עם סגנון רשת של נטפליקס..."
            rows={3}
            style={{ ...INPUT_STYLE, resize: "vertical" }}
          />
        </div>

        <button
          style={BTN_STYLE}
          onClick={() => {
            localStorage.setItem("bldr_thumb_defaults", JSON.stringify(thumbDefaults));
            setThumbDefaultsSaved(true);
            setTimeout(() => setThumbDefaultsSaved(false), 1500);
          }}
        >
          {thumbDefaultsSaved ? "נשמר!" : "שמור ברירות מחדל"}
        </button>
      </div>

      {/* ============ SECTION: PAYMENT & SUBSCRIPTIONS ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>סליקה ומנויים</h2>
        <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.5 }}>
          הגדרות תשלום וסליקה עבור Grow (Meshulam). הוובהוק URL הוא: <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontSize: 12, direction: "ltr", display: "inline-block" }}>/api/subscribers/webhook</code>
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={LABEL_STYLE}>מחיר חודשי (₪)</label>
            <input
              type="number"
              value={paymentSettings.monthlyPrice}
              onChange={(e) => setPaymentSettings((p) => ({ ...p, monthlyPrice: parseFloat(e.target.value) || 0 }))}
              style={INPUT_STYLE}
              min={0}
            />
          </div>
          <div style={{ flex: 2, minWidth: "250px" }}>
            <label style={LABEL_STYLE}>Grow Webhook Secret</label>
            <input
              type="text"
              value={paymentSettings.growWebhookSecret}
              onChange={(e) => setPaymentSettings((p) => ({ ...p, growWebhookSecret: e.target.value }))}
              placeholder="Secret key for webhook validation"
              style={{ ...INPUT_STYLE, direction: "ltr" }}
            />
          </div>
        </div>

        <button
          style={BTN_STYLE}
          onClick={() => {
            localStorage.setItem("bldr_payment_settings", JSON.stringify(paymentSettings));
            setPaymentSaved(true);
            setTimeout(() => setPaymentSaved(false), 1500);
          }}
        >
          {paymentSaved ? "נשמר!" : "שמור הגדרות סליקה"}
        </button>
      </div>

      {/* WhatsApp CTA */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>WhatsApp CTA</h2>
        <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.4)", marginBottom: "16px" }}>
          כפתור הצטרפות לוואטסאפ שמוצג למשתמשים חדשים
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={LABEL_STYLE}>קישור לקבוצה</label>
            <input
              style={INPUT_STYLE}
              value={(() => { try { return JSON.parse(localStorage.getItem("bldr_whatsapp_settings") || "{}").url || ""; } catch { return ""; } })()}
              onChange={(e) => {
                try {
                  const current = JSON.parse(localStorage.getItem("bldr_whatsapp_settings") || '{"url":"","enabled":true}');
                  current.url = e.target.value;
                  localStorage.setItem("bldr_whatsapp_settings", JSON.stringify(current));
                } catch {}
              }}
              placeholder="https://chat.whatsapp.com/..."
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
