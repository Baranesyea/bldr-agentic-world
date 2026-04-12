"use client";

import { useEffect, useState } from "react";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reported, setReported] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  // Auto-log error silently on mount (no user-facing state change)
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message || "Unknown error",
          stack: error.stack || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          userEmail: profile.email || null,
          userName: profile.full_name || null,
        }),
      }).catch(() => {});
    } catch {}
  }, [error]);

  const handleReport = () => {
    setLaunching(true);
    // Send report
    try {
      const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
      fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[USER REPORT] ${error.message || "Unknown error"}`,
          stack: error.stack || null,
          url: window.location.href,
          userAgent: navigator.userAgent,
          userEmail: profile.email || null,
          userName: profile.full_name || null,
        }),
      }).catch(() => {});
    } catch {}

    // Rocket launch animation timing
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      setReported(true);
    }, 2200);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#050510",
      direction: "rtl",
      padding: "24px",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @keyframes rocketLaunch {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          20% { transform: translateY(-10px) rotate(-2deg); }
          40% { transform: translateY(-30px) rotate(2deg); }
          60% { transform: translateY(-120px) rotate(-1deg); opacity: 1; }
          80% { transform: translateY(-300px) rotate(0deg); opacity: 0.6; }
          100% { transform: translateY(-600px) rotate(0deg); opacity: 0; }
        }
        @keyframes rocketShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes smokeRise {
          0% { opacity: 0.8; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(40px) scale(2.5); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50% { transform: scaleY(1.3) scaleX(0.8); opacity: 1; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes trailFade {
          0% { height: 0; opacity: 0.6; }
          50% { height: 200px; opacity: 0.3; }
          100% { height: 400px; opacity: 0; }
        }
      `}</style>

      {/* Stars background */}
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: "white",
          top: `${(i * 37 + 10) % 90}%`,
          left: `${(i * 53 + 15) % 95}%`,
          opacity: 0.15,
          animation: `starTwinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}

      <div style={{
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        background: "rgba(10,10,26,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "48px 32px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Error icon / Success state */}
        {launched ? (
          <div style={{ animation: "successPop 0.5s ease-out" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          </div>
        ) : (
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        )}

        <h2 style={{ color: "#f0f0f5", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {launched ? "הדיווח נשלח!" : "אופס, משהו השתבש"}
        </h2>
        <p style={{ color: "rgba(240,240,245,0.6)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          {launched
            ? "תודה! הצוות שלנו מטפל בזה. יתוקן בקרוב."
            : "לא נורא — דברים כאלה קורים. אפשר לדווח וזה יתוקן מהר."
          }
        </p>

        {/* Rocket report button */}
        {!launched && (
          <div style={{ marginBottom: 28, position: "relative" }}>
            <button
              onClick={handleReport}
              disabled={launching}
              style={{
                background: launching
                  ? "linear-gradient(135deg, #FF6B00, #FF3D00)"
                  : "linear-gradient(135deg, #0000FF, #4444FF)",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: launching ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.3s",
                position: "relative",
                overflow: "visible",
                boxShadow: launching
                  ? "0 0 30px rgba(255,61,0,0.4)"
                  : "0 4px 20px rgba(0,0,255,0.3)",
              }}
            >
              {/* Rocket icon */}
              <span style={{
                display: "inline-block",
                fontSize: 22,
                ...(launching ? {
                  animation: "rocketLaunch 2s ease-in forwards",
                } : {}),
              }}>
                🚀
              </span>
              <span style={{
                ...(launching ? { animation: "rocketShake 0.1s linear infinite" } : {}),
              }}>
                {launching ? "משגר דיווח..." : "דווח על באג — אנחנו מתקנים את זה בטיל!"}
              </span>
            </button>

            {/* Smoke effect during launch */}
            {launching && (
              <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 12 + i * 4,
                    height: 12 + i * 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    animation: `smokeRise ${1 + i * 0.2}s ease-out ${i * 0.15}s forwards`,
                  }} />
                ))}
              </div>
            )}

            {/* Trail effect */}
            {launching && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 3,
                background: "linear-gradient(to bottom, rgba(255,100,0,0.5), transparent)",
                animation: "trailFade 2s ease-out forwards",
                borderRadius: 2,
              }} />
            )}
          </div>
        )}

        {/* Error details - collapsible */}
        {!launched && (
          <details style={{ marginBottom: 20, textAlign: "right" }}>
            <summary style={{
              color: "rgba(240,240,245,0.4)",
              fontSize: 12,
              cursor: "pointer",
              marginBottom: 8,
              textAlign: "center",
              listStyle: "none",
            }}>
              <span style={{ borderBottom: "1px dashed rgba(240,240,245,0.2)", paddingBottom: 2 }}>
                פרטים טכניים ▾
              </span>
            </summary>
            <div style={{
              background: "rgba(255,59,48,0.04)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 6,
              padding: "12px 14px",
            }}>
              <p style={{
                fontSize: 12,
                color: "rgba(240,240,245,0.5)",
                lineHeight: 1.5,
                margin: 0,
                wordBreak: "break-word",
                fontFamily: "monospace",
                direction: "ltr",
                textAlign: "left",
              }}>
                {error.digest || error.message?.slice(0, 80) || "Unknown"}
              </p>
              <div style={{ marginTop: 6, fontSize: 10, color: "rgba(240,240,245,0.3)" }}>
                {typeof window !== "undefined" ? window.location.pathname : ""} • {new Date().toLocaleString("he-IL")}
              </div>
            </div>
          </details>
        )}

        {/* empty — no action buttons, user likely can't navigate */}

        {/* Reported confirmation */}
        {reported && (
          <p style={{
            color: "rgba(0,200,83,0.7)",
            fontSize: 12,
            marginTop: 16,
            animation: "successPop 0.4s ease-out",
          }}>
            ✓ הדיווח התקבל — נטפל בזה בהקדם
          </p>
        )}
      </div>
    </div>
  );
}
