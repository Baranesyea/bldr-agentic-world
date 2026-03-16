"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface PromoLink {
  id: string;
  name: string;
  code: string;
  trialDays: number;
  createdAt: string;
  uses: number;
  status: "active" | "disabled";
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [promoLink, setPromoLink] = useState<PromoLink | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bldr_promo_links");
    if (!stored) { setError("קישור הזמנה לא תקין או שפג תוקפו."); setLoading(false); return; }
    const links: PromoLink[] = JSON.parse(stored);
    const found = links.find(l => l.code === code && l.status === "active");
    if (!found) { setError("קישור הזמנה לא תקין או שפג תוקפו."); setLoading(false); return; }
    setPromoLink(found);
    setLoading(false);
  }, [code]);

  const handleStart = () => {
    if (!promoLink) return;
    // Save trial info
    localStorage.setItem("bldr_trial", JSON.stringify({
      code: promoLink.code,
      startDate: new Date().toISOString(),
      durationDays: promoLink.trialDays,
      active: true,
    }));
    // Increment use count
    const stored = localStorage.getItem("bldr_promo_links");
    if (stored) {
      const links: PromoLink[] = JSON.parse(stored);
      const updated = links.map(l => l.id === promoLink.id ? { ...l, uses: l.uses + 1 } : l);
      localStorage.setItem("bldr_promo_links", JSON.stringify(updated));
    }
    router.push("/dashboard");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#050510" }} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050510",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,0,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        maxWidth: "480px",
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        padding: "48px 40px",
        textAlign: "center",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}>
        {error ? (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>😕</div>
            <h1 style={{ fontFamily: "var(--font-heading-en)", fontSize: "24px", color: "#fff", marginBottom: "12px" }}>
              הקישור לא נמצא
            </h1>
            <p style={{ color: "rgba(240,240,245,0.5)", fontSize: "14px" }}>{error}</p>
          </>
        ) : promoLink && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎉</div>
            <h1 style={{
              fontFamily: "var(--font-heading-en)", fontSize: "28px", fontWeight: 700,
              color: "#fff", marginBottom: "12px", lineHeight: 1.3,
            }}>
              {"הוזמנת ל-BLDR!"}
            </h1>
            <p style={{ color: "rgba(240,240,245,0.6)", fontSize: "16px", marginBottom: "32px" }}>
              קיבלת <span style={{ color: "#fff", fontWeight: 700 }}>{promoLink.trialDays} ימים</span> של גישה חינמית!
            </p>
            <button
              onClick={handleStart}
              style={{
                width: "100%",
                padding: "16px 32px",
                borderRadius: "4px",
                border: "none",
                background: "#0000FF",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 40px rgba(0,0,255,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(0,0,255,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,0,255,0.3)"; }}
            >
              התחל תקופת ניסיון
            </button>
            <p style={{ color: "rgba(240,240,245,0.3)", fontSize: "12px", marginTop: "20px" }}>
              ללא צורך בכרטיס אשראי
            </p>
          </>
        )}
      </div>
    </div>
  );
}
