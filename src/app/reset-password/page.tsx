"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Always use the tokens from the recovery URL hash, even if the browser
  // already had a session (e.g. the admin is logged in in the same window).
  // Using an existing session would update the wrong user / fail silently.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken) {
        // No hash — maybe Supabase already consumed it into storage. Fall back
        // to getSession, but still require it to exist.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) setReady(true);
        } else if (!cancelled) {
          setError("הקישור לא תקין או פג תוקף. בקש לינק חדש.");
        }
        return;
      }

      if (type && type !== "recovery") {
        if (!cancelled) setError("הקישור אינו קישור לאיפוס סיסמה.");
        return;
      }

      // Drop any existing session first so updateUser targets the recovery
      // session's user, not whoever was already logged in.
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!cancelled) {
        if (error) setError("לא ניתן לאמת את הקישור. בקש לינק חדש.");
        else setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    const { data: { user: currentUser }, error: getErr } = await supabase.auth.getUser();
    if (getErr || !currentUser) {
      setError("הסשן פג. בקש קישור חדש.");
      setLoading(false);
      return;
    }
    const email = currentUser.email;

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Re-authenticate with the fresh password to prove it works + get a normal
    // (non-recovery) session before heading into the app.
    if (email) {
      try {
        await supabase.auth.signOut({ scope: "local" });
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setError(signInErr.message);
          setLoading(false);
          return;
        }
      } catch {}
    }

    router.push("/dashboard");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    color: "#f0f0f5",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050510",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      direction: "rtl",
    }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          marginBottom: 8,
          textShadow: "0 0 40px rgba(0,0,255,0.3)",
        }}>
          הגדרת סיסמה
        </h1>
        <p style={{ textAlign: "center", color: "rgba(240,240,245,0.7)", marginBottom: 32, fontSize: 14 }}>
          בחר סיסמה חדשה לחשבון שלך
        </p>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6,
          padding: "32px 28px",
        }}>
          {!ready ? (
            <div style={{ textAlign: "center", color: "rgba(240,240,245,0.7)", padding: "20px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#0000FF", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              מאמת קישור...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && (
                <div style={{
                  background: "rgba(255,59,48,0.1)",
                  border: "1px solid rgba(255,59,48,0.3)",
                  borderRadius: 4,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#ff6b6b",
                }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  סיסמה חדשה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  style={inputStyle}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  אימות סיסמה
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  style={inputStyle}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px 16px",
                  background: "#0000FF",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4,
                  boxShadow: "0 0 15px rgba(0,0,255,0.2)",
                }}
              >
                {loading ? "שומר..." : "שמור סיסמה"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
