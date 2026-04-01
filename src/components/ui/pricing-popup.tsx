"use client";

interface PricingPopupProps {
  onClose: () => void;
}

const features = [
  "שישה מודולי לימוד כולל קורס UX שאין בשום מקום אחר",
  "קהילה פעילה וקבוצת עבודה קטנה של 5 אנשים",
  "שיחה חיה פעם בשבוע עם שאלות ותשובות בזמן אמת",
  "עדכונים שוטפים ותכנים חדשים כל הזמן",
  "המחיר נעול לנצח",
];

export function PricingPopup({ onClose }: PricingPopupProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        padding: "16px",
      }}
    >
      <style>{`
        @keyframes pricingIn { from { opacity: 0; transform: scale(0.9) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0a0a1a", borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "40px 32px", width: "100%", maxWidth: "860px",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          animation: "pricingIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          direction: "rtl", position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "16px", left: "16px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%", width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(240,240,245,0.7)", fontSize: "18px",
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", marginBottom: "10px" }}>
            93% מהאנשים לא עושים שינוי בגלל הפחד
          </h2>
          <p style={{ color: "rgba(240,240,245,0.7)", fontSize: "14px", lineHeight: 1.6 }}>
            הפחד היחיד הוא: מה יקרה אם לא נעשה את הצעד
            <br />
            וכדי לעזור לך לעשות שינוי, אפשר להצטרף בשני מסלולים. מסלול חודשי זול ומסלול שנתי זול באופן קיצוני
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Annual — featured */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "2px solid rgba(0,0,255,0.5)",
            borderRadius: "12px", padding: "28px 24px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
              background: "#0000FF", color: "#fff", fontSize: "11px", fontWeight: 700,
              padding: "4px 14px", borderRadius: "20px", whiteSpace: "nowrap",
            }}>
              הכי משתלם
            </div>

            <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
              מסלול <strong>שנתי</strong> זול באופן קיצוני
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "48px", fontWeight: 900, color: "#fff" }}>110</span>
              <span style={{ fontSize: "16px", color: "rgba(240,240,245,0.7)" }}>₪ לחודש</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "12px" }}>
              חודשיים מתנה בהצטרפות במחיר 1,320 ₪
            </p>
            <div style={{
              display: "inline-block", background: "rgba(34,197,94,0.15)", color: "#22c55e",
              fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", marginBottom: "20px",
            }}>
              חיסכון של 324 ₪ לשנה
            </div>

            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>חודשיים מתנה</p>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                <span style={{ color: "#0000FF", flexShrink: 0, marginTop: "2px" }}>✓</span>
                <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}

            <button
              onClick={() => window.open("https://bldr.co.il", "_blank")}
              style={{
                width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                background: "#0000FF", color: "#fff", fontSize: "15px", fontWeight: 700,
                cursor: "pointer", marginTop: "16px",
                boxShadow: "0 4px 20px rgba(0,0,255,0.4)",
              }}
            >
              אני רוצה להצטרף בזול
            </button>
          </div>

          {/* Monthly */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "28px 24px",
          }}>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
              מסלול <strong>חודשי</strong> זול
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "48px", fontWeight: 900, color: "#fff" }}>137</span>
              <span style={{ fontSize: "16px", color: "rgba(240,240,245,0.7)" }}>₪ לחודש</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", marginBottom: "32px" }}>
              אין התחייבות. אפשר לעזוב מתי שרוצים.
            </p>

            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                <span style={{ color: "rgba(240,240,245,0.7)", flexShrink: 0, marginTop: "2px" }}>✓</span>
                <span style={{ fontSize: "13px", color: "rgba(240,240,245,0.7)", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}

            <button
              onClick={() => window.open("https://bldr.co.il", "_blank")}
              style={{
                width: "100%", padding: "14px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)", color: "#fff",
                fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "16px",
              }}
            >
              אני רוצה להצטרף
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(240,240,245,0.7)", marginTop: "20px" }}>
          לא מרגיש שקיבלת ערך? נחזיר לך את הכסף באהבה גדולה.
        </p>
      </div>
    </div>
  );
}
