"use client";

import React, { useState, useEffect } from "react";

const STORAGE_KEY = "bldr_whatsapp_clicked";
const SETTINGS_KEY = "bldr_whatsapp_settings";

interface WhatsAppSettings {
  url: string;
  enabled: boolean;
}

function getSettings(): WhatsAppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { url: "https://chat.whatsapp.com/YOUR_GROUP_LINK", enabled: true };
}

export function WhatsAppCTA() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettings>({ url: "", enabled: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clicked = localStorage.getItem(STORAGE_KEY);
    const s = getSettings();
    setSettings(s);
    if (!clicked && s.enabled) {
      // Show after 15 seconds
      const timer = setTimeout(() => {
        setVisible(true);
        setReady(true);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible || !ready) return null;

  const handleClick = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.open(settings.url, "_blank");
    setVisible(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  return (
    <>
      <style>{`
        @keyframes whatsappSlideIn {
          from { opacity: 0; transform: translateX(-100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes whatsappShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          bottom: 80,
          left: 24,
          zIndex: 45,
          cursor: "pointer",
          animation: "whatsappSlideIn 0.6s ease-out",
          direction: "rtl",
        }}
      >
        <div style={{
          position: "relative",
          overflow: "visible",
          borderRadius: 4,
          border: `2px solid ${hovered ? "rgba(37,211,102,0.5)" : "rgba(37,211,102,0.25)"}`,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: hovered
            ? "linear-gradient(135deg, rgba(37,211,102,0.15) 0%, rgba(0,0,0,0.8) 100%)"
            : "linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(0,0,0,0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: hovered
            ? "0 8px 32px rgba(37,211,102,0.2), 0 0 0 1px rgba(37,211,102,0.1)"
            : "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all 0.5s ease",
          transform: hovered ? "translateY(-2px) scale(1.02)" : "none",
          whiteSpace: "nowrap",
        }}>
          {/* Shimmer effect */}
          <div style={{
            position: "absolute", inset: 0,
            overflow: "hidden", borderRadius: "inherit",
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(37,211,102,0.15) 50%, transparent 100%)",
              animation: "whatsappShimmer 3s ease-in-out infinite",
            }} />
          </div>

          {/* X dismiss */}
          {hovered && (
            <button
              onClick={handleDismiss}
              style={{
                position: "absolute", top: -8, left: -8, zIndex: 40,
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.85)", border: "none",
                color: "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0, lineHeight: 1,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              ×
            </button>
          )}

          {/* Arrow — pointing outward (left) */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={hovered ? "#4ade80" : "rgba(37,211,102,0.4)"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transition: "all 0.3s",
              transform: hovered ? "translateX(-4px)" : "none",
              opacity: hovered ? 1 : 0.5,
              flexShrink: 0,
            }}
          >
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>

          {/* Text */}
          <div style={{ position: "relative", zIndex: 10 }}>
            <p style={{
              fontSize: 14, fontWeight: 700,
              color: hovered ? "#4ade80" : "#25D366",
              transition: "color 0.3s",
              margin: 0,
            }}>
              כניסה לקהילה בוואטסאפ
            </p>
            <p style={{
              fontSize: 12,
              color: hovered ? "rgba(74,222,128,0.7)" : "rgba(37,211,102,0.5)",
              transition: "color 0.3s",
              margin: "2px 0 0 0",
            }}>
              אנחנו מחכים לך בפנים
            </p>
          </div>

          {/* WhatsApp icon */}
          <div style={{
            padding: 10, borderRadius: 4,
            background: hovered
              ? "linear-gradient(135deg, rgba(37,211,102,0.3) 0%, rgba(37,211,102,0.1) 100%)"
              : "linear-gradient(135deg, rgba(37,211,102,0.2) 0%, rgba(37,211,102,0.05) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
