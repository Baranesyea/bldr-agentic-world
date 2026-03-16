"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function CreatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email] = useState(emailParam.toLowerCase().trim());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState(false);

  const supabase = createClient();

  // Verify email exists in subscribers
  const [validEmail, setValidEmail] = useState<boolean | null>(null);
  useEffect(() => {
    if (!email) {
      setValidEmail(false);
      return;
    }
    supabase
      .from("subscribers")
      .select("id")
      .eq("email", email)
      .single()
      .then(({ data }) => {
        setValidEmail(!!data);
      });
  }, [email, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: email.split("@")[0] },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess("Account created successfully! Redirecting to login...");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(0,0,255,0.2); }
          50% { box-shadow: 0 0 60px rgba(0,0,255,0.4); }
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
          maxWidth: 440,
          width: "100%",
          animation: "fade-up 0.6s ease-out",
        }}>
          {/* Title */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(0,0,255,0.1)",
              border: "1px solid rgba(0,0,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="rgba(100,100,255,0.8)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h1 style={{
              fontFamily: "var(--font-merriweather), 'Merriweather', serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              textShadow: "0 0 40px rgba(0,0,255,0.3)",
              lineHeight: 1.2,
            }}>
              Agentic World
            </h1>
            <p style={{
              fontSize: 15,
              color: "rgba(240,240,245,0.6)",
              marginTop: 12,
              lineHeight: 1.7,
              direction: "rtl",
            }}>
              Create your password to get started
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: "32px 28px",
            backdropFilter: "blur(20px)",
          }}>
            {validEmail === false && (
              <div style={{
                background: "rgba(255,59,48,0.1)",
                border: "1px solid rgba(255,59,48,0.3)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 20,
                fontSize: 14,
                color: "#ff6b6b",
                direction: "rtl",
                lineHeight: 1.6,
              }}>
                {!email
                  ? "Missing email parameter. Please use the link from your payment confirmation."
                  : "This email was not found in our subscriber list. Please contact support."}
              </div>
            )}

            {validEmail === null && (
              <div style={{
                textAlign: "center",
                padding: "20px 0",
                color: "rgba(240,240,245,0.5)",
                fontSize: 14,
              }}>
                Verifying email...
              </div>
            )}

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

            {validEmail && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    style={{
                      ...inputStyle("email-readonly"),
                      opacity: 0.6,
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    style={inputStyle("password")}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedInput("confirm")}
                    onBlur={() => setFocusedInput(null)}
                    style={inputStyle("confirm")}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setHoveredBtn(true)}
                  onMouseLeave={() => setHoveredBtn(false)}
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
                    boxShadow: hoveredBtn
                      ? "0 0 30px rgba(0,0,255,0.4), 0 0 60px rgba(0,0,255,0.15)"
                      : "0 0 15px rgba(0,0,255,0.2)",
                    transform: hoveredBtn ? "translateY(-1px)" : "none",
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>
            )}

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", margin: 0 }}>
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/login")}
                  style={{ color: "#3333FF", cursor: "pointer", fontWeight: 700 }}
                >
                  Log in
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
