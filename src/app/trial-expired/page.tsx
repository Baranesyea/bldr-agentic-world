"use client";

import Link from "next/link";

export default function TrialExpiredPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #050510 0%, #0a0a2e 50%, #050510 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "40%", left: "50%", transform: "translateX(-50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,0,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        maxWidth: "500px",
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        padding: "56px 44px",
        textAlign: "center",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "24px" }}>⏰</div>

        <h1 style={{
          fontFamily: "var(--font-heading-en)", fontSize: "28px", fontWeight: 700,
          color: "#fff", marginBottom: "12px", lineHeight: 1.3,
        }}>
          תקופת הניסיון שלך הסתיימה
        </h1>

        <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "15px", marginBottom: "8px" }}>
          קישור הגישה שלך כבר לא פעיל.
        </p>
        <p style={{ color: "rgba(240,240,245,0.6)", fontSize: "15px", marginBottom: "36px" }}>
          כדי להמשיך ללמוד, הצטרף לקהילת BLDR:
        </p>

        <a
          href="#"
          style={{
            display: "block",
            width: "100%",
            padding: "16px 32px",
            borderRadius: "4px",
            border: "none",
            background: "#0000FF",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 0 40px rgba(0,0,255,0.3)",
            boxSizing: "border-box",
          }}
        >
          הצטרף למועדון BLDR
        </a>

        <p style={{ color: "rgba(240,240,245,0.4)", fontSize: "14px", marginTop: "16px" }}>
          החל מ-₪99 לחודש
        </p>

        <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
          <Link href="/login" style={{ color: "rgba(240,240,245,0.4)", fontSize: "13px", textDecoration: "none" }}>
            כבר חבר? התחבר
          </Link>
        </div>
      </div>
    </div>
  );
}
