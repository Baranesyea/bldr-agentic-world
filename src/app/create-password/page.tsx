"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function CreatePasswordForm() {
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

  const [validEmail, setValidEmail] = useState<boolean | null>(null);
  useEffect(() => {
    if (!email) { setValidEmail(false); return; }
    supabase.from("subscribers").select("id").eq("email", email).single()
      .then(({ data }) => setValidEmail(!!data));
  }, [email, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password.length < 6) { setError("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    if (password !== confirmPassword) { setError("הסיסמאות לא תואמות"); return; }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split("@")[0] } } });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    setSuccess("החשבון נוצר בהצלחה! מעביר להתחברות...");
    setTimeout(() => router.push("/login"), 2000);
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focusedInput === name ? "rgba(0,0,255,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 12, color: "#f0f0f5", fontSize: 15, outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focusedInput === name ? "0 0 20px rgba(0,0,255,0.15)" : "none",
    boxSizing: "border-box" as const,
  });

  return (
    <div style={{ maxWidth: 440, width: "100%", animation: "fade-up 0.6s ease-out" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-merriweather), 'Merriweather', serif",
          fontSize: 32, fontWeight: 700, color: "#fff", margin: 0,
          textShadow: "0 0 40px rgba(0,0,255,0.3)", lineHeight: 1.2,
        }}>
          Agentic World
        </h1>
        <p style={{ fontSize: 15, color: "rgba(240,240,245,0.6)", marginTop: 12, lineHeight: 1.7 }}>
          צור סיסמה כדי להתחבר
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20, padding: "32px 28px", backdropFilter: "blur(20px)",
      }}>
        {validEmail === false && (
          <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 14, color: "#ff6b6b", lineHeight: 1.6 }}>
            {!email ? "חסר פרמטר אימייל. השתמש בקישור ממייל האישור." : "האימייל לא נמצא ברשימת הנרשמים. פנה לתמיכה."}
          </div>
        )}
        {validEmail === null && <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(240,240,245,0.5)", fontSize: 14 }}>מאמת אימייל...</div>}
        {success && <div style={{ background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00C853" }}>{success}</div>}
        {error && <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ff6b6b" }}>{error}</div>}

        {validEmail && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>אימייל</label>
              <input type="email" value={email} readOnly style={{ ...inputStyle("ro"), opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>סיסמה</label>
              <input type="password" placeholder="לפחות 6 תווים" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedInput("pw")} onBlur={() => setFocusedInput(null)} style={inputStyle("pw")} required minLength={6} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 6, display: "block" }}>אימות סיסמה</label>
              <input type="password" placeholder="הזן שוב" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedInput("cpw")} onBlur={() => setFocusedInput(null)} style={inputStyle("cpw")} required minLength={6} />
            </div>
            <button type="submit" disabled={loading} onMouseEnter={() => setHoveredBtn(true)} onMouseLeave={() => setHoveredBtn(false)} style={{
              width: "100%", padding: "14px 16px", background: loading ? "rgba(0,0,255,0.5)" : "#0000FF",
              border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
              transition: "box-shadow 0.2s, background 0.2s, transform 0.15s",
              boxShadow: hoveredBtn ? "0 0 30px rgba(0,0,255,0.4)" : "0 0 15px rgba(0,0,255,0.2)",
              transform: hoveredBtn ? "translateY(-1px)" : "none",
            }}>
              {loading ? "יוצר חשבון..." : "צור חשבון"}
            </button>
          </form>
        )}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.5)", margin: 0 }}>
            כבר יש לך חשבון?{" "}
            <span onClick={() => router.push("/login")} style={{ color: "#3333FF", cursor: "pointer", fontWeight: 700 }}>התחבר</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#050510", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <Suspense fallback={<div style={{ color: "rgba(240,240,245,0.5)" }}>טוען...</div>}>
          <CreatePasswordForm />
        </Suspense>
      </div>
    </>
  );
}
