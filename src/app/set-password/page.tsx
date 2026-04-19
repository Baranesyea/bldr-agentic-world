"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";

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
    <>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Robot Heroes', sans-serif",
            fontSize: 42,
            fontWeight: 400,
            color: "#fff",
            margin: 0,
            textShadow: "0 0 40px rgba(0,0,255,0.3), 0 0 80px rgba(0,0,255,0.15)",
            lineHeight: 1.2,
          }}
        >
          Agentic World
        </h1>
        <p style={{ fontSize: 14, color: "rgba(240,240,245,0.7)", marginTop: 12, lineHeight: 1.7 }}>
          מועדון לאנשים שבונים בעידן האג׳נטי
        </p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          padding: "32px 28px",
          backdropFilter: "blur(20px)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#f0f0f5",
            marginTop: 0,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          הגדרת סיסמה
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(240,240,245,0.6)",
            textAlign: "center",
            lineHeight: 1.7,
            marginTop: 0,
            marginBottom: 24,
          }}
        >
          לחץ על הכפתור כדי לעבור להגדרת הסיסמה שלך.
        </p>

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
    </>
  );
}

export default function SetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <SetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
