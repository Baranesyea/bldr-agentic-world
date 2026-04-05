"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function FreeLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingPage, setCheckingPage] = useState(true);
  const [pageEnabled, setPageEnabled] = useState(false);
  const [accessDays, setAccessDays] = useState(7);
  const [success, setSuccess] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/flogin/settings")
      .then((r) => r.json())
      .then((data) => {
        setPageEnabled(data.enabled);
        setAccessDays(data.accessDays || 7);
        setCheckingPage(false);
      })
      .catch(() => setCheckingPage(false));
  }, []);

  // Check existing session
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    check();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Register
    const res = await fetch("/api/flogin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "שגיאה בהרשמה");
      setLoading(false);
      return;
    }

    // Auto-login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("ההרשמה הצליחה אבל ההתחברות נכשלה. נסה להתחבר מעמוד ההתחברות.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focusedInput === name ? "rgba(0,0,255,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 4,
    color: "#f0f0f5",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focusedInput === name ? "0 0 20px rgba(0,0,255,0.15)" : "none",
    boxSizing: "border-box" as const,
  });

  if (checkingPage) {
    return <LoadingSpinner text="טוען..." />;
  }

  if (!pageEnabled) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        direction: "rtl",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            ההרשמה סגורה כרגע
          </h1>
          <p style={{ color: "rgba(240,240,245,0.5)", fontSize: 15 }}>
            הדף הזה אינו פעיל. לפרטים נוספים פנו אלינו.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        direction: "rtl",
      }}>
        <div style={{ textAlign: "center", animation: "fade-up 0.6s ease-out" }}>
          <style>{`@keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            ברוך הבא ל-BLDR!
          </h1>
          <p style={{ color: "rgba(240,240,245,0.7)", fontSize: 15, marginBottom: 8 }}>
            קיבלת גישה חופשית ל-{accessDays} ימים.
          </p>
          <p style={{ color: "rgba(240,240,245,0.4)", fontSize: 13 }}>
            מעביר אותך למערכת...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{
          maxWidth: 420,
          width: "100%",
          animation: "fade-up 0.6s ease-out",
          direction: "rtl",
        }}>
          {/* Title */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Robot Heroes', sans-serif",
              fontSize: 42,
              fontWeight: 400,
              color: "#fff",
              margin: 0,
              textShadow: "0 0 40px rgba(0,0,255,0.3), 0 0 80px rgba(0,0,255,0.15)",
              lineHeight: 1.2,
            }}>
              Agentic World
            </h1>
            <p style={{
              fontSize: 14,
              color: "rgba(240,240,245,0.7)",
              marginTop: 12,
              lineHeight: 1.7,
            }}>
              הירשם וקבל גישה חופשית ל-{accessDays} ימים
            </p>
          </div>

          {/* Form */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            padding: "32px 28px",
            backdropFilter: "blur(20px)",
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f0f0f5",
              marginTop: 0,
              marginBottom: 24,
            }}>
              הרשמה חופשית
            </h2>

            {error && (
              <div style={{
                background: "rgba(255,59,48,0.1)",
                border: "1px solid rgba(255,59,48,0.3)",
                borderRadius: 4,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#ff6b6b",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="text"
                placeholder="שם מלא"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedInput("name")}
                onBlur={() => setFocusedInput(null)}
                style={inputStyle("name")}
                required
              />

              <input
                type="email"
                placeholder="כתובת אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                style={{
                  ...inputStyle("email"),
                  direction: email ? "ltr" : "rtl",
                  textAlign: email ? "left" : "right",
                }}
                required
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="בחר סיסמה (לפחות 6 תווים)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  style={{ ...inputStyle("password"), paddingLeft: 48 }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(240,240,245,0.7)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 13,
                  }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setHoveredBtn("submit")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: loading ? "rgba(0,0,255,0.5)" : "#0000FF",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4,
                  transition: "box-shadow 0.2s, background 0.2s, transform 0.15s",
                  boxShadow: hoveredBtn === "submit"
                    ? "0 0 30px rgba(0,0,255,0.4), 0 0 60px rgba(0,0,255,0.15)"
                    : "0 0 15px rgba(0,0,255,0.2)",
                  transform: hoveredBtn === "submit" ? "translateY(-1px)" : "none",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    נרשם...
                  </span>
                ) : "הירשם בחינם"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", margin: 0 }}>
                כבר יש לך חשבון?{" "}
                <a href="/login" style={{ color: "#f0f0f5", fontWeight: 700, textDecoration: "none" }}>
                  התחבר
                </a>
              </p>
            </div>
          </div>

          <p style={{
            textAlign: "center",
            color: "rgba(240,240,245,0.3)",
            fontSize: 12,
            marginTop: 24,
          }}>
            גישה חופשית ל-{accessDays} ימים · ללא כרטיס אשראי
          </p>
        </div>
      </div>
    </>
  );
}
