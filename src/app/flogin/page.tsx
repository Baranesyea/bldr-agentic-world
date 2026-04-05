"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { createClient } from "@/lib/supabase";
import { GradientDots } from "@/components/ui/gradient-dots";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";

export default function FreeLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [success, setSuccess] = useState(false);

  // Check if flogin is enabled
  useEffect(() => {
    fetch("/api/flogin/settings")
      .then((r) => r.json())
      .then((data) => {
        setPageEnabled(data.enabled !== false);
      })
      .catch(() => {});
  }, []);

  // Check existing session
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setShowSpinner(false);
    };
    check();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

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
    }, 1500);
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

  if (showSpinner) {
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
    return <LoadingSpinner text="מתחבר..." />;
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
        @keyframes robotFadeIn {
          0% { opacity: 0; }
          30% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#050510",
        display: "flex",
        flexDirection: "row-reverse",
      }}>
        {/* RIGHT HALF — Form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "linear-gradient(135deg, rgba(10,10,30,0.9) 0%, #050510 100%)",
          minHeight: "100vh",
        }}>
          <div style={{
            maxWidth: 420,
            width: "100%",
            animation: "fade-up 0.6s ease-out",
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
                מועדון לאנשים שבונים בעידן האג׳נטי
              </p>
            </div>

            {/* Registration Form */}
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
                כמה פרטים ואתם בפנים!
              </h2>

              {/* Error */}
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
                  style={{ ...inputStyle("email"), direction: email ? "ltr" : "rtl", textAlign: email ? "left" : "right" }}
                  required
                />

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="בחר סיסמה"
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
                      lineHeight: 1,
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setHoveredBtn("login")}
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
                    boxShadow: hoveredBtn === "login"
                      ? "0 0 30px rgba(0,0,255,0.4), 0 0 60px rgba(0,0,255,0.15)"
                      : "0 0 15px rgba(0,0,255,0.2)",
                    transform: hoveredBtn === "login" ? "translateY(-1px)" : "none",
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      נרשם...
                    </span>
                  ) : "קדימה, נתחיל!"}
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
          </div>
        </div>

        {/* LEFT HALF — Spline 3D Robot */}
        <div
          className="login-hero-left"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#050510",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Layer 0: Gradient dots */}
          <GradientDots
            duration={20}
            colorCycleDuration={8}
            dotSize={6}
            spacing={12}
            backgroundColor="#050510"
            style={{ zIndex: 0 }}
          />

          {/* Layer 1: Spline 3D Robot with fade-in */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            animation: "robotFadeIn 2s ease-out forwards",
            opacity: 0,
          }}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>

          {/* Layer 2: Particle text — IN FRONT of robot */}
          <div style={{
            position: "absolute", inset: 0,
            zIndex: 3, pointerEvents: "none",
          }}>
            <ParticleTextEffect
              words={["Welcome to", "Agentic World", "AI Agents", "Agentic Workflows", "Agentic Marketing"]}
              style={{ position: "absolute", inset: 0, opacity: 0.6 }}
            />
            {/* Bottom fade */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
              background: "linear-gradient(to bottom, transparent 0%, #050510 100%)",
            }} />
          </div>

          {/* Layer 3: Spotlight */}
          <Spotlight className="z-10" size={400} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-hero-left {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
