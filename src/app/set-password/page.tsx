"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!token) {
      setError("חסר טוקן בקישור.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-link/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "הקישור לא תקין או פג תוקף.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("שגיאת רשת. נסה שוב.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, width: "100%" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          marginBottom: 8,
          textShadow: "0 0 40px rgba(0,0,255,0.3)",
        }}
      >
        הגדרת סיסמה
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "rgba(240,240,245,0.7)",
          marginBottom: 32,
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        לחץ על הכפתור כדי לעבור להגדרת הסיסמה.
      </p>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          padding: "32px 28px",
        }}
      >
        {error && (
          <div
            style={{
              background: "rgba(255,59,48,0.1)",
              border: "1px solid rgba(255,59,48,0.3)",
              borderRadius: 4,
              padding: "10px 14px",
              fontSize: 13,
              color: "#ff6b6b",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 18px",
            background: "#0000FF",
            border: "none",
            borderRadius: 4,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 0 15px rgba(0,0,255,0.2)",
          }}
        >
          {loading ? "פותח..." : "פתח טופס סיסמה"}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "rgba(240,240,245,0.4)",
            marginTop: 14,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          הקישור חד-פעמי. אחרי הלחיצה, לא ניתן להשתמש בו שוב.
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        direction: "rtl",
      }}
    >
      <Suspense fallback={null}>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
