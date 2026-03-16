"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { createClient } from "@/lib/supabase";
import { GradientDots } from "@/components/ui/gradient-dots";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split("@")[0] },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSuccess("נרשמת בהצלחה! בדוק את האימייל לאימות.");
      setLoading(false);
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "אימייל או סיסמה שגויים" : error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focusedInput === name ? "rgba(0,0,255,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 12,
    color: "#f0f0f5",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focusedInput === name ? "0 0 20px rgba(0,0,255,0.15)" : "none",
    boxSizing: "border-box" as const,
  });

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
                fontFamily: "var(--font-merriweather), 'Merriweather', serif",
                fontSize: 42,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                textShadow: "0 0 40px rgba(0,0,255,0.3), 0 0 80px rgba(0,0,255,0.15)",
                lineHeight: 1.2,
              }}>
                Agentic World
              </h1>
              <p style={{
                fontSize: 14,
                color: "rgba(240,240,245,0.5)",
                marginTop: 12,
                lineHeight: 1.7,
              }}>
                מועדון לאנשים שבונים בעידן האג׳נטי
              </p>
            </div>

            {/* Login Form */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
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
                {mode === "login" ? "התחברות" : "הרשמה"}
              </h2>

              {/* Success */}
              {success && (
                <div style={{
                  background: "rgba(0,200,83,0.1)",
                  border: "1px solid rgba(0,200,83,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#00C853",
                }}>
                  {success}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background: "rgba(255,59,48,0.1)",
                  border: "1px solid rgba(255,59,48,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#ff6b6b",
                }}>
                  {error}
                </div>
              )}

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                onMouseEnter={() => setHoveredBtn("google")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "#fff",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  transition: "box-shadow 0.2s, transform 0.15s",
                  boxShadow: hoveredBtn === "google"
                    ? "0 4px 24px rgba(255,255,255,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                  transform: hoveredBtn === "google" ? "translateY(-1px)" : "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                המשך עם Google
              </button>

              {/* Divider */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                margin: "24px 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 13, color: "rgba(240,240,245,0.35)" }}>או</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <input
                    type="text"
                    placeholder="שם מלא"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                    style={inputStyle("name")}
                  />
                )}

                <input
                  type="email"
                  placeholder="כתובת אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  style={inputStyle("email")}
                  required
                />

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="סיסמה"
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
                      color: "rgba(240,240,245,0.4)",
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
                    borderRadius: 12,
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
                      {mode === "login" ? "מתחבר..." : "נרשם..."}
                    </span>
                  ) : mode === "login" ? "התחבר" : "הירשם"}
                </button>
              </form>

              {/* Links */}
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", margin: "0 0 10px" }}>
                  {mode === "login" ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{" "}
                  <span
                    onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
                    style={{ color: "#3333FF", cursor: "pointer", fontWeight: 700 }}
                  >
                    {mode === "login" ? "הירשם" : "התחבר"}
                  </span>
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
