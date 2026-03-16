"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  generateThumbnail,
  type BrandSettings,
  type ThumbnailOptions,
} from "@/lib/thumbnail-generator";

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
  fontFamily: "'Merriweather', serif",
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
  boxSizing: "border-box",
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
  { label: "Google API Key", value: "" },
  { label: "Nano Banana 2 API Key", value: "" },
];

function maskValue(val: string): string {
  if (val.length <= 4) return val ? "****" : "";
  return "•".repeat(val.length - 4) + val.slice(-4);
}

export default function AdminPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(DEFAULT_KEYS);
  const [editingKey, setEditingKey] = useState<Record<number, string>>({});
  const [savedKeyFlash, setSavedKeyFlash] = useState<number | null>(null);

  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandSaved, setBrandSaved] = useState(false);

  const [thumbOpts, setThumbOpts] = useState<ThumbnailOptions>({
    title: "",
    subtitle: "",
    style: "Gradient",
    size: "1280x720",
  });
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem("bldr_api_keys");
      if (storedKeys) setApiKeys(JSON.parse(storedKeys));
      const storedBrand = localStorage.getItem("bldr_brand_settings");
      if (storedBrand) setBrand(JSON.parse(storedBrand));
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

  const handleGenerate = useCallback(() => {
    if (!thumbOpts.title.trim()) return;
    setGenerating(true);
    // Small delay for UX feel
    setTimeout(() => {
      const url = generateThumbnail(brand, thumbOpts);
      setThumbPreview(url);
      setGenerating(false);
    }, 400);
  }, [brand, thumbOpts]);

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
          fontFamily: "'Merriweather', serif",
          fontSize: "32px",
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: "8px",
        }}
      >
        Settings
      </h1>
      <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "32px", fontSize: "14px" }}>
        Manage API keys, brand settings, and thumbnail generation.
      </p>

      {/* ============ SECTION 1: API KEYS ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>API Keys</h2>
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
                      placeholder="Paste your API key..."
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
                      {key.value ? maskValue(key.value) : "Click to enter key..."}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={BTN_STYLE} onClick={() => saveApiKey(i)}>
                      Save
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
                      Cancel
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
                        Saved!
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
        <h2 style={HEADING_STYLE}>Brand Settings</h2>

        {/* Brand Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={LABEL_STYLE}>Brand Name</label>
          <input
            type="text"
            value={brand.brandName}
            onChange={(e) => updateBrand("brandName", e.target.value)}
            placeholder="Your brand name..."
            style={INPUT_STYLE}
          />
        </div>

        {/* Colors */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {colorField("Primary Color", "primaryColor", brand.primaryColor)}
          {colorField("Secondary Color", "secondaryColor", brand.secondaryColor)}
          {colorField("Accent Color", "accentColor", brand.accentColor)}
        </div>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label style={LABEL_STYLE}>Logo URL</label>
            <input
              type="text"
              value={brand.logoUrl}
              onChange={(e) => updateBrand("logoUrl", e.target.value)}
              placeholder="https://..."
              style={INPUT_STYLE}
            />
          </div>
          {colorField("Logo Color", "logoColor", brand.logoColor)}
        </div>

        {/* Logo preview */}
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
              Logo Preview
            </label>
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

        {/* Gradient */}
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
            Gradient Settings
          </label>
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            {colorField(
              "Start Color",
              "gradientStartColor",
              brand.gradientStartColor
            )}
            {colorField(
              "End Color",
              "gradientEndColor",
              brand.gradientEndColor
            )}
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={LABEL_STYLE}>Direction</label>
              <select
                value={brand.gradientDirection}
                onChange={(e) =>
                  updateBrand("gradientDirection", e.target.value)
                }
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
          {/* Live gradient preview */}
          <div
            style={{
              height: "40px",
              borderRadius: "8px",
              background: `linear-gradient(${brand.gradientDirection === "diagonal" ? "135deg" : brand.gradientDirection}, ${brand.gradientStartColor}, ${brand.gradientEndColor})`,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        <button
          style={BTN_STYLE}
          onClick={saveBrand}
        >
          {brandSaved ? "Saved!" : "Save Brand Settings"}
        </button>
      </div>

      {/* ============ SECTION 3: THUMBNAIL GENERATOR ============ */}
      <div style={CARD_STYLE}>
        <h2 style={HEADING_STYLE}>Thumbnail Generator</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label style={LABEL_STYLE}>Thumbnail Title</label>
            <input
              type="text"
              value={thumbOpts.title}
              onChange={(e) =>
                setThumbOpts((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Enter title..."
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Subtitle (optional)</label>
            <input
              type="text"
              value={thumbOpts.subtitle}
              onChange={(e) =>
                setThumbOpts((p) => ({ ...p, subtitle: e.target.value }))
              }
              placeholder="Enter subtitle..."
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Style</label>
            <select
              value={thumbOpts.style}
              onChange={(e) =>
                setThumbOpts((p) => ({
                  ...p,
                  style: e.target.value as ThumbnailOptions["style"],
                }))
              }
              style={SELECT_STYLE}
            >
              {["Minimal", "Bold", "Cinematic", "Gradient"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Size</label>
            <select
              value={thumbOpts.size}
              onChange={(e) =>
                setThumbOpts((p) => ({
                  ...p,
                  size: e.target.value as ThumbnailOptions["size"],
                }))
              }
              style={SELECT_STYLE}
            >
              <option value="1280x720">YouTube (1280x720)</option>
              <option value="400x225">Course Card (400x225)</option>
              <option value="1080x1080">Square (1080x1080)</option>
            </select>
          </div>
        </div>

        <button
          style={{
            ...BTN_STYLE,
            opacity: thumbOpts.title.trim() ? 1 : 0.5,
            marginBottom: "20px",
            width: "100%",
            padding: "14px",
            fontSize: "15px",
          }}
          disabled={!thumbOpts.title.trim() || generating}
          onClick={handleGenerate}
        >
          {generating ? "Generating..." : "Generate Thumbnail"}
        </button>

        {/* Preview */}
        {thumbPreview && (
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <label style={{ ...LABEL_STYLE, marginBottom: "12px" }}>
              Preview
            </label>
            <img
              src={thumbPreview}
              alt="Generated thumbnail"
              style={{
                width: "100%",
                borderRadius: "8px",
                display: "block",
              }}
            />
            <a
              href={thumbPreview}
              download={`thumbnail-${Date.now()}.png`}
              style={{
                ...BTN_STYLE,
                display: "inline-block",
                marginTop: "12px",
                textDecoration: "none",
                textAlign: "center",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
